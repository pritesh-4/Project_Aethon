"""Automated tests for Cross-Origin Resource Sharing (CORS) behavior."""

from fastapi.testclient import TestClient


def test_cors_allowed_origin(client: TestClient) -> None:
    """Verify that allowed local Vite origin receives appropriate CORS headers."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "X-Client-Agent,X-Telemetry-Trace",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "access-control-allow-credentials" in response.headers


def test_cors_disallowed_origin(client: TestClient) -> None:
    """Verify that an unauthorized origin does not receive CORS allow origin header."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://unauthorized-external-origin.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.headers.get("access-control-allow-origin") is None
