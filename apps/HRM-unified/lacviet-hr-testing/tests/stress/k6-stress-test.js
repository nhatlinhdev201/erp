// tests/stress/k6-stress-test.js

/**
 * LAC VIET HR - Comprehensive Stress Test Suite
 * K6 load/stress/spike testing for all major endpoints
 * 
 * Usage:
 *   k6 run tests/stress/k6-stress-test.js
 *   k6 run --env SCENARIO=stress tests/stress/k6-stress-test.js
 *   k6 run --env SCENARIO=spike tests/stress/k6-stress-test.js
 *   k6 run --env SCENARIO=soak tests/stress/k6-stress-test.js
 */

import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// ════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;
const SCENARIO = __ENV.SCENARIO || 'load';

// Test credentials
const TEST_CREDENTIALS = {
  admin: { email: 'admin@lerp-hrm.com', password: 'AdminP@ss123!' },
  hrManager: { email: 'hr.manager@lerp-hrm.com', password: 'HRM@nagerP@ss123!' },
  employee: { email: 'employee@lerp-hrm.com', password: 'Empl0yeeP@ss123!' },
};

// ════════════════════════════════════════════════════════════════════════════════
// TEST SCENARIOS
// ════════════════════════════════════════════════════════════════════════════════

const scenarios = {
  // Smoke test - minimal load to verify system works
  smoke: {
    executor: 'constant-vus',
    vus: 3,
    duration: '1m',
    tags: { scenario: 'smoke' },
  },
  
  // Load test - normal expected load
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 50 },    // Ramp up
      { duration: '5m', target: 50 },    // Stay at 50
      { duration: '2m', target: 100 },   // Ramp to 100
      { duration: '5m', target: 100 },   // Stay at 100
      { duration: '3m', target: 0 },     // Ramp down
    ],
    tags: { scenario: 'load' },
  },
  
  // Stress test - beyond normal capacity
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 100 },   // Ramp to 100
      { duration: '5m', target: 100 },   // Stay
      { duration: '2m', target: 200 },   // Ramp to 200
      { duration: '5m', target: 200 },   // Stay
      { duration: '2m', target: 300 },   // Ramp to 300
      { duration: '5m', target: 300 },   // Stay
      { duration: '2m', target: 400 },   // Ramp to 400 (breaking point)
      { duration: '5m', target: 400 },   // Stay
      { duration: '5m', target: 0 },     // Ramp down
    ],
    tags: { scenario: 'stress' },
  },
  
  // Spike test - sudden traffic spike
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 10 },   // Warm up
      { duration: '1m', target: 10 },    // Normal load
      { duration: '10s', target: 500 },  // SPIKE!
      { duration: '3m', target: 500 },   // Stay at spike
      { duration: '10s', target: 10 },   // Drop back
      { duration: '2m', target: 10 },    // Recovery
      { duration: '30s', target: 0 },    // Ramp down
    ],
    tags: { scenario: 'spike' },
  },
  
  // Soak test - extended duration
  soak: {
    executor: 'constant-vus',
    vus: 100,
    duration: '1h',
    tags: { scenario: 'soak' },
  },
  
  // Breakpoint test - find maximum capacity
  breakpoint: {
    executor: 'ramping-arrival-rate',
    startRate: 10,
    timeUnit: '1s',
    preAllocatedVUs: 50,
    maxVUs: 1000,
    stages: [
      { duration: '2m', target: 50 },
      { duration: '2m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '2m', target: 300 },
      { duration: '2m', target: 400 },
      { duration: '2m', target: 500 },
    ],
    tags: { scenario: 'breakpoint' },
  },
};

// Dynamic scenario selection
export const options = {
  scenarios: {
    [SCENARIO]: scenarios[SCENARIO] || scenarios.load,
  },
  
  thresholds: {
    // General thresholds
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    
    // Endpoint-specific thresholds
    'http_req_duration{endpoint:login}': ['p(95)<500'],
    'http_req_duration{endpoint:employees}': ['p(95)<500'],
    'http_req_duration{endpoint:dashboard}': ['p(95)<800'],
    'http_req_duration{endpoint:leave}': ['p(95)<500'],
    
    // Custom metrics
    'login_success_rate': ['rate>0.95'],
    'api_error_rate': ['rate<0.05'],
    'cache_hit_rate': ['rate>0.5'],
  },
  
  // Output options
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// ════════════════════════════════════════════════════════════════════════════════
// CUSTOM METRICS
// ════════════════════════════════════════════════════════════════════════════════

// Response time trends
const loginDuration = new Trend('login_duration');
const employeesDuration = new Trend('employees_duration');
const dashboardDuration = new Trend('dashboard_duration');
const leaveDuration = new Trend('leave_duration');
const searchDuration = new Trend('search_duration');

// Success rates
const loginSuccessRate = new Rate('login_success_rate');
const apiErrorRate = new Rate('api_error_rate');
const cacheHitRate = new Rate('cache_hit_rate');

// Counters
const requestCounter = new Counter('total_requests');
const errorCounter = new Counter('total_errors');
const timeoutCounter = new Counter('timeout_errors');

// Gauges
const activeUsers = new Gauge('active_users');

// ════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

function getHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'application/json',
      'Accept-Language': 'vi-VN',
    },
    timeout: '30s',
  };
}

function checkResponse(response, name, expectedStatus = 200) {
  requestCounter.add(1);
  
  const success = check(response, {
    [`${name}: status ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${name}: response time < 1s`]: (r) => r.timings.duration < 1000,
    [`${name}: has body`]: (r) => r.body && r.body.length > 0,
  });
  
  if (!success) {
    errorCounter.add(1);
    apiErrorRate.add(true);
    
    if (response.error === 'timeout') {
      timeoutCounter.add(1);
    }
  } else {
    apiErrorRate.add(false);
  }
  
  // Check cache hit
  const cacheHeader = response.headers['X-Cache'];
  cacheHitRate.add(cacheHeader === 'HIT' || cacheHeader === 'STALE');
  
  return success;
}

function login(credentials) {
  const response = http.post(
    `${API_URL}/auth/login`,
    JSON.stringify(credentials),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'login' } }
  );
  
  loginDuration.add(response.timings.duration);
  
  const success = response.status === 200;
  loginSuccessRate.add(success);
  
  if (success) {
    const body = JSON.parse(response.body);
    return body.accessToken;
  }
  
  return null;
}

// ════════════════════════════════════════════════════════════════════════════════
// SETUP
// ════════════════════════════════════════════════════════════════════════════════

export function setup() {
  console.log(`Starting ${SCENARIO} test against ${BASE_URL}`);
  
  // Verify server is up
  const healthCheck = http.get(`${API_URL}/health`);
  if (healthCheck.status !== 200) {
    fail(`Server not ready: ${healthCheck.status}`);
  }
  
  // Get auth tokens for different user types
  const tokens = {};
  
  for (const [role, creds] of Object.entries(TEST_CREDENTIALS)) {
    const token = login(creds);
    if (token) {
      tokens[role] = token;
      console.log(`✓ Authenticated as ${role}`);
    } else {
      console.log(`✗ Failed to authenticate as ${role}`);
    }
  }
  
  return { tokens };
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN TEST FUNCTION
// ════════════════════════════════════════════════════════════════════════════════

export default function(data) {
  // Select random user token
  const roles = Object.keys(data.tokens);
  const role = roles[Math.floor(Math.random() * roles.length)];
  const token = data.tokens[role];
  
  if (!token) {
    // Try to login if no token
    const creds = TEST_CREDENTIALS[role];
    const newToken = login(creds);
    if (!newToken) {
      sleep(1);
      return;
    }
    data.tokens[role] = newToken;
  }
  
  const headers = getHeaders(token);
  
  // Update active users gauge
  activeUsers.add(__VU);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  group('Dashboard', () => {
    const start = Date.now();
    
    // Dashboard stats
    const statsRes = http.get(`${API_URL}/dashboard/stats`, {
      ...headers,
      tags: { endpoint: 'dashboard' },
    });
    
    dashboardDuration.add(Date.now() - start);
    checkResponse(statsRes, 'dashboard stats');
    
    sleep(0.5);
    
    // Parallel dashboard requests
    const batch = http.batch([
      ['GET', `${API_URL}/employees/count`, null, headers],
      ['GET', `${API_URL}/leave/pending/count`, null, headers],
      ['GET', `${API_URL}/notifications/unread`, null, headers],
    ]);
    
    batch.forEach((res, i) => {
      checkResponse(res, `dashboard batch ${i}`);
    });
  });
  
  sleep(randomBetween(0.5, 1.5));
  
  // ─────────────────────────────────────────────────────────────────────────────
  // EMPLOYEE TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  group('Employees', () => {
    const start = Date.now();
    
    // List employees
    const listRes = http.get(`${API_URL}/employees?page=1&limit=20`, {
      ...headers,
      tags: { endpoint: 'employees' },
    });
    
    employeesDuration.add(Date.now() - start);
    checkResponse(listRes, 'employee list');
    
    // Get single employee if list succeeded
    if (listRes.status === 200) {
      try {
        const employees = JSON.parse(listRes.body).data;
        if (employees && employees.length > 0) {
          const randomEmp = employees[Math.floor(Math.random() * employees.length)];
          
          const detailRes = http.get(`${API_URL}/employees/${randomEmp.id}`, {
            ...headers,
            tags: { endpoint: 'employee-detail' },
          });
          
          checkResponse(detailRes, 'employee detail');
        }
      } catch (e) {
        // Parse error, continue
      }
    }
    
    sleep(0.3);
    
    // Search employees
    const searchTerms = ['Nguyen', 'Tran', 'Le', 'Pham', 'developer', 'manager'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
    const searchStart = Date.now();
    const searchRes = http.get(`${API_URL}/employees/search?q=${encodeURIComponent(term)}&limit=10`, {
      ...headers,
      tags: { endpoint: 'search' },
    });
    
    searchDuration.add(Date.now() - searchStart);
    checkResponse(searchRes, 'employee search');
  });
  
  sleep(randomBetween(0.5, 1));
  
  // ─────────────────────────────────────────────────────────────────────────────
  // LEAVE MANAGEMENT TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  group('Leave Management', () => {
    const start = Date.now();
    
    // List leave requests
    const listRes = http.get(`${API_URL}/leave?page=1&limit=20`, {
      ...headers,
      tags: { endpoint: 'leave' },
    });
    
    leaveDuration.add(Date.now() - start);
    checkResponse(listRes, 'leave list');
    
    // Get leave balance
    const balanceRes = http.get(`${API_URL}/leave/balance`, {
      ...headers,
      tags: { endpoint: 'leave-balance' },
    });
    
    checkResponse(balanceRes, 'leave balance');
    
    // Get leave calendar
    const now = new Date();
    const calendarRes = http.get(
      `${API_URL}/leave/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
      { ...headers, tags: { endpoint: 'leave-calendar' } }
    );
    
    checkResponse(calendarRes, 'leave calendar');
  });
  
  sleep(randomBetween(0.5, 1));
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DEPARTMENT TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  group('Departments', () => {
    const listRes = http.get(`${API_URL}/departments`, {
      ...headers,
      tags: { endpoint: 'departments' },
    });
    
    checkResponse(listRes, 'department list');
    
    // Department tree
    const treeRes = http.get(`${API_URL}/departments/tree`, {
      ...headers,
      tags: { endpoint: 'department-tree' },
    });
    
    checkResponse(treeRes, 'department tree');
  });
  
  sleep(randomBetween(0.5, 1));
  
  // ─────────────────────────────────────────────────────────────────────────────
  // NOTIFICATION TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  group('Notifications', () => {
    const res = http.get(`${API_URL}/notifications?limit=10`, {
      ...headers,
      tags: { endpoint: 'notifications' },
    });
    
    checkResponse(res, 'notifications');
  });
  
  sleep(randomBetween(1, 2));
}

// ════════════════════════════════════════════════════════════════════════════════
// TEARDOWN
// ════════════════════════════════════════════════════════════════════════════════

export function teardown(data) {
  console.log(`\n${SCENARIO.toUpperCase()} TEST COMPLETED`);
  console.log(`Authenticated roles: ${Object.keys(data.tokens).join(', ')}`);
}

// ════════════════════════════════════════════════════════════════════════════════
// SUMMARY REPORT
// ════════════════════════════════════════════════════════════════════════════════

export function handleSummary(data) {
  const summary = generateSummary(data);
  
  return {
    'reports/stress-test-results.json': JSON.stringify(summary, null, 2),
    'reports/stress-test-report.html': htmlReport(data),
    stdout: formatConsoleSummary(summary),
  };
}

function generateSummary(data) {
  const metrics = data.metrics;
  
  return {
    scenario: SCENARIO,
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    
    requests: {
      total: metrics.http_reqs?.values?.count || 0,
      rate: (metrics.http_reqs?.values?.rate || 0).toFixed(2),
      failed: (metrics.http_req_failed?.values?.rate * 100 || 0).toFixed(2) + '%',
    },
    
    response_times: {
      avg: (metrics.http_req_duration?.values?.avg || 0).toFixed(2),
      min: (metrics.http_req_duration?.values?.min || 0).toFixed(2),
      max: (metrics.http_req_duration?.values?.max || 0).toFixed(2),
      p50: (metrics.http_req_duration?.values['p(50)'] || 0).toFixed(2),
      p90: (metrics.http_req_duration?.values['p(90)'] || 0).toFixed(2),
      p95: (metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2),
      p99: (metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2),
    },
    
    endpoints: {
      login: (metrics.login_duration?.values?.avg || 0).toFixed(2),
      employees: (metrics.employees_duration?.values?.avg || 0).toFixed(2),
      dashboard: (metrics.dashboard_duration?.values?.avg || 0).toFixed(2),
      leave: (metrics.leave_duration?.values?.avg || 0).toFixed(2),
      search: (metrics.search_duration?.values?.avg || 0).toFixed(2),
    },
    
    custom_metrics: {
      login_success_rate: ((metrics.login_success_rate?.values?.rate || 0) * 100).toFixed(2) + '%',
      api_error_rate: ((metrics.api_error_rate?.values?.rate || 0) * 100).toFixed(2) + '%',
      cache_hit_rate: ((metrics.cache_hit_rate?.values?.rate || 0) * 100).toFixed(2) + '%',
    },
    
    vus: {
      max: metrics.vus_max?.values?.value || 0,
    },
    
    thresholds: Object.entries(data.thresholds || {}).reduce((acc, [name, result]) => {
      acc[name] = result.ok ? 'PASS' : 'FAIL';
      return acc;
    }, {}),
  };
}

function formatConsoleSummary(summary) {
  return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    LAC VIET HR - STRESS TEST RESULTS                        ║
║                        Scenario: ${summary.scenario.toUpperCase().padEnd(30)}            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  📊 REQUEST STATISTICS                                                       ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║    Total Requests:     ${summary.requests.total.toString().padEnd(15)} Rate: ${summary.requests.rate}/s       ║
║    Failed:             ${summary.requests.failed.padEnd(15)} Max VUs: ${summary.vus.max}             ║
║                                                                              ║
║  ⏱️  RESPONSE TIMES (ms)                                                     ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║    Average: ${summary.response_times.avg.padStart(8)}  │  P50: ${summary.response_times.p50.padStart(8)}  │  P95: ${summary.response_times.p95.padStart(8)}  ║
║    Min:     ${summary.response_times.min.padStart(8)}  │  P90: ${summary.response_times.p90.padStart(8)}  │  P99: ${summary.response_times.p99.padStart(8)}  ║
║    Max:     ${summary.response_times.max.padStart(8)}                                            ║
║                                                                              ║
║  🔗 ENDPOINT PERFORMANCE (avg ms)                                            ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║    Login:      ${summary.endpoints.login.padStart(8)}  │  Dashboard: ${summary.endpoints.dashboard.padStart(8)}       ║
║    Employees:  ${summary.endpoints.employees.padStart(8)}  │  Leave:     ${summary.endpoints.leave.padStart(8)}       ║
║    Search:     ${summary.endpoints.search.padStart(8)}                                            ║
║                                                                              ║
║  📈 CUSTOM METRICS                                                           ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║    Login Success Rate:  ${summary.custom_metrics.login_success_rate.padEnd(10)}                              ║
║    API Error Rate:      ${summary.custom_metrics.api_error_rate.padEnd(10)}                              ║
║    Cache Hit Rate:      ${summary.custom_metrics.cache_hit_rate.padEnd(10)}                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
}

// ════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
