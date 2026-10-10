import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const ROOT_URL = BASE_URL.replace(/\/api\/?$/, '');

async function isBackendReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

test('Live Connectivity: Health probe semantics', async (t) => {
  const reachable = await isBackendReachable();
  if (!reachable) {
    t.skip('FastAPI backend not running at ' + BASE_URL);
    return;
  }

  // 1. Health at /api/health
  const resApi = await fetch(`${BASE_URL}/health`);
  assert.equal(resApi.status, 200);
  const dataApi = await resApi.json();
  assert.equal(dataApi.status, 'healthy');
  assert.equal(dataApi.service, 'aethon-backend');

  // 2. Health at root /health
  const resRoot = await fetch(`${ROOT_URL}/health`);
  assert.equal(resRoot.status, 200);
  const dataRoot = await resRoot.json();
  assert.equal(dataRoot.status, 'healthy');
});

test('Live Connectivity: CORS preflight header verification', async (t) => {
  const reachable = await isBackendReachable();
  if (!reachable) {
    t.skip('FastAPI backend not running at ' + BASE_URL);
    return;
  }

  const res = await fetch(`${BASE_URL}/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type,X-Client-Agent',
    },
  });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const allowMethods = res.headers.get('access-control-allow-methods') || '';
  assert.ok(allowMethods.includes('GET'));
  assert.ok(allowMethods.includes('POST'));
});

test('Live Connectivity: Observation listing and pagination', async (t) => {
  const reachable = await isBackendReachable();
  if (!reachable) {
    t.skip('FastAPI backend not running at ' + BASE_URL);
    return;
  }

  const res = await fetch(`${BASE_URL}/observations?limit=5&offset=0`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.items));
  assert.ok(typeof data.total === 'number');
  assert.equal(data.limit, 5);
  assert.equal(data.offset, 0);
  assert.ok(data.items.length <= 5);
});

test('Live Connectivity: Observation bounded slice retrieval', async (t) => {
  const reachable = await isBackendReachable();
  if (!reachable) {
    t.skip('FastAPI backend not running at ' + BASE_URL);
    return;
  }

  const listRes = await fetch(`${BASE_URL}/observations?limit=1`);
  const listData = await listRes.json();
  if (!listData.items.length) {
    t.skip('No observations available to slice');
    return;
  }

  const obsId = listData.items[0].id;
  const sliceRes = await fetch(
    `${BASE_URL}/observations/${obsId}/slice?time_start=0&time_stop=4&frequency_start=0&frequency_stop=8`
  );
  assert.equal(sliceRes.status, 200);
  const slice = await sliceRes.json();
  assert.equal(slice.observation_id, obsId);
  assert.deepEqual(slice.matrix_shape, [4, 8]);
  assert.equal(slice.values.length, 4);
  assert.equal(slice.values[0].length, 8);
  assert.ok(slice.frequency_coordinates_hz.length === 8);
  assert.ok(slice.time_coordinates_seconds.length === 4);
});

test('Live Connectivity: Observation scientific analysis path', async (t) => {
  const reachable = await isBackendReachable();
  if (!reachable) {
    t.skip('FastAPI backend not running at ' + BASE_URL);
    return;
  }

  const listRes = await fetch(`${BASE_URL}/observations?limit=1`);
  const listData = await listRes.json();
  if (!listData.items.length) {
    t.skip('No observations available for processing');
    return;
  }

  const obsId = listData.items[0].id;

  // Process / RFI assessment
  const procRes = await fetch(`${BASE_URL}/observations/${obsId}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfi_method: 'surface_fit', flag_threshold_sigma: 3.0 }),
  });
  assert.equal(procRes.status, 200);
  const procData = await procRes.json();
  assert.equal(procData.observation_id, obsId);
  assert.ok(procData.rfi_report);
  assert.ok(typeof procData.primary_mask_flagged_fraction === 'number');

  // Anomaly detection
  const detRes = await fetch(`${BASE_URL}/observations/${obsId}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ algorithm: 'ensemble', sensitivity: 0.8 }),
  });
  assert.equal(detRes.status, 200);
  const detData = await detRes.json();
  assert.equal(detData.observation_id, obsId);
  assert.ok(typeof detData.total_windows_evaluated === 'number');
  assert.ok(Array.isArray(detData.anomalous_regions));

  // Doppler Drift analysis
  const driftRes = await fetch(`${BASE_URL}/observations/${obsId}/analyze-drift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ max_drift_rate_hz_per_sec: 10.0 }),
  });
  assert.equal(driftRes.status, 200);
  const driftData = await driftRes.json();
  assert.equal(driftData.observation_id, obsId);
  assert.ok(driftData.drift_estimate);
  assert.ok(typeof driftData.drift_estimate.drift_rate_index_slope === 'number');
});

test('Live Connectivity: Candidates and Dossier retrieval', async (t) => {
  const reachable = await isBackendReachable();
  if (!reachable) {
    t.skip('FastAPI backend not running at ' + BASE_URL);
    return;
  }

  const res = await fetch(`${BASE_URL}/candidates`);
  assert.equal(res.status, 200);
  const candidatesData = await res.json();
  assert.ok(Array.isArray(candidatesData.items));

  if (candidatesData.items.length > 0) {
    const candId = candidatesData.items[0].candidate_id;

    // Detail
    const detailRes = await fetch(`${BASE_URL}/candidates/${candId}`);
    assert.equal(detailRes.status, 200);
    const detail = await detailRes.json();
    assert.equal(detail.candidate_id, candId);
    assert.ok(detail.current_assessment);

    // Dossier JSON
    const dossierRes = await fetch(`${BASE_URL}/candidates/${candId}/dossier`);
    assert.equal(dossierRes.status, 200);
    const dossier = await dossierRes.json();
    assert.equal(dossier.candidate_id, candId);
    assert.ok(dossier.executive_summary);

    // Dossier PDF
    const pdfRes = await fetch(`${BASE_URL}/candidates/${candId}/dossier.pdf`);
    assert.equal(pdfRes.status, 200);
    const contentType = pdfRes.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/pdf'));
    const pdfBytes = await pdfRes.arrayBuffer();
    const pdfHeader = Buffer.from(pdfBytes.slice(0, 5)).toString('utf-8');
    assert.equal(pdfHeader, '%PDF-');
  }
});

test('Live Connectivity: Ingestion upload validation and failure cases', async (t) => {
  const reachable = await isBackendReachable();
  if (!reachable) {
    t.skip('FastAPI backend not running at ' + BASE_URL);
    return;
  }

  // 1. Unsupported extension
  const form1 = new FormData();
  form1.append('file', new Blob(['test text'], { type: 'text/plain' }), 'invalid.txt');
  const res1 = await fetch(`${BASE_URL}/observations`, { method: 'POST', body: form1 });
  assert.equal(res1.status, 400);
  const err1 = await res1.json();
  assert.ok(err1.message.includes('not supported'));

  // 2. Empty file
  const form2 = new FormData();
  form2.append('file', new Blob([], { type: 'application/octet-stream' }), 'empty.fil');
  const res2 = await fetch(`${BASE_URL}/observations`, { method: 'POST', body: form2 });
  assert.equal(res2.status, 400);
  const err2 = await res2.json();
  assert.ok(err2.message.includes('zero bytes'));

  // 3. Corrupted header
  const form3 = new FormData();
  form3.append(
    'file',
    new Blob(['not a filterbank header string content'], { type: 'application/octet-stream' }),
    'bad.fil'
  );
  const res3 = await fetch(`${BASE_URL}/observations`, { method: 'POST', body: form3 });
  assert.equal(res3.status, 422);
});
