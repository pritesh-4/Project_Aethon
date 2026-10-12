#!/usr/bin/env python3
"""AETHON Deployment Smoke-Test Script.

Validates that a deployed or local AETHON FastAPI backend is accessible,
healthy, properly CORS-configured for the deployed frontend origin, and serves
the expected scientific API endpoints.

Usage:
    python scripts/smoke_test_deployment.py --api-url https://api.example.com/api --frontend-origin https://aethon.vercel.app
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


def make_request(
    url: str,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    timeout_sec: float = 10.0,
) -> tuple[int, dict[str, str], bytes]:
    req = urllib.request.Request(url, method=method)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)

    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            resp_headers = {k.lower(): v for k, v in resp.getheaders()}
            return resp.status, resp_headers, resp.read()
    except urllib.error.HTTPError as exc:
        resp_headers = {k.lower(): v for k, v in exc.headers.items()}
        return exc.code, resp_headers, exc.read()
    except Exception as exc:
        raise RuntimeError(f"Connection error to {url}: {exc}") from exc


def run_smoke_test(api_base_url: str, frontend_origin: str) -> bool:
    clean_base = api_base_url.rstrip("/")
    if not clean_base.endswith("/api"):
        clean_base = f"{clean_base}/api"

    print("=" * 60)
    print("AETHON PRODUCTION API SMOKE TEST")
    print(f"Target API Base:      {clean_base}")
    print(f"Frontend Origin:      {frontend_origin}")
    print("=" * 60)

    checks_passed = 0
    checks_total = 5

    # Check 1: Health endpoint
    health_url = f"{clean_base}/health"
    print(f"\n[1/5] Checking Health Endpoint: {health_url}")
    try:
        status, headers, body = make_request(health_url)
        if status == 200:
            payload = json.loads(body.decode("utf-8"))
            if payload.get("status") == "ok":
                print("  [PASS] Backend healthy (status='ok')")
                checks_passed += 1
            else:
                print(f"  [FAIL] Unexpected status payload: {payload}")
        else:
            print(f"  [FAIL] Health check returned HTTP {status}")
    except Exception as exc:
        print(f"  [FAIL] Connection error: {exc}")

    # Check 2: CORS configuration
    print(f"\n[2/5] Checking CORS Configuration with Origin: {frontend_origin}")
    try:
        cors_headers = {
            "Origin": frontend_origin,
            "Access-Control-Request-Method": "GET",
        }
        status, headers, _ = make_request(health_url, method="OPTIONS", headers=cors_headers)
        allow_origin = headers.get("access-control-allow-origin")
        if allow_origin in ("*", frontend_origin):
            print(f"  [PASS] Access-Control-Allow-Origin = '{allow_origin}'")
            checks_passed += 1
        else:
            # Also test regular GET with Origin
            status_get, headers_get, _ = make_request(health_url, method="GET", headers={"Origin": frontend_origin})
            allow_origin_get = headers_get.get("access-control-allow-origin")
            if allow_origin_get in ("*", frontend_origin):
                print(f"  [PASS] Access-Control-Allow-Origin = '{allow_origin_get}' on GET")
                checks_passed += 1
            else:
                print(f"  [WARN/FAIL] Access-Control-Allow-Origin header missing or mismatched: {allow_origin}")
    except Exception as exc:
        print(f"  [FAIL] CORS probe failed: {exc}")

    # Check 3: Public dataset status
    status_url = f"{clean_base}/public-datasets/status"
    print(f"\n[3/5] Checking Public Dataset Service Status: {status_url}")
    try:
        status, _, body = make_request(status_url)
        if status == 200:
            payload = json.loads(body.decode("utf-8"))
            if "configured" in payload and "available" in payload:
                print(f"  [PASS] Provider configured={payload.get('configured')}, available={payload.get('available')}")
                checks_passed += 1
            else:
                print(f"  [FAIL] Malformed status payload: {payload}")
        else:
            print(f"  [FAIL] HTTP {status}")
    except Exception as exc:
        print(f"  [FAIL] Connection error: {exc}")

    # Check 4: Guaranteed Demo Samples
    demo_url = f"{clean_base}/public-datasets/demo-samples"
    print(f"\n[4/5] Checking Guaranteed Demo Samples Endpoint: {demo_url}")
    try:
        status, _, body = make_request(demo_url)
        if status == 200:
            payload = json.loads(body.decode("utf-8"))
            if isinstance(payload, list) and len(payload) >= 2:
                sample_ids = [s.get("id") for s in payload if isinstance(s, dict)]
                print(f"  [PASS] {len(payload)} demo samples available: {sample_ids}")
                checks_passed += 1
            else:
                print(f"  [FAIL] Expected at least 2 demo samples, received {payload}")
        else:
            print(f"  [FAIL] HTTP {status}")
    except Exception as exc:
        print(f"  [FAIL] Connection error: {exc}")

    # Check 5: Observation Catalogue Listing
    obs_url = f"{clean_base}/observations?limit=1"
    print(f"\n[5/5] Checking Observation Catalogue Endpoint: {obs_url}")
    try:
        status, _, body = make_request(obs_url)
        if status == 200:
            payload = json.loads(body.decode("utf-8"))
            if "items" in payload and isinstance(payload["items"], list):
                print(f"  [PASS] Observation catalogue returned {len(payload['items'])} items (total={payload.get('total')})")
                checks_passed += 1
            else:
                print(f"  [FAIL] Observation listing missing 'items' array: {payload}")
        else:
            print(f"  [FAIL] HTTP {status}")
    except Exception as exc:
        print(f"  [FAIL] Connection error: {exc}")

    print("\n" + "=" * 60)
    print(f"RESULTS: {checks_passed}/{checks_total} checks passed.")
    print("=" * 60)

    return checks_passed == checks_total


def main() -> None:
    parser = argparse.ArgumentParser(description="AETHON Production Deployment Smoke Test")
    default_api = os.environ.get("VITE_API_BASE_URL", os.environ.get("AETHON_API_URL", "http://127.0.0.1:8000/api"))
    parser.add_argument("--api-url", default=default_api, help="AETHON API base URL (default: %(default)s)")
    parser.add_argument("--frontend-origin", default="https://aethon.vercel.app", help="Expected frontend origin for CORS")
    args = parser.parse_args()

    success = run_smoke_test(args.api_url, args.frontend_origin)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
