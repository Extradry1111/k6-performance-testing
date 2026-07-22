/**
 * Spike test: simulates a sudden traffic surge (e.g. a flash sale link
 * going viral) — near-zero traffic, then an abrupt jump, then an abrupt
 * drop. This is a distinct scenario from the load test's gradual ramp on
 * purpose: gradual ramp-up gives a system time to scale (autoscaling,
 * connection pool warm-up); a spike doesn't, and that's exactly the
 * failure mode this scenario is designed to surface.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';

export const options = {
  stages: [
    { duration: '10s', target: 5 },    // baseline
    { duration: '10s', target: 200 },  // sudden spike
    { duration: '1m', target: 200 },   // hold at spike level
    { duration: '10s', target: 5 },    // sudden drop
    { duration: '20s', target: 5 },    // recovery observation window
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.15'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/productsList`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(0.3);
}
