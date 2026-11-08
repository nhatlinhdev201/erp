// ═══════════════════════════════════════════════════════════════════════════════
// K6 Load Testing Script — API Performance Under Load
// VietERP OTB Platform — Tests all critical endpoints
//
// Install: brew install k6 (Mac) or apt install k6 (Linux)
// Run: k6 run --env API_URL=http://localhost:4000 api-load-test.js
//
// Outputs: response times, throughput, error rates, percentiles
// ═══════════════════════════════════════════════════════════════════════════════

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Custom Metrics ──────────────────────────────────────────────────────────

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const budgetListDuration = new Trend('budget_list_duration');
const budgetDetailDuration = new Trend('budget_detail_duration');
const planningListDuration = new Trend('planning_list_duration');
const proposalListDuration = new Trend('proposal_list_duration');
const masterDataDuration = new Trend('master_data_duration');
const apiCalls = new Counter('api_calls');

// ─── Configuration ───────────────────────────────────────────────────────────

const API_URL = __ENV.API_URL || 'http://localhost:4000';

export const options = {
  // Scenario: Ramp up to 50 concurrent users over 5 minutes
  stages: [
    { duration: '30s', target: 10 },   // Warm up
    { duration: '1m', target: 25 },    // Ramp to 25 users
    { duration: '2m', target: 50 },    // Peak load: 50 users
    { duration: '1m', target: 25 },    // Scale down
    { duration: '30s', target: 0 },    // Cool down
  ],

  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% requests under 500ms
    errors: ['rate<0.05'],              // Error rate under 5%
    login_duration: ['p(95)<300'],      // Login under 300ms
    budget_list_duration: ['p(95)<400'],
    planning_list_duration: ['p(95)<400'],
  },
};

// ─── Test Data ───────────────────────────────────────────────────────────────

const TEST_USERS = [
  { email: 'admin@your-domain.com', password: 'lerp@2026' },
  { email: 'buyer@your-domain.com', password: 'lerp@2026' },
  { email: 'merch@your-domain.com', password: 'lerp@2026' },
  { email: 'manager@your-domain.com', password: 'lerp@2026' },
];

// ─── Helper: Get Random User ─────────────────────────────────────────────────

function getRandomUser() {
  return TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
}

// ─── Helper: Login ───────────────────────────────────────────────────────────

function login() {
  const user = getRandomUser();
  const start = Date.now();

  const res = http.post(
    `${API_URL}/api/v1/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  loginDuration.add(Date.now() - start);
  apiCalls.add(1);

  const success = check(res, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => r.json('access_token') !== undefined,
  });

  errorRate.add(!success);

  if (!success) {
    console.error(`Login failed: ${res.status} - ${res.body}`);
    return null;
  }

  return res.json('access_token');
}

// ─── Main Test Function ──────────────────────────────────────────────────────

export default function () {
  // Login first
  const token = login();
  if (!token) {
    sleep(1);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // ─── Group: Master Data ──────────────────────────────────────────

  group('Master Data', () => {
    const endpoints = [
      '/api/v1/master/brands',
      '/api/v1/master/stores',
      '/api/v1/master/categories',
      '/api/v1/master/seasons',
    ];

    endpoints.forEach((endpoint) => {
      const start = Date.now();
      const res = http.get(`${API_URL}${endpoint}`, { headers: authHeaders });
      masterDataDuration.add(Date.now() - start);
      apiCalls.add(1);

      const success = check(res, {
        [`${endpoint} status 200`]: (r) => r.status === 200,
      });
      errorRate.add(!success);
    });
  });

  sleep(0.5);

  // ─── Group: Budget Operations ────────────────────────────────────

  group('Budget Operations', () => {
    // List budgets
    let start = Date.now();
    let res = http.get(`${API_URL}/api/v1/budgets?page=1&limit=20`, {
      headers: authHeaders,
    });
    budgetListDuration.add(Date.now() - start);
    apiCalls.add(1);

    let success = check(res, {
      'budget list status 200': (r) => r.status === 200,
      'budget list has data': (r) => Array.isArray(r.json('data')),
    });
    errorRate.add(!success);

    // Get statistics
    start = Date.now();
    res = http.get(`${API_URL}/api/v1/budgets/statistics`, {
      headers: authHeaders,
    });
    apiCalls.add(1);

    success = check(res, {
      'budget stats status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);

    // Get specific budget (if list returned data)
    if (res.status === 200) {
      const budgets = res.json('data');
      if (budgets && budgets.length > 0) {
        const budgetId = budgets[0].id;
        start = Date.now();
        res = http.get(`${API_URL}/api/v1/budgets/${budgetId}`, {
          headers: authHeaders,
        });
        budgetDetailDuration.add(Date.now() - start);
        apiCalls.add(1);

        success = check(res, {
          'budget detail status 200': (r) => r.status === 200,
        });
        errorRate.add(!success);
      }
    }
  });

  sleep(0.5);

  // ─── Group: Planning Operations ──────────────────────────────────

  group('Planning Operations', () => {
    const start = Date.now();
    const res = http.get(`${API_URL}/api/v1/planning?page=1&limit=20`, {
      headers: authHeaders,
    });
    planningListDuration.add(Date.now() - start);
    apiCalls.add(1);

    const success = check(res, {
      'planning list status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.5);

  // ─── Group: Proposal Operations ──────────────────────────────────

  group('Proposal Operations', () => {
    // List proposals
    let start = Date.now();
    let res = http.get(`${API_URL}/api/v1/proposals?page=1&limit=20`, {
      headers: authHeaders,
    });
    proposalListDuration.add(Date.now() - start);
    apiCalls.add(1);

    let success = check(res, {
      'proposal list status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);

    // Get statistics
    res = http.get(`${API_URL}/api/v1/proposals/statistics`, {
      headers: authHeaders,
    });
    apiCalls.add(1);

    success = check(res, {
      'proposal stats status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.5);

  // ─── Group: SKU Catalog Search ───────────────────────────────────

  group('SKU Catalog', () => {
    const searchTerms = ['dress', 'bag', 'coat', 'shirt'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const start = Date.now();
    const res = http.get(
      `${API_URL}/api/v1/master/sku-catalog?search=${term}&page=1&limit=50`,
      { headers: authHeaders }
    );
    apiCalls.add(1);

    const success = check(res, {
      'sku search status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  // Random delay between iterations (0.5-2 seconds)
  sleep(0.5 + Math.random() * 1.5);
}

// ─── Summary Handler ─────────────────────────────────────────────────────────

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalRequests: data.metrics.http_reqs.values.count,
    avgResponseTime: data.metrics.http_req_duration.values.avg,
    p95ResponseTime: data.metrics.http_req_duration.values['p(95)'],
    p99ResponseTime: data.metrics.http_req_duration.values['p(99)'],
    errorRate: data.metrics.errors ? data.metrics.errors.values.rate : 0,
    requestsPerSecond: data.metrics.http_reqs.values.rate,

    endpoints: {
      login: {
        avg: data.metrics.login_duration ? data.metrics.login_duration.values.avg : null,
        p95: data.metrics.login_duration ? data.metrics.login_duration.values['p(95)'] : null,
      },
      budgetList: {
        avg: data.metrics.budget_list_duration ? data.metrics.budget_list_duration.values.avg : null,
        p95: data.metrics.budget_list_duration ? data.metrics.budget_list_duration.values['p(95)'] : null,
      },
      planningList: {
        avg: data.metrics.planning_list_duration ? data.metrics.planning_list_duration.values.avg : null,
        p95: data.metrics.planning_list_duration ? data.metrics.planning_list_duration.values['p(95)'] : null,
      },
      masterData: {
        avg: data.metrics.master_data_duration ? data.metrics.master_data_duration.values.avg : null,
        p95: data.metrics.master_data_duration ? data.metrics.master_data_duration.values['p(95)'] : null,
      },
    },
  };

  return {
    '../reports/api_load_test.json': JSON.stringify(summary, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  return `
═══════════════════════════════════════════════════════════════════════════════
                     VietERP OTB — API Load Test Results
═══════════════════════════════════════════════════════════════════════════════

  Total Requests:     ${data.metrics.http_reqs.values.count}
  Requests/sec:       ${data.metrics.http_reqs.values.rate.toFixed(2)}

  Response Times:
    ├─ Average:       ${data.metrics.http_req_duration.values.avg.toFixed(2)} ms
    ├─ Median (p50):  ${data.metrics.http_req_duration.values.med.toFixed(2)} ms
    ├─ p95:           ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)} ms
    └─ p99:           ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)} ms

  Error Rate:         ${((data.metrics.errors ? data.metrics.errors.values.rate : 0) * 100).toFixed(2)}%

  Endpoint Performance (p95):
    ├─ Login:         ${data.metrics.login_duration ? data.metrics.login_duration.values['p(95)'].toFixed(2) + ' ms' : 'N/A'}
    ├─ Budget List:   ${data.metrics.budget_list_duration ? data.metrics.budget_list_duration.values['p(95)'].toFixed(2) + ' ms' : 'N/A'}
    ├─ Planning List: ${data.metrics.planning_list_duration ? data.metrics.planning_list_duration.values['p(95)'].toFixed(2) + ' ms' : 'N/A'}
    └─ Master Data:   ${data.metrics.master_data_duration ? data.metrics.master_data_duration.values['p(95)'].toFixed(2) + ' ms' : 'N/A'}

═══════════════════════════════════════════════════════════════════════════════
`;
}
