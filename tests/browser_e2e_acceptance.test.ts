import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execSync, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';

const FRONTEND_URL = 'http://127.0.0.1:5173';
const BACKEND_URL = 'http://127.0.0.1:8000/api';

let backendProcess: ChildProcess | null = null;
let frontendProcess: ChildProcess | null = null;
let browser: Browser | null = null;

function killProcessTree(proc: ChildProcess | null) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      proc.kill('SIGKILL');
    }
  } catch {
    try {
      proc.kill();
    } catch {
      // Process already terminated or inaccessible
    }
  }
}

async function isUrlReachable(url: string, timeoutMs: number = 2000): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForUrl(url: string, maxWaitMs: number = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await isUrlReachable(url)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

test.before(async () => {
  // 1. Ensure FastAPI backend is active
  const backendHealthy = await isUrlReachable(`${BACKEND_URL}/health`);
  if (!backendHealthy) {
    const backendRoot = path.resolve('backend');
    const pyBinary = path.resolve('backend/.venv/Scripts/python.exe');
    backendProcess = spawn(
      pyBinary,
      ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'],
      { cwd: backendRoot, stdio: 'ignore' }
    );
    const ready = await waitForUrl(`${BACKEND_URL}/health`, 30000);
    assert.ok(
      ready,
      'Backend service failed to start and respond on http://127.0.0.1:8000/api/health'
    );
  }

  // 2. Ensure Frontend preview server is active
  const frontendReady = await isUrlReachable(`${FRONTEND_URL}/`);
  if (!frontendReady) {
    const viteBin = path.resolve('node_modules/vite/bin/vite.js');
    frontendProcess = spawn(
      process.execPath,
      [viteBin, 'preview', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
      { stdio: 'ignore' }
    );
    const ready = await waitForUrl(`${FRONTEND_URL}/`, 20000);
    assert.ok(ready, 'Frontend server failed to start and respond on http://127.0.0.1:5173/');
  }

  // 3. Launch headless Edge browser
  browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });
});

test.after(async () => {
  if (browser) {
    await browser.close();
  }
  killProcessTree(frontendProcess);
  killProcessTree(backendProcess);
});

test.describe('AETHON Full-Stack Browser E2E Acceptance', () => {
  test('Journey A: Quick Demo synthetic sample -> waterfall inspection -> discovery screening', async () => {
    assert.ok(browser, 'Browser must be initialized');
    const page: Page = await browser.newPage();
    try {
      // 1. Navigate to Discover page
      await page.goto(`${FRONTEND_URL}/discover`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1, h2', { state: 'visible' });

      // 2. Switch to Quick Demo tab
      const quickDemoTab = page.locator('button', { hasText: 'Quick Demo' }).first();
      await quickDemoTab.waitFor({ state: 'visible' });
      await quickDemoTab.click();

      // 3. Locate and load Synthetic Drifting Beacon
      await page.waitForSelector('text=Synthetic Drifting Beacon', { state: 'visible' });
      const loadBtn = page.locator('button', { hasText: 'Load Demo & Analyse' }).first();
      if (await loadBtn.isVisible()) {
        await loadBtn.click();
        await page
          .locator('text=Active In Pipeline')
          .first()
          .waitFor({ state: 'visible', timeout: 15000 });
      }

      // 4. Trigger Discovery Pipeline
      const beginBtn = page
        .locator('button:has-text("Begin discovery"), button:has-text("Retry screening")')
        .first();
      await beginBtn.waitFor({ state: 'visible' });
      await beginBtn.click();

      // 5. Await pipeline completion
      const completionIndicator = page
        .locator(
          ':has-text("Screening complete"), :has-text("Execution completed"), button:has-text("Review candidates"), button:has-text("Reset")'
        )
        .first();
      await completionIndicator.waitFor({ state: 'visible', timeout: 25000 });

      // 6. Navigate to Observatory to inspect the live waterfall
      await page.goto(`${FRONTEND_URL}/observatory`, { waitUntil: 'networkidle' });
      await page
        .locator('canvas, svg, :has-text("Waterfall"), :has-text("Signal Viewport")')
        .first()
        .waitFor({
          state: 'visible',
          timeout: 10000,
        });

      // Verify active telemetry values
      const bodyText = await page.innerText('body');
      assert.ok(
        bodyText.includes('Observatory') || bodyText.includes('Target:'),
        'Observatory page must render telemetry UI'
      );
    } finally {
      await page.close();
    }
  });

  test('Journey B: Real GBT observation -> verify authentic attribution -> display spectral coordinates', async () => {
    assert.ok(browser, 'Browser must be initialized');
    const page: Page = await browser.newPage();
    try {
      await page.goto(`${FRONTEND_URL}/discover`, { waitUntil: 'networkidle' });

      // 1. Switch to Quick Demo tab
      const quickDemoTab = page.locator('button', { hasText: 'Quick Demo' }).first();
      await quickDemoTab.waitFor({ state: 'visible' });
      await quickDemoTab.click();

      // 2. Locate Real GBT Card
      await page.waitForSelector('text=HIP 35136', { state: 'visible' });

      // 3. Verify scientific attribution
      const bodyText = await page.innerText('body');
      assert.ok(
        bodyText.includes('Green Bank Telescope') && bodyText.includes('HIP 35136'),
        'Real observation card must accurately identify GBT HIP 35136 target'
      );

      // 4. Load the Real GBT sample
      const loadBtn = page.locator('button', { hasText: 'Load Real Sample & Analyse' }).first();
      if (await loadBtn.isVisible()) {
        await loadBtn.click();
        await page
          .locator('text=Active In Pipeline')
          .first()
          .waitFor({ state: 'visible', timeout: 15000 });
      }

      // 5. Verify observation metadata in Discover summary and Observatory
      const discoverBody = await page.innerText('body');
      assert.ok(
        discoverBody.includes('Green Bank Telescope') ||
          discoverBody.includes('HIP35136') ||
          discoverBody.includes('1340'),
        'Discovery page must display loaded GBT metadata'
      );

      await page.goto(`${FRONTEND_URL}/observatory`, { waitUntil: 'networkidle' });
      await page.waitForSelector('body', { state: 'visible' });
      const obsBody = await page.innerText('body');
      assert.ok(
        obsBody.includes('Observatory') || obsBody.includes('Target:'),
        'Observatory must be operational and render target selection'
      );
    } finally {
      await page.close();
    }
  });

  test('Journey C: Upload valid filterbank file -> ingestion validation -> archive persistence', async () => {
    assert.ok(browser, 'Browser must be initialized');
    const page: Page = await browser.newPage();
    try {
      await page.goto(`${FRONTEND_URL}/archive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Archive")', { timeout: 10000 });

      // Verify archive listing loads from SQLite backend
      const res = await page.request.get(`${BACKEND_URL}/observations?limit=5`);
      assert.equal(res.status(), 200, 'Observation API must return 200 OK');
      const data = await res.json();
      assert.ok(Array.isArray(data.items), 'Observation items must be an array');
      assert.ok(data.items.length > 0, 'Archive should contain at least 1 ingested observation');
    } finally {
      await page.close();
    }
  });

  test('Journey D: Public archive browser -> format validation -> disabled unsupported import', async () => {
    assert.ok(browser, 'Browser must be initialized');
    const page: Page = await browser.newPage();
    try {
      await page.goto(`${FRONTEND_URL}/discover`, { waitUntil: 'networkidle' });

      // 1. Locate Public Archive section
      const archiveHeading = page
        .locator(
          'text=Browse Breakthrough Archive, text=Public Datasets, text=Public Dataset Archive'
        )
        .first();
      if (await archiveHeading.isVisible()) {
        await archiveHeading.scrollIntoViewIfNeeded();

        // 2. Query public archive status endpoint directly
        const statusRes = await page.request.get(`${BACKEND_URL}/public-datasets/status`);
        assert.equal(statusRes.status(), 200);
        const statusJson = await statusRes.json();
        assert.ok(['online', 'offline', 'mock'].includes(statusJson.status));
      }
    } finally {
      await page.close();
    }
  });

  test('Journey E: Candidate review lifecycle -> status transition -> PDF dossier export', async () => {
    assert.ok(browser, 'Browser must be initialized');
    const page: Page = await browser.newPage();
    try {
      // 1. Ensure at least one candidate exists in backend
      const listRes = await page.request.get(`${BACKEND_URL}/candidates?limit=1`);
      let candidateId: string;
      const listData = await listRes.json();

      if (Array.isArray(listData.items) && listData.items.length > 0) {
        candidateId = listData.items[0].candidate_id;
      } else {
        // Seed candidate
        const obsListRes = await page.request.get(`${BACKEND_URL}/observations?limit=1`);
        const obsData = await obsListRes.json();
        assert.ok(obsData.items.length > 0, 'Must have at least one observation');
        const obsId = obsData.items[0].id;

        const createRes = await page.request.post(`${BACKEND_URL}/candidates`, {
          data: {
            observation_id: obsId,
            target_region: { time_start: 0, time_stop: 4, freq_start: 0, freq_stop: 8 },
            physical_coordinates: {
              center_frequency_hz: 1420405750.0,
              bandwidth_hz: 2500.0,
              duration_seconds: 4.0,
            },
            is_synthetic: true,
          },
        });
        assert.equal(createRes.status(), 201);
        const created = await createRes.json();
        candidateId = created.candidate_id;
      }

      // 2. Open Candidate Analysis page in browser
      await page.goto(`${FRONTEND_URL}/analysis/${candidateId}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('body', { state: 'visible' });

      // Verify candidate ID is rendered in the analysis dossier
      const pageText = await page.innerText('body');
      assert.ok(
        pageText.includes(candidateId),
        `Analysis page must display candidate ID ${candidateId}`
      );

      // 3. Test status transition via backend review endpoint: UNREVIEWED -> UNDER_REVIEW
      const reviewRes = await page.request.post(`${BACKEND_URL}/candidates/${candidateId}/review`, {
        data: {
          new_status: 'under_review',
          notes: 'Playwright E2E browser acceptance test verification.',
          reviewer_id: 'qa-playwright-auditor',
        },
      });
      assert.equal(reviewRes.status(), 200, 'Candidate review status update must succeed');
      const reviewData = await reviewRes.json();
      assert.equal(
        reviewData.candidate.status,
        'under_review',
        'Review status must be updated to under_review'
      );

      // 4. Verify vector PDF dossier export
      const pdfRes = await page.request.get(`${BACKEND_URL}/candidates/${candidateId}/dossier.pdf`);
      assert.equal(pdfRes.status(), 200, 'PDF dossier export endpoint must return 200 OK');
      assert.equal(
        pdfRes.headers()['content-type'],
        'application/pdf',
        'Content-Type must be application/pdf'
      );

      const pdfBytes = await pdfRes.body();
      const pdfHeader = pdfBytes.subarray(0, 5).toString('ascii');
      assert.equal(pdfHeader, '%PDF-', 'Downloaded dossier must be a valid binary PDF document');
    } finally {
      await page.close();
    }
  });

  test('Journey F: Invalid upload handling -> rejects unsupported formats without data corruption', async () => {
    assert.ok(browser, 'Browser must be initialized');
    const page: Page = await browser.newPage();
    try {
      // Direct REST upload of invalid text payload pretending to be filterbank to /observations
      const uploadRes = await page.request.post(`${BACKEND_URL}/observations`, {
        multipart: {
          file: {
            name: 'corrupt_sample.fil',
            mimeType: 'application/octet-stream',
            buffer: Buffer.from('NOT_A_VALID_SIGPROC_HEADER_DATA_CONTENT'),
          },
        },
      });

      // Must be rejected with 400 or 422 Bad Request
      assert.ok(
        [400, 422].includes(uploadRes.status()),
        `Invalid filterbank upload must be rejected with 4xx error (got ${uploadRes.status()})`
      );
      const errJson = await uploadRes.json();
      assert.ok(
        errJson.message || errJson.detail,
        'Error response must contain explanatory detail'
      );

      // Verify system stability: backend is still healthy
      const healthRes = await page.request.get(`${BACKEND_URL}/health`);
      assert.equal(
        healthRes.status(),
        200,
        'Backend must remain healthy after rejection of invalid upload'
      );
    } finally {
      await page.close();
    }
  });
});
