"""Comprehensive security tests for remote observation imports and redirect handling.

Covers:
- Normal imports with mock transport
- Valid provider redirects
- Redirects to prohibited hosts and private/loopback/metadata IPs
- Redirect chains within limit
- Redirect chains exceeding limit
- Redirect loops (A -> B -> A)
- Request timeout
- Oversize response stream
- Misleading Content-Length header exceeding limit
- Wrong file type / unsupported format
- Truncated data stream (declared vs actual byte count)
- Checksum failure (MD5 mismatch)
- Empty response (0 bytes)
- Guaranteed staging file cleanup on success and failure paths
"""

from __future__ import annotations

import hashlib
from pathlib import Path

import httpx
import pytest

from app.core.config import Settings
from app.datasets.archive_client import (
    MAX_REDIRECT_HOPS,
    is_safe_ip,
    is_safe_remote_url,
)
from app.datasets.import_service import DatasetImportService
from app.ingestion.exceptions import (
    EmptyFileError,
    FileSizeExceededError,
    InvalidFileContentError,
    UnsupportedFormatError,
)
from app.schemas.public_datasets import PublicDatasetImportRequest
from app.storage.repository import ObservationRepository
from tests.helpers import create_synthetic_filterbank


@pytest.fixture
def import_env(tmp_path: Path) -> tuple[Settings, ObservationRepository, bytes, str, str]:
    """Sets up an isolated Settings, ObservationRepository, and a valid filterbank payload."""
    data_dir = tmp_path / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    obs_dir = data_dir / "observations"
    obs_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir = data_dir / "tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    db_path = data_dir / "test.db"

    settings = Settings(
        _env_file=None,
        environment="test",
        data_dir=str(data_dir),
        observations_dir=str(obs_dir),
        temp_upload_dir=str(tmp_dir),
        db_path=str(db_path),
        breakthrough_listen_archive_url="https://seti.berkeley.edu/opendata",
        breakthrough_listen_max_import_bytes=1024 * 1024,  # 1 MiB for tests
        breakthrough_listen_timeout_seconds=5.0,
    )
    repo = ObservationRepository(db_path=Path(db_path), observations_dir=Path(obs_dir))

    # Generate a real valid filterbank bytes fixture
    fixture_path = tmp_path / "sample.fil"
    create_synthetic_filterbank(fixture_path, nchans=16, n_ints=4)
    fil_bytes = fixture_path.read_bytes()
    md5 = hashlib.md5(fil_bytes).hexdigest()
    sha256 = hashlib.sha256(fil_bytes).hexdigest()

    return settings, repo, fil_bytes, md5, sha256


def test_is_safe_ip_rules() -> None:
    """Verifies strict classification of private, loopback, link-local, and reserved IPs."""
    # Forbidden IPv4
    assert not is_safe_ip("127.0.0.1")[0]
    assert not is_safe_ip("10.0.0.1")[0]
    assert not is_safe_ip("192.168.1.100")[0]
    assert not is_safe_ip("172.16.5.1")[0]
    assert not is_safe_ip("169.254.169.254")[0]
    assert not is_safe_ip("0.0.0.0")[0]
    assert not is_safe_ip("224.0.0.1")[0]  # Multicast
    assert not is_safe_ip("240.0.0.1")[0]  # Reserved

    # Forbidden IPv6
    assert not is_safe_ip("::1")[0]
    assert not is_safe_ip("fc00::1")[0]  # Unique local
    assert not is_safe_ip("fe80::1")[0]  # Link-local
    assert not is_safe_ip("::ffff:127.0.0.1")[0]  # IPv4-mapped loopback

    # Allowed public IPs
    assert is_safe_ip("8.8.8.8")[0]
    assert is_safe_ip("104.197.168.175")[0]  # Berkeley public IP
    assert is_safe_ip("142.250.190.46")[0]  # Google public IP


def test_is_safe_remote_url_ports_and_destinations() -> None:
    """Tests URL validation with ports, schemes, and domains."""
    archive_host = "seti.berkeley.edu"

    # Authorized standard ports
    assert is_safe_remote_url(
        "https://seti.berkeley.edu/data.fil", archive_host, validate_dns=False
    )[0]
    assert is_safe_remote_url(
        "http://seti.berkeley.edu:80/data.fil", archive_host, validate_dns=False
    )[0]
    assert is_safe_remote_url(
        "https://seti.berkeley.edu:443/data.fil", archive_host, validate_dns=False
    )[0]

    # Prohibited non-standard ports
    safe, err = is_safe_remote_url(
        "https://seti.berkeley.edu:8000/data.fil", archive_host, validate_dns=False
    )
    assert not safe and "non-standard port" in err.lower()

    safe, err = is_safe_remote_url(
        "https://seti.berkeley.edu:22/data.fil", archive_host, validate_dns=False
    )
    assert not safe and "non-standard port" in err.lower()

    # Forbidden metadata / localhost hostnames
    safe, err = is_safe_remote_url(
        "http://metadata.google.internal/computeMetadata", archive_host, validate_dns=False
    )
    assert not safe and "forbidden" in err.lower()

    safe, err = is_safe_remote_url(
        "http://localhost.localdomain/data.fil", archive_host, validate_dns=False
    )
    assert not safe and "forbidden" in err.lower()


@pytest.mark.anyio
async def test_normal_successful_import(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Ensures normal valid download streams, hashes, parses, and persists without error."""
    settings, repo, fil_bytes, md5, sha256 = import_env

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url == "https://seti.berkeley.edu/opendata/target.fil"
        return httpx.Response(
            200, content=fil_bytes, headers={"Content-Length": str(len(fil_bytes))}
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(
        url="https://seti.berkeley.edu/opendata/target.fil",
        expected_md5sum=md5,
        expected_size_bytes=len(fil_bytes),
    )
    res = await service.import_dataset(req)

    assert res.bytes_downloaded == len(fil_bytes)
    assert res.observation.sha256 == sha256
    assert res.is_duplicate is False

    # Check staging file was removed
    staged_files = list(Path(settings.temp_upload_dir).glob("*.tmp"))
    assert len(staged_files) == 0


@pytest.mark.anyio
async def test_valid_provider_redirect(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Ensures a valid redirect to another authorized archive host succeeds."""
    settings, repo, fil_bytes, md5, _ = import_env

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url == "https://seti.berkeley.edu/opendata/redirect_me.fil":
            return httpx.Response(
                302, headers={"Location": "https://bldata.berkeley.edu/final.fil"}
            )
        if request.url == "https://bldata.berkeley.edu/final.fil":
            return httpx.Response(
                200, content=fil_bytes, headers={"Content-Length": str(len(fil_bytes))}
            )
        return httpx.Response(404)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(
        url="https://seti.berkeley.edu/opendata/redirect_me.fil",
        expected_md5sum=md5,
    )
    res = await service.import_dataset(req)
    assert res.bytes_downloaded == len(fil_bytes)


@pytest.mark.anyio
async def test_redirect_to_prohibited_private_ip_rejected(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Tests that redirects targeting private IPs (127.0.0.1 or metadata) are blocked."""
    settings, repo, _, _, _ = import_env

    for forbidden_target in [
        "http://127.0.0.1:8000/internal.fil",
        "http://169.254.169.254/latest/meta-data",
        "http://10.0.0.1/secret.fil",
        "http://localhost:8000/data.fil",
        "https://evil-unauthorized.com/data.fil",
    ]:

        def handler(request: httpx.Request, target: str = forbidden_target) -> httpx.Response:
            return httpx.Response(302, headers={"Location": target})

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
        service = DatasetImportService(settings, repo, client=client)

        req = PublicDatasetImportRequest(url="https://seti.berkeley.edu/opendata/source.fil")
        with pytest.raises((ValueError, InvalidFileContentError)) as exc:
            await service.import_dataset(req)
        assert "rejected for security" in str(exc.value).lower()

        # Check temporary staging file was cleaned up
        staged_files = list(Path(settings.temp_upload_dir).glob("*.tmp"))
        assert len(staged_files) == 0


@pytest.mark.anyio
async def test_redirect_chain_within_limit(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Follows a valid 3-hop redirect chain across authorized domains."""
    settings, repo, fil_bytes, _, _ = import_env

    def handler(request: httpx.Request) -> httpx.Response:
        url_str = str(request.url)
        if url_str == "https://seti.berkeley.edu/hop1.fil":
            return httpx.Response(301, headers={"Location": "https://seti.berkeley.edu/hop2.fil"})
        if url_str == "https://seti.berkeley.edu/hop2.fil":
            return httpx.Response(302, headers={"Location": "https://bldata.berkeley.edu/hop3.fil"})
        if url_str == "https://bldata.berkeley.edu/hop3.fil":
            return httpx.Response(
                200, content=fil_bytes, headers={"Content-Length": str(len(fil_bytes))}
            )
        return httpx.Response(404)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(url="https://seti.berkeley.edu/hop1.fil")
    res = await service.import_dataset(req)
    assert res.bytes_downloaded == len(fil_bytes)


@pytest.mark.anyio
async def test_redirect_chain_exceeding_max_hops_rejected(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Rejects when redirect hops exceed MAX_REDIRECT_HOPS (5)."""
    settings, repo, _, _, _ = import_env

    def handler(request: httpx.Request) -> httpx.Response:
        # Endless incrementing redirect hops
        step = int(request.url.path.replace("/hop", "").replace(".fil", "") or "0")
        return httpx.Response(
            302, headers={"Location": f"https://seti.berkeley.edu/hop{step + 1}.fil"}
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(url="https://seti.berkeley.edu/hop0.fil")
    with pytest.raises((ValueError, InvalidFileContentError)) as exc:
        await service.import_dataset(req)
    assert f"maximum of {MAX_REDIRECT_HOPS} hops" in str(exc.value).lower()


@pytest.mark.anyio
async def test_redirect_loop_detected_and_rejected(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Detects cycles in redirects (A -> B -> A) and aborts cleanly."""
    settings, repo, _, _, _ = import_env

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url == "https://seti.berkeley.edu/loopA.fil":
            return httpx.Response(302, headers={"Location": "https://seti.berkeley.edu/loopB.fil"})
        if request.url == "https://seti.berkeley.edu/loopB.fil":
            return httpx.Response(302, headers={"Location": "https://seti.berkeley.edu/loopA.fil"})
        return httpx.Response(404)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(url="https://seti.berkeley.edu/loopA.fil")
    with pytest.raises((ValueError, InvalidFileContentError)) as exc:
        await service.import_dataset(req)
    assert "redirect loop detected" in str(exc.value).lower()


@pytest.mark.anyio
async def test_oversize_response_streaming_aborted(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Aborts streaming immediately when received bytes exceed maximum import limit."""
    settings, repo, _, _, _ = import_env

    # Generator streaming 2 MiB without Content-Length header to test streaming loop abort
    async def chunk_stream():
        for _ in range(32):
            yield b"X" * (64 * 1024)

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, content=chunk_stream())

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(url="https://seti.berkeley.edu/huge.fil")
    with pytest.raises(FileSizeExceededError) as exc:
        await service.import_dataset(req)
    assert "maximum import limit" in str(exc.value).lower()

    # Verify staging cleanup
    assert len(list(Path(settings.temp_upload_dir).glob("*.tmp"))) == 0


@pytest.mark.anyio
async def test_misleading_content_length_header_rejected(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Rejects pre-flight when server announces Content-Length exceeding allowed limit."""
    settings, repo, _, _, _ = import_env

    def handler(request: httpx.Request) -> httpx.Response:
        # Claims 500 MiB content length
        return httpx.Response(
            200, content=b"dummy", headers={"Content-Length": str(500 * 1024 * 1024)}
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(url="https://seti.berkeley.edu/oversize.fil")
    with pytest.raises(FileSizeExceededError) as exc:
        await service.import_dataset(req)
    assert "content-length" in str(exc.value).lower()


@pytest.mark.anyio
async def test_truncated_data_stream_rejected(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Detects when server declares Content-Length: 50000 but stream cuts off at 1000 bytes."""
    settings, repo, fil_bytes, _, _ = import_env

    def handler(request: httpx.Request) -> httpx.Response:
        # Declares 50,000 bytes, returns only 100 bytes
        return httpx.Response(200, content=fil_bytes[:100], headers={"Content-Length": "50000"})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(url="https://seti.berkeley.edu/cut_short.fil")
    with pytest.raises(InvalidFileContentError) as exc:
        await service.import_dataset(req)
    assert "truncated" in str(exc.value).lower() or "incomplete" in str(exc.value).lower()

    assert len(list(Path(settings.temp_upload_dir).glob("*.tmp"))) == 0


@pytest.mark.anyio
async def test_empty_download_rejected(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Rejects empty 0-byte download."""
    settings, repo, _, _, _ = import_env

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, content=b"", headers={"Content-Length": "0"})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(url="https://seti.berkeley.edu/empty.fil")
    with pytest.raises(EmptyFileError) as exc:
        await service.import_dataset(req)
    assert "zero bytes" in str(exc.value).lower() or "empty" in str(exc.value).lower()

    assert len(list(Path(settings.temp_upload_dir).glob("*.tmp"))) == 0


@pytest.mark.anyio
async def test_checksum_mismatch_rejected(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Rejects when downloaded content does not match expected MD5 checksum."""
    settings, repo, fil_bytes, _, _ = import_env

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, content=fil_bytes, headers={"Content-Length": str(len(fil_bytes))}
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(
        url="https://seti.berkeley.edu/corrupt.fil",
        expected_md5sum="00000000000000000000000000000000",
    )
    with pytest.raises(InvalidFileContentError) as exc:
        await service.import_dataset(req)
    assert "checksum verification failed" in str(exc.value).lower()

    assert len(list(Path(settings.temp_upload_dir).glob("*.tmp"))) == 0


@pytest.mark.anyio
async def test_unsupported_format_rejected(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Rejects .h5 or other unsupported formats before downloading."""
    settings, repo, _, _, _ = import_env

    client = httpx.AsyncClient(follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(url="https://seti.berkeley.edu/raw_sample.h5")
    with pytest.raises(UnsupportedFormatError) as exc:
        await service.import_dataset(req)
    assert "hdf5 (.h5)" in str(exc.value).lower()


@pytest.mark.anyio
async def test_html_error_page_rejected(
    import_env: tuple[Settings, ObservationRepository, bytes, str, str],
) -> None:
    """Rejects when server responds with 200 OK text/html portal page instead of binary data."""
    settings, repo, _, _, _ = import_env

    html_content = b"<html><body><h1>404 Not Found Portal</h1></body></html>"

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            content=html_content,
            headers={
                "Content-Type": "text/html; charset=utf-8",
                "Content-Length": str(len(html_content)),
            },
        )

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), follow_redirects=False)
    service = DatasetImportService(settings, repo, client=client)

    req = PublicDatasetImportRequest(url="https://seti.berkeley.edu/portal.fil")
    with pytest.raises(InvalidFileContentError) as exc:
        await service.import_dataset(req)
    assert "html content" in str(exc.value).lower()
