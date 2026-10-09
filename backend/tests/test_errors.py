"""Automated tests for unified error formatting conforming to ApiErrorPayload."""

from fastapi import APIRouter
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.core.config import Settings
from app.main import create_app


def test_404_error_response_conforms_to_schema(client: TestClient) -> None:
    """Verify 404 error responses follow the standardized ApiErrorResponse schema."""
    response = client.get("/non-existent-endpoint")
    assert response.status_code == 404

    payload = response.json()
    assert "message" in payload
    assert payload["status"] == 404
    assert payload["code"] == "HTTP_404"
    assert "timestamp" in payload
    assert "details" in payload
    assert payload["details"]["path"] == "/non-existent-endpoint"


def test_422_validation_error_response_conforms_to_schema() -> None:
    """Verify that request validation errors return 422 with the standardized schema."""
    router = APIRouter()

    class SampleBody(BaseModel):
        frequency_mhz: float

    @router.post("/test-validation")
    async def sample_endpoint(body: SampleBody) -> dict:
        return {"received": body.frequency_mhz}

    cfg = Settings(environment="test", debug=False)
    app = create_app(custom_settings=cfg)
    app.include_router(router)

    with TestClient(app) as custom_client:
        # Send invalid payload (string instead of float)
        response = custom_client.post("/test-validation", json={"frequency_mhz": "not-a-number"})
        assert response.status_code == 422

        payload = response.json()
        assert payload["status"] == 422
        assert payload["code"] == "VALIDATION_ERROR"
        assert "validation" in payload["message"].lower()
        assert "errors" in payload["details"]


def test_500_internal_error_response_conforms_to_schema() -> None:
    """Verify that unhandled exceptions produce 500 with sanitized message in production mode."""
    router = APIRouter()

    @router.get("/trigger-crash")
    async def crash_endpoint() -> None:
        raise RuntimeError("Synthetic simulated hardware fault")

    # Production mode should not leak internal error message
    prod_cfg = Settings(environment="production", debug=False)
    app = create_app(custom_settings=prod_cfg)
    app.include_router(router)

    with TestClient(app, raise_server_exceptions=False) as custom_client:
        response = custom_client.get("/trigger-crash")
        assert response.status_code == 500

        payload = response.json()
        assert payload["status"] == 500
        assert payload["code"] == "INTERNAL_SERVER_ERROR"
        assert (
            payload["message"] == "An unexpected server error occurred during telemetry processing."
        )
        assert payload["details"] is None
