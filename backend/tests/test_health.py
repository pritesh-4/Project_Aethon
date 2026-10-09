"""Automated tests for health check and OpenAPI documentation endpoints."""

from fastapi.testclient import TestClient

from app.schemas.health import HealthStatus


def test_root_health_endpoint(client: TestClient) -> None:
    """Verify that GET /health returns HTTP 200 with the expected payload schema."""
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "aethon-backend"
    assert data["version"] == "0.1.0-test"
    assert data["environment"] == "test"
    assert "timestamp" in data

    # Validate against Pydantic schema model
    status_obj = HealthStatus.model_validate(data)
    assert status_obj.status == "healthy"
    assert status_obj.service == "aethon-backend"


def test_api_prefix_health_endpoint(client: TestClient) -> None:
    """Verify that GET /api/health returns HTTP 200 matching root health response."""
    response = client.get("/api/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "aethon-backend"
    assert data["version"] == "0.1.0-test"

    status_obj = HealthStatus.model_validate(data)
    assert status_obj.status == "healthy"


def test_openapi_documentation_endpoints(client: TestClient) -> None:
    """Verify OpenAPI and Swagger UI endpoints are accessible."""
    # Test Swagger UI
    docs_resp = client.get("/docs")
    assert docs_resp.status_code == 200
    assert "swagger-ui" in docs_resp.text.lower() or "html" in docs_resp.headers.get(
        "content-type", ""
    )

    # Test ReDoc
    redoc_resp = client.get("/redoc")
    assert redoc_resp.status_code == 200

    # Test OpenAPI JSON schema
    openapi_resp = client.get("/openapi.json")
    assert openapi_resp.status_code == 200
    schema = openapi_resp.json()
    assert schema["info"]["title"] == "AETHON Radio Signal Discovery Test API"
    assert schema["info"]["version"] == "0.1.0-test"
    assert "/health" in schema["paths"]
    assert "/api/health" in schema["paths"]
