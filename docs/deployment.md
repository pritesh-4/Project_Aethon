# AETHON Deployment and Production Connectivity Guide

## 1. Architecture Overview

AETHON consists of two primary operational components:

1. **Frontend**: React + Vite SPA, deployable on Vercel, Netlify, or static web servers.
2. **Backend**: FastAPI scientific analysis service, run via Uvicorn/Gunicorn on containerized infrastructure (e.g. AWS ECS, GCP Cloud Run, Fly.io, or dedicated compute).

```
[Browser Client]
       │
       ▼
 [Vercel SPA]  ───(Reverse Proxy / Rewrite or direct HTTPS)───▶  [FastAPI Backend]
 (https://...)                                                    (https://api...)
```

---

## 2. Environment Variables & API Base URL

### Frontend Environment Configuration

In Vite applications, variables exposed to the client bundle must be prefixed with `VITE_`.

| Variable            | Required in Prod?       | Default (Local)             | Purpose                                                                                  |
| ------------------- | ----------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | **Yes (in Production)** | `http://localhost:8000/api` | Absolute HTTPS URL of the backend API, or `/api` if using Vercel reverse proxy rewrites. |

#### URL Normalization in `src/lib/api.ts`

The client client library automatically normalizes `VITE_API_BASE_URL`:

- Trailing slashes are stripped (`https://api.example.com/api/` -> `https://api.example.com/api`).
- If an origin URL is provided without `/api` (e.g., `https://api.example.com`), `/api` is automatically appended to match the FastAPI route prefix.
- **Accidental Localhost Prevention**: If built for production without an explicit `VITE_API_BASE_URL`, the client does NOT attempt to connect to the client machine's `http://localhost:8000`. Instead, it defaults to relative `/api` and issues a console warning alerting operators to configure the environment variable in hosting provider settings.

### Backend Environment Configuration

| Variable            | Description                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `ALLOWED_ORIGINS`   | Comma-separated list of allowed frontend origins for CORS (e.g., `https://aethon.vercel.app,http://localhost:5173`). |
| `STORAGE_DIR`       | Absolute or relative path to persist uploaded filterbanks and candidates.                                            |
| `ARCHIVE_CACHE_DIR` | Directory for caching downloaded public datasets.                                                                    |

---

## 3. Vercel Deployment Configuration

A `vercel.json` is provided in the repository root to support Client-Side Routing and security headers:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### Manual Vercel Project Configuration (Human Operator Action)

Because Vercel project environment variables cannot be accessed or modified without operator credentials, perform the following verification in the Vercel Dashboard:

1. Navigate to **Vercel Dashboard** -> **Project Settings** -> **Environment Variables**.
2. Add or verify the variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: The public HTTPS endpoint of your deployed backend (e.g., `https://aethon-backend.onrender.com/api` or `https://api.aethon.astronomy.org/api`).
   - **Environments**: Check `Production` and `Preview`.
3. Ensure backend `ALLOWED_ORIGINS` includes your Vercel project domain (e.g. `https://aethon.vercel.app`).
4. Trigger a redeployment in Vercel to bake the environment variable into the production build.

---

## 4. Production Smoke-Test Procedure

Before approving or releasing a production deployment, run the automated smoke test script:

```bash
# Using Python
python scripts/smoke_test_deployment.py \
  --api-url "https://YOUR_BACKEND_DOMAIN/api" \
  --frontend-origin "https://YOUR_FRONTEND_DOMAIN"
```

The smoke-checker verifies:

1. `GET /api/health` — backend returns HTTP 200 with `status: "ok"`.
2. `OPTIONS /api/health` — CORS headers correctly include the configured frontend origin.
3. `GET /api/public-datasets/status` — public dataset client status is returned.
4. `GET /api/public-datasets/demo-samples` — guaranteed offline demo samples are available.
5. `GET /api/observations?limit=1` — observation catalogue responds with standard pagination schema.

All 5 checks must report `PASS` before declaring production connectivity verified.
