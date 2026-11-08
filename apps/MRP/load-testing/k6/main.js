// =============================================================================
// L-ERP MRP - K6 SMOKE TEST (Gate 4)
// Warm-up + 1→3→5 users with auth validation
// =============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// =============================================================================
// CONFIGURATION
// =============================================================================

const BASE_URL = __ENV.K6_BASE_URL || 'https://lerp-mrp.onrender.com';
const COOKIE = __ENV.K6_COOKIE; // NextAuth session token

if (!COOKIE) {
  throw new Error('K6_COOKIE environment variable required');
}

// =============================================================================
// CUSTOM METRICS
// =============================================================================

const systemErrors = new Rate('system_errors'); // 5xx + timeouts only
const authErrors = new Rate('auth_errors'); // 401 failures
const responseTrend = new Trend('response_time');

// =============================================================================
// TEST OPTIONS - Gate 4 Smoke Test
// =============================================================================

export const options = {
  stages: [
    // Warm-up phase (discarded)
    { duration: '30s', target: 1 },
    { duration: '30s', target: 0 },

    // 1 user measurement
    { duration: '60s', target: 1 },
    { duration: '30s', target: 0 },

    // 3 users measurement
    { duration: '90s', target: 3 },
    { duration: '30s', target: 0 },

    // 5 users measurement
    { duration: '120s', target: 5 },
  ],

  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'system_errors': ['rate<0.01'], // <1% system errors
    'auth_errors': ['rate==0'], // No auth failures
  },
};

// =============================================================================
// ENDPOINTS TO TEST
// =============================================================================

const ENDPOINTS = [
  { path: '/api/health', requiresAuth: false },
  { path: '/api/auth/session', requiresAuth: true },
  { path: '/api/parts?page=1&limit=10', requiresAuth: true },
  { path: '/api/inventory?page=1&limit=50', requiresAuth: true },
  { path: '/api/suppliers?page=1&limit=50', requiresAuth: true },
  { path: '/api/mrp/runs', requiresAuth: true },
  { path: '/customer-portal', requiresAuth: false }, // Portal exception
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function makeRequest(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  const params = endpoint.requiresAuth
    ? { headers: { 'Cookie': COOKIE }, tags: { name: endpoint.path } }
    : { tags: { name: endpoint.path } };

  const startTime = Date.now();
  const res = http.get(url, params);
  const duration = Date.now() - startTime;

  responseTrend.add(duration);

  // Check for auth failures (MUST be 2xx for auth endpoints)
  if (endpoint.requiresAuth) {
    const authSuccess = check(res, {
      'auth endpoint is 2xx': (r) => r.status >= 200 && r.status < 300,
    });

    if (res.status === 401) {
      authErrors.add(1);
      throw new Error(`Auth failed for ${endpoint.path}: 401 Unauthorized`);
    }

    if (!authSuccess) {
      authErrors.add(1);
    }
  }

  // Track system errors (5xx + timeouts only, exclude 4xx/429)
  const isSystemError = res.status >= 500 || res.error_code === 1000; // 1000 = timeout
  systemErrors.add(isSystemError);

  return res;
}

// =============================================================================
// DEFAULT TEST FUNCTION
// =============================================================================

export default function () {
  // Random endpoint selection for variety
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];

  try {
    makeRequest(endpoint);
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
  }

  sleep(1);
}

// =============================================================================
// SETUP & TEARDOWN
// =============================================================================

export function setup() {
  console.log('🚀 Starting L-ERP MRP Smoke Test (Gate 4)');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔐 Cookie: ${COOKIE ? 'PROVIDED' : 'MISSING'}`);

  // Verify health
  const healthRes = http.get(`${BASE_URL}/api/health`);
  if (healthRes.status !== 200) {
    throw new Error('Health check failed! Aborting test.');
  }

  console.log('✅ System health check passed');
  console.log('⏰ Starting warm-up phase (30s, discarded)...');

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n🏁 Test completed in ${duration.toFixed(2)} seconds`);
}
