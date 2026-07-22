/**
 * Stress test: deliberately pushes past the load test's peak (25 VUs) to
 * find where the API's behavior starts to degrade — rising latency,
 * rising error rate — rather than confirming it copes with expected
 * traffic. The threshold here is intentionally looser than the load test's,
 * since some degradation under stress is expected and useful information,
 * not automatically a failure; what matters is *how* it degrades (graceful
 * slowdown vs. hard failures) and at what VU count it starts.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 150 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // Looser than the load test on purpose — this scenario is meant to
    // find the breaking point, not assert the API has none.
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.10'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/productsList`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(0.5);
}
