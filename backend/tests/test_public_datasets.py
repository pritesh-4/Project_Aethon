"""Automated unit and integration tests for Breakthrough Listen public dataset explorer."""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

import anyio
import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.datasets.archive_client import ArchiveClient, is_safe_remote_url
from app.datasets.import_service import DatasetImportService
from app.ingestion.exceptions import (
    FileSizeExceededError,
    InvalidFileContentError,
    UnsupportedFormatError,
)
from app.main import app
from app.schemas.public_datasets import PublicDatasetImportRequest
from app.storage.repository import ObservationRepository
from tests.helpers import create_synthetic_filterbank


def test_is_safe_remote_url_validation() -> None:
    """Test strict SSRF protection rules against loopback, private, and unauthorized domains."""
    archive_host = "seti.berkeley.edu"

    # Authorized domains
    assert is_safe_remote_url("https://seti.berkeley.edu/opendata/data/sample.fil", archive_host)[0]
    assert is_safe_remote_url("http://blpd13.ssl.berkeley.edu/borisov/sample.fil", archive_host)[0]
    assert is_safe_remote_url("https://bldata.berkeley.edu/pipeline/sample.fil", archive_host)[0]
    assert is_safe_remote_url("https://storage.googleapis.com/gbt_guppi/sample.fil", archive_host)[
        0
    ]

    # Blocked schemes
    safe, err = is_safe_remote_url("file:///etc/passwd", archive_host)
    assert not safe and "scheme" in err.lower()

    safe, err = is_safe_remote_url("ftp://seti.berkeley.edu/test.fil", archive_host)
    assert not safe and "scheme" in err.lower()

    # Blocked localhost & private IP addresses
    assert not is_safe_remote_url("http://localhost:8000/data.fil", archive_host)[0]
    assert not is_safe_remote_url("http://127.0.0.1:8000/data.fil", archive_host)[0]
    assert not is_safe_remote_url("http://10.0.0.1/data.fil", archive_host)[0]
    assert not is_safe_remote_url("http://192.168.1.1/data.fil", archive_host)[0]
    assert not is_safe_remote_url("http://172.16.0.1/data.fil", archive_host)[0]
    assert not is_safe_remote_url("http://169.254.169.254/latest/meta-data", archive_host)[0]

    # Blocked unauthorized external domains
    safe, err = is_safe_remote_url("https://attacker.evil.com/fake.fil", archive_host)
    assert not safe and "not an authorized" in err.lower()


def test_archive_client_query_normalization() -> None:
    """Verify that raw Breakthrough Listen API responses are normalized into AETHON models."""
    sample_raw = {
        "result": "success",
        "data": [
            {
                "id": 530749,
                "target": "3C123",
                "telescope": "GBT",
                "utc": "Sat, 21 Dec 2019 01:55:44 GMT",
                "mjd": 58838.08037,
                "ra": 69.2725,
                "decl": 29.67169,
                "center_freq": 9376.463,
                "file_type": "filterbank",
                "size": 15000000,
                "quality": "Ungraded",
                "md5sum": "b0b6da64ab22f7a4a7e6dd4939fbff1f",
                "url": "http://blpd13.ssl.berkeley.edu/borisov/sample.gpuspec.0002.fil",
            },
            {
                "id": 96385,
                "target": "0003-066",
                "telescope": "Parkes",
                "utc": "Mon, 16 Oct 2017 14:13:57 GMT",
                "mjd": 58042.593,
                "ra": 1.557,
                "decl": -5.606,
                "center_freq": 3009.09,
                "file_type": "HDF5",
                "size": 95000000,  # Exceeds default 80 MiB
                "quality": "Ungraded",
                "md5sum": "7329df89b37c6072aebc656cb23e86a9",
                "url": "http://blpd8.ssl.berkeley.edu/dl2/Parkes_sample.h5",
            },
        ],
    }

    async def _test() -> None:
        async def mock_handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=sample_raw)

        transport = httpx.MockTransport(mock_handler)
        async with httpx.AsyncClient(transport=transport) as mock_http:
            settings = Settings(
                breakthrough_listen_archive_url="https://seti.berkeley.edu/opendata",
                breakthrough_listen_max_import_bytes=83886080,
                breakthrough_listen_catalog_cache_seconds=300,
            )
            client = ArchiveClient(settings=settings, client=mock_http)
            response = await client.query_files(target="3C123")

            assert response.total == 2
            assert len(response.items) == 2
            assert response.provider_status == "ok"

            # Item 1: Filterbank under size limit
            item1 = response.items[0]
            assert item1.target == "3C123"
            assert item1.telescope == "GBT"
            assert item1.is_compatible is True
            assert item1.is_within_size_limit is True

            # Item 2: HDF5 over size limit
            item2 = response.items[1]
            assert item2.target == "0003-066"
            assert item2.is_compatible is False
            assert "not supported" in (item2.compatibility_reason or "").lower()
            assert item2.is_within_size_limit is False
            assert "exceeds" in (item2.size_reason or "").lower()

    anyio.run(_test)


def test_archive_client_handles_upstream_failure() -> None:
    """Verify that network timeouts and HTTP errors result in graceful unavailable status."""

    async def _test() -> None:
        async def failing_handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ConnectTimeout("Upstream timed out")

        transport = httpx.MockTransport(failing_handler)
        async with httpx.AsyncClient(transport=transport) as mock_http:
            settings = Settings(
                breakthrough_listen_archive_url="https://seti.berkeley.edu/opendata",
            )
            client = ArchiveClient(settings=settings, client=mock_http)

            # Health probe check
            status_res = await client.check_status()
            assert status_res.available is False
            assert "unavailable" in (status_res.message or "").lower()

            # Query response check
            query_res = await client.query_files(target="3C123")
            assert query_res.provider_status == "unavailable"
            assert len(query_res.items) == 0

    anyio.run(_test)


def test_dataset_import_service_end_to_end(tmp_path: Path) -> None:
    """Test streaming remote observation, checksum verification, ingestion, and deduplication."""

    async def _test() -> None:
        db_path = tmp_path / "test_aethon.db"
        obs_dir = tmp_path / "observations"
        temp_dir = tmp_path / "tmp"

        repo = ObservationRepository(db_path=db_path, observations_dir=obs_dir)
        settings = Settings(
            db_path=str(db_path),
            observations_dir=str(obs_dir),
            temp_upload_dir=str(temp_dir),
            breakthrough_listen_archive_url="https://seti.berkeley.edu/opendata",
            breakthrough_listen_max_import_bytes=83886080,
        )

        # Create real synthetic filterbank fixture
        fixture_path = tmp_path / "test_remote.fil"
        create_synthetic_filterbank(fixture_path, nchans=32, n_ints=8, source_name="PULSAR_TEST")
        file_bytes = fixture_path.read_bytes()
        expected_md5 = hashlib.md5(file_bytes).hexdigest()

        async def mock_download_handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=file_bytes)

        transport = httpx.MockTransport(mock_download_handler)
        async with httpx.AsyncClient(transport=transport) as mock_http:
            service = DatasetImportService(settings=settings, repository=repo, client=mock_http)

            # 1. First import: successfully creates new observation record
            req = PublicDatasetImportRequest(
                url="https://seti.berkeley.edu/opendata/data/test_remote.fil",
                target="PULSAR_TEST",
                expected_md5sum=expected_md5,
            )
            res1 = await service.import_dataset(req)

            assert res1.is_duplicate is False
            assert res1.bytes_downloaded == len(file_bytes)
            assert res1.observation.id is not None
            assert res1.observation.metadata.source_name == "PULSAR_TEST"

            # Check repository state
            indexed_obs = repo.get_observation(res1.observation.id)
            assert indexed_obs is not None
            assert indexed_obs.file_size_bytes == len(file_bytes)

            # 2. Duplicate import: verifies deduplication returns existing record
            res2 = await service.import_dataset(req)
            assert res2.is_duplicate is True
            assert res2.observation.id == res1.observation.id

    anyio.run(_test)


def test_dataset_import_service_rejects_unsupported_format(tmp_path: Path) -> None:
    """Verify that unsupported file formats (.h5, .raw) are rejected before download."""

    async def _test() -> None:
        db_path = tmp_path / "test_aethon.db"
        obs_dir = tmp_path / "observations"
        temp_dir = tmp_path / "tmp"

        repo = ObservationRepository(db_path=db_path, observations_dir=obs_dir)
        settings = Settings(
            db_path=str(db_path),
            observations_dir=str(obs_dir),
            temp_upload_dir=str(temp_dir),
        )
        service = DatasetImportService(settings=settings, repository=repo)

        req = PublicDatasetImportRequest(
            url="https://seti.berkeley.edu/opendata/data/unsupported.h5",
            target="TEST",
        )
        with pytest.raises(UnsupportedFormatError):
            await service.import_dataset(req)

    anyio.run(_test)


def test_dataset_import_service_rejects_oversized_file(tmp_path: Path) -> None:
    """Verify that downloads exceeding max_import_bytes are aborted with FileSizeExceededError."""

    async def _test() -> None:
        db_path = tmp_path / "test_aethon.db"
        obs_dir = tmp_path / "observations"
        temp_dir = tmp_path / "tmp"

        repo = ObservationRepository(db_path=db_path, observations_dir=obs_dir)
        settings = Settings(
            db_path=str(db_path),
            observations_dir=str(obs_dir),
            temp_upload_dir=str(temp_dir),
            breakthrough_listen_max_import_bytes=1048576,  # 1 MiB limit
        )

        huge_bytes = b"X" * (2 * 1024 * 1024)  # 2 MiB

        async def mock_oversized_handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=huge_bytes)

        transport = httpx.MockTransport(mock_oversized_handler)
        async with httpx.AsyncClient(transport=transport) as mock_http:
            service = DatasetImportService(settings=settings, repository=repo, client=mock_http)
            req = PublicDatasetImportRequest(
                url="https://seti.berkeley.edu/opendata/data/large.fil",
            )
            with pytest.raises(FileSizeExceededError):
                await service.import_dataset(req)

    anyio.run(_test)


def test_dataset_import_service_rejects_checksum_mismatch(tmp_path: Path) -> None:
    """Verify that an MD5 checksum mismatch aborts the import."""

    async def _test() -> None:
        db_path = tmp_path / "test_aethon.db"
        obs_dir = tmp_path / "observations"
        temp_dir = tmp_path / "tmp"

        repo = ObservationRepository(db_path=db_path, observations_dir=obs_dir)
        settings = Settings(
            db_path=str(db_path),
            observations_dir=str(obs_dir),
            temp_upload_dir=str(temp_dir),
        )

        async def mock_handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=b"SAMPLE_BYTES")

        transport = httpx.MockTransport(mock_handler)
        async with httpx.AsyncClient(transport=transport) as mock_http:
            service = DatasetImportService(settings=settings, repository=repo, client=mock_http)
            req = PublicDatasetImportRequest(
                url="https://seti.berkeley.edu/opendata/data/sample.fil",
                expected_md5sum="bad_md5_hash_00000000000000000",
            )
            with pytest.raises(InvalidFileContentError):
                await service.import_dataset(req)

    anyio.run(_test)


def test_public_datasets_api_endpoints(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test HTTP endpoints for public-datasets using TestClient with mocked upstream."""

    async def mock_request(self: ArchiveClient, endpoint: str, params: dict | None = None) -> Any:
        if "list-file-types" in endpoint:
            return [["filterbank"], ["HDF5"], ["baseband data"]]
        if "query-files" in endpoint:
            return {
                "result": "success",
                "data": [
                    {
                        "id": 101,
                        "target": "3C123",
                        "telescope": "GBT",
                        "file_type": "filterbank",
                        "size": 5000000,
                        "url": "http://blpd13.ssl.berkeley.edu/borisov/sample.fil",
                    }
                ],
            }
        return []

    monkeypatch.setattr(ArchiveClient, "_request", mock_request)

    with TestClient(app) as client:
        # 1. Status endpoint
        resp = client.get("/api/public-datasets/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["configured"] is True
        assert data["available"] is True
        assert "max_import_bytes" in data

        # 2. Query endpoint validation
        query_resp = client.get("/api/public-datasets?limit=10&offset=0")
        assert query_resp.status_code == 200
        q_data = query_resp.json()
        assert len(q_data["items"]) == 1
        assert q_data["items"][0]["target"] == "3C123"
        assert q_data["provider_status"] == "ok"

        # 3. Reject SSRF in import endpoint
        bad_import = client.post(
            "/api/public-datasets/import",
            json={"url": "http://127.0.0.1:8000/internal.fil"},
        )
        assert bad_import.status_code == 400
        assert "security" in bad_import.json()["message"].lower()
