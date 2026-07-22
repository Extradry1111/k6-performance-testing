/**
 * Load test: simulates expected normal-to-peak traffic on the two highest-
 * traffic read endpoints (product listing and login verification) with a
 * realistic ramp-up / steady-state / ramp-down shape, rather than an
 * instant jump to full load — a sudden jump would mostly test connection
 * handling, not the sustained-load behavior this scenario is meant to check.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, THRESHOLDS } from './config.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp-up: 0 -> 10 VUs
    { duration: '1m', target: 10 },   // steady-state at 10 VUs
    { duration: '30s', target: 25 },  // ramp-up: 10 -> 25 VUs (simulated peak hour)
    { duration: '1m', target: 25 },   // steady-state at peak
    { duration: '30s', target: 0 },   // ramp-down
  ],
  thresholds: THRESHOLDS,
};

export default function () {
  // Weighted mix: browsing the catalog happens far more often than logging
  // in, which is a more realistic traffic shape than hitting every endpoint
  // with equal frequency.
  const roll = Math.random();

  if (roll < 0.7) {
    const res = http.get(`${BASE_URL}/productsList`);
    check(res, {
      'productsList status is 200': (r) => r.status === 200,
    });
  } else {
    const res = http.post(`${BASE_URL}/verifyLogin`, {
      email: 'not-a-real-user@example.com',
      password: 'wrong-password-123',
    });
    // Intentionally using invalid credentials for load-testing purposes:
    // this endpoint's read/validation path (hitting the user lookup) is
    // exercised the same way regardless of whether the login succeeds,
    // and it avoids creating/verifying real accounts under load, which
    // would pollute the shared target's user database.
    check(res, {
      'verifyLogin status is 200': (r) => r.status === 200,
    });
  }

  sleep(Math.random() * 2 + 1); // 1-3s "think time" between actions
}
