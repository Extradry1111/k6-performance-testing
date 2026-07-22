// Shared configuration and helpers for every k6 script in this project.
// Centralizing this means a threshold change (e.g. tightening the p95
// budget) or a target URL change happens in one file, not scattered
// across smoke/load/stress/spike scripts independently.

export const BASE_URL = __ENV.BASE_URL || 'https://automationexercise.com/api';

// Response-time and error-rate budgets. These are deliberately set based
// on what a reasonable e-commerce API should deliver for read-heavy
// endpoints (product listing, login check) — not arbitrarily loose numbers
// picked to guarantee a green build.
export const THRESHOLDS = {
  http_req_duration: ['p(95)<800', 'p(99)<1500'],
  http_req_failed: ['rate<0.01'], // fewer than 1% of requests may fail
  checks: ['rate>0.99'], // 99%+ of functional checks must pass
};

export function randomEmail() {
  return `k6.perf.${Date.now()}.${Math.floor(Math.random() * 1e6)}@mailinator.com`;
}
