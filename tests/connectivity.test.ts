import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const ROOT_URL = BASE_URL.replace(/\/api\/?$/, '');
const REQUIRE_BACKEND = process.env.REQUIRE_BACKEND === 'true';

let backendReachableCached: boolean | null = null;
let seededObservationId: string | null = null;
let seededCandidateId: string | null = null;

async function checkBackendReachable(): Promise<boolean> {
  if (backendReachableCached !== null) {
    return backendReachableCached;
  }
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    backendReachableCached = res.ok;
  } catch {
    backendReachableCached = false;
  }

  if (!backendReachableCached && REQUIRE_BACKEND) {
    assert.fail(
      `FastAPI backend is required at ${BASE_URL} (REQUIRE_BACKEND=true) but is not reachable.`
    );
  }

  return backendReachableCached;
}

/**
 * Guarantee a valid, deterministic observation exists.
 * If the database already contains observations, returns the first one.
 * Otherwise, loads the guaranteed offline synthetic demo sample via the REST endpoint.
 */
async function getOrSeedObservationId(): Promise<string> {
  if (seededObservationId) {
    return seededObservationId;
  }

  const listRes = await fetch(`${BASE_URL}/observations?limit=1`);
  assert.equal(listRes.status, 200, 'Observation list must return 200 OK');
  const listData = await listRes.json();

  if (Array.isArray(listData.items) && listData.items.length > 0) {
    seededObservationId = listData.items[0].id;
    return seededObservationId!;
  }

  // Seed deterministic demo observation via REST endpoint
  const seedRes = await fetch(
    `${BASE_URL}/public-datasets/demo-samples/synthetic-drifting-beacon/load`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  assert.equal(seedRes.status, 201, 'Failed to seed deterministic demo sample for integration');
  const seedData = await seedRes.json();
  assert.ok(seedData.observation?.id, 'Seeded observation must contain valid id');
  seededObservationId = seedData.observation.id;
  return seededObservationId!;
}

/**
 * Guarantee a valid scientific candidate exists for integration assertions.
 * If none exists, creates one linked to the deterministic observation.
 */
async function getOrSeedCandidateId(): Promise<string> {
  if (seededCandidateId) {
    return seededCandidateId;
  }

  const listRes = await fetch(`${BASE_URL}/candidates?limit=1`);
  assert.equal(listRes.status, 200, 'Candidate listing must return 200 OK');
  const listData = await listRes.json();

  if (Array.isArray(listData.items) && listData.items.length > 0) {
    seededCandidateId = listData.items[0].candidate_id;
    return seededCandidateId!;
  }

  const obsId = await getOrSeedObservationId();
  const createPayload = {
    observation_id: obsId,
    target_region: {
      time_start: 0,
      time_stop: 4,
      freq_start: 0,
      freq_stop: 8,
    },
    physical_coordinates: {
      center_frequency_hz: 1420405750.0,
      bandwidth_hz: 2500.0,
      duration_seconds: 4.0,
    },
    is_synthetic: true,
  };

  const createRes = await fetch(`${BASE_URL}/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createPayload),
  });
  assert.equal(createRes.status, 201, 'Failed to create integration candidate fixture');
  const candData = await createRes.json();
  assert.ok(candData.candidate_id, 'Created candidate must have candidate_id');
  seededCandidateId = candData.candidate_id;
  return seededCandidateId!;
}

test('Live Connectivity: Health probe semantics', async (t) => {
  if (!(await checkBackendReachable())) {
    t.skip(`FastAPI backend not running at ${BASE_URL}`);
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
  if (!(await checkBackendReachable())) {
    t.skip(`FastAPI backend not running at ${BASE_URL}`);
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

test('Live Connectivity: Guaranteed demo observation loading and ingestion', async (t) => {
  if (!(await checkBackendReachable())) {
    t.skip(`FastAPI backend not running at ${BASE_URL}`);
    return;
  }

  const res = await fetch(
    `${BASE_URL}/public-datasets/demo-samples/synthetic-drifting-beacon/load`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.sample_id, 'synthetic-drifting-beacon');
  assert.equal(data.is_synthetic, true);
  assert.ok(data.observation);
  assert.equal(data.observation.status, 'ingested');
  assert.equal(data.observation.format, 'fil');
});

test('Live Connectivity: Observation listing and pagination', async (t) => {
  if (!(await checkBackendReachable())) {
    t.skip(`FastAPI backend not running at ${BASE_URL}`);
    return;
  }

  // Ensure an observation exists
  await getOrSeedObservationId();

  const res = await fetch(`${BASE_URL}/observations?limit=5&offset=0`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.items));
  assert.ok(typeof data.total === 'number');
  assert.ok(data.total >= 1, 'Total observations must be at least 1 after seeding');
  assert.equal(data.limit, 5);
  assert.equal(data.offset, 0);
  assert.ok(data.items.length >= 1);
});

test('Live Connectivity: Observation bounded slice retrieval', async (t) => {
  if (!(await checkBackendReachable())) {
    t.skip(`FastAPI backend not running at ${BASE_URL}`);
    return;
  }

  // Guarantee observation is present - never skip silently
  const obsId = await getOrSeedObservationId();

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
  if (!(await checkBackendReachable())) {
    t.skip(`FastAPI backend not running at ${BASE_URL}`);
    return;
  }

  // Guarantee observation is present - never skip silently
  const obsId = await getOrSeedObservationId();

  // 1. Process / RFI assessment
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

  // 2. Anomaly detection
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

  // 3. Doppler Drift analysis
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
  if (!(await checkBackendReachable())) {
    t.skip(`FastAPI backend not running at ${BASE_URL}`);
    return;
  }

  // Guarantee candidate is present - never skip assertions silently
  const candId = await getOrSeedCandidateId();

  // 1. Listing
  const res = await fetch(`${BASE_URL}/candidates`);
  assert.equal(res.status, 200);
  const candidatesData = await res.json();
  assert.ok(Array.isArray(candidatesData.items));
  assert.ok(candidatesData.total >= 1);

  // 2. Detail
  const detailRes = await fetch(`${BASE_URL}/candidates/${candId}`);
  assert.equal(detailRes.status, 200);
  const detail = await detailRes.json();
  assert.equal(detail.candidate_id, candId);
  assert.ok(detail.current_assessment);

  // 3. Dossier JSON
  const dossierRes = await fetch(`${BASE_URL}/candidates/${candId}/dossier`);
  assert.equal(dossierRes.status, 200);
  const dossier = await dossierRes.json();
  assert.equal(dossier.candidate_id, candId);
  assert.ok(dossier.executive_summary);

  // 4. Dossier Vector PDF
  const pdfRes = await fetch(`${BASE_URL}/candidates/${candId}/dossier.pdf`);
  assert.equal(pdfRes.status, 200);
  const contentType = pdfRes.headers.get('content-type') || '';
  assert.ok(
    contentType.includes('application/pdf'),
    `Expected application/pdf, got ${contentType}`
  );
  const pdfBytes = await pdfRes.arrayBuffer();
  const pdfHeader = Buffer.from(pdfBytes.slice(0, 5)).toString('utf-8');
  assert.equal(pdfHeader, '%PDF-', 'PDF file must start with %PDF- header');
});

test('Live Connectivity: Ingestion upload validation and failure cases', async (t) => {
  if (!(await checkBackendReachable())) {
    t.skip(`FastAPI backend not running at ${BASE_URL}`);
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

test('Live Connectivity: Public dataset provider status and filter contracts', async (t) => {
  if (!(await checkBackendReachable())) {
    t.skip(`FastAPI backend not running at ${BASE_URL}`);
    return;
  }

  // 1. Status endpoint wire response
  const statusRes = await fetch(`${BASE_URL}/public-datasets/status`);
  assert.equal(statusRes.status, 200);
  const statusData = await statusRes.json();
  assert.equal(typeof statusData.configured, 'boolean');
  assert.equal(typeof statusData.available, 'boolean');
  assert.equal(typeof statusData.max_import_bytes, 'number');

  // 2. Filter endpoints wire contracts (must return arrays of strings, not objects)
  const targetsRes = await fetch(`${BASE_URL}/public-datasets/targets`);
  assert.equal(targetsRes.status, 200);
  const targetsData = await targetsRes.json();
  assert.ok(Array.isArray(targetsData), 'Targets response must be an array');
  targetsData.forEach((item: unknown) => assert.equal(typeof item, 'string'));

  const telescopesRes = await fetch(`${BASE_URL}/public-datasets/telescopes`);
  assert.equal(telescopesRes.status, 200);
  const telescopesData = await telescopesRes.json();
  assert.ok(Array.isArray(telescopesData), 'Telescopes response must be an array');
  telescopesData.forEach((item: unknown) => assert.equal(typeof item, 'string'));

  const fileTypesRes = await fetch(`${BASE_URL}/public-datasets/file-types`);
  assert.equal(fileTypesRes.status, 200);
  const fileTypesData = await fileTypesRes.json();
  assert.ok(Array.isArray(fileTypesData), 'File types response must be an array');
  fileTypesData.forEach((item: unknown) => assert.equal(typeof item, 'string'));

  // 3. Query endpoint wire structure
  const queryRes = await fetch(`${BASE_URL}/public-datasets?limit=5&offset=0`);
  assert.equal(queryRes.status, 200);
  const queryData = await queryRes.json();
  assert.ok(Array.isArray(queryData.items), 'Query items must be an array');
  assert.equal(typeof queryData.total, 'number');
  assert.equal(typeof queryData.provider_status, 'string');
});
