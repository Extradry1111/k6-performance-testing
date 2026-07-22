/**
 * Smoke test: 1-2 virtual users for a short duration. The point isn't load —
 * it's a fast sanity check ("does the target even respond correctly right
 * now?") that should run before every heavier scenario, so a load test
 * doesn't waste 10 minutes ramping up against an endpoint that's already
 * returning 500s at baseline.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, THRESHOLDS, DEFAULT_HEADERS } from './config.js';

export const options = {
  vus: 2,
  duration: '30s',
  thresholds: THRESHOLDS,
};

export default function () {
  const res = http.get(`${BASE_URL}/productsList`, { headers: DEFAULT_HEADERS });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'responseCode in body is 200': (r) => {
      try {
        return JSON.parse(r.body).responseCode === 200;
      } catch {
        return false;
      }
    },
    'response has products array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).products);
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
