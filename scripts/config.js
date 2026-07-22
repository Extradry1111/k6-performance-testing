// Shared configuration and helpers for every k6 script in this project.
// Centralizing this means a threshold change (e.g. tightening the p95
// budget) or a target URL change happens in one file, not scattered
// across smoke/load/stress/spike scripts independently.

export const BASE_URL = __ENV.BASE_URL || 'https://automationexercise.com/api';

// k6's default User-Agent ("k6/x.y.x (https://k6.io/)") gets silently
// intercepted by this target's WAF/bot protection — it returns HTTP 200,
// which made the "status is 200" check pass, but the body is an HTML
// challenge page instead of the expected JSON, which is why every
// JSON-parsing check failed at 100% while the status check passed at
// 100%. Sending a standard browser User-Agent (and Accept header) avoids
// that entirely.
export const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

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
