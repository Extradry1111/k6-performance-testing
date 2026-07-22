# Performance Test Plan — automationexercise.com API

## 1. Why These Two Endpoints

Out of the API's full surface (see the companion Postman/Playwright projects
for functional coverage of all of it), performance testing targets two
endpoints specifically:

- **`GET /productsList`** — the highest-traffic read endpoint by far; every
  storefront page view depends on it, directly or indirectly.
- **`POST /verifyLogin`** — the highest-traffic write-adjacent endpoint;
  every session start touches it.

This is a deliberate choice, not full coverage of every endpoint. In a real
sprint, performance testing time is finite — spending it on the two
endpoints that sit on the critical path for almost every user session
returns far more signal than spreading the same effort thin across a dozen
low-traffic endpoints.

## 2. Four Scenarios, Four Different Questions

| Scenario | Question it answers | VU pattern |
|---|---|---|
| **Smoke** (`smoke.js`) | Is the target even healthy right now, before I spend 10 minutes on a heavier test? | 2 VUs, 30s flat |
| **Load** (`load.js`) | Does the API meet its response-time budget under expected normal-to-peak traffic? | Gradual ramp: 0→10→25→0 VUs over ~3.5 min |
| **Stress** (`stress.js`) | Where does the API's behavior start to degrade, and how gracefully? | Gradual ramp: 0→50→100→150→0 VUs over 6 min |
| **Spike** (`spike.js`) | Can the API survive a sudden, unannounced traffic surge (flash sale, viral link) without a gradual warm-up period? | Abrupt jump: 5→200 VUs in 10s, held, then abrupt drop |

Load and stress both ramp gradually but test different things — load asks
"does it meet its SLA at expected traffic," stress asks "where does it
break." Spike is deliberately *not* gradual, because a gradual ramp gives a
system time to do things (autoscale, warm connection pools) that a real
spike doesn't allow for — testing only the gradual scenarios would miss an
entire class of failure.

## 3. Thresholds and the Reasoning Behind Them

```js
// scripts/config.js — shared across smoke and load scenarios
http_req_duration: ['p(95)<800', 'p(99)<1500']  // ms
http_req_failed:   ['rate<0.01']                  // <1% error rate
checks:            ['rate>0.99']                  // >99% functional checks pass
```

- **p95 < 800ms, p99 < 1500ms**: a common, defensible starting budget for a
  read-heavy e-commerce API — tight enough to catch real regressions, loose
  enough to not fail on ordinary network jitter. These are configured in one
  shared file (`config.js`) rather than duplicated per script, so tightening
  the budget later is a one-line change, not a five-file find-and-replace.
- **Stress and spike use looser thresholds on purpose** (`p(95)<3000`,
  error rate up to 10-15%) — those scenarios are explicitly meant to find
  where the system degrades, so treating any degradation as an automatic
  failure would defeat the point. What matters there is capturing *how* it
  degrades (reported in the results, not gated by a pass/fail threshold)
  and confirming it doesn't fall over completely at expected peak load.

## 4. Traffic Shape Realism

`load.js` doesn't hit both endpoints with equal frequency — it weights
`GET /productsList` at 70% and `POST /verifyLogin` at 30%, with 1-3s "think
time" between requests per virtual user. Hitting every endpoint at a flat,
equal, back-to-back rate is a common shortcut in performance test scripts,
but it tests a traffic pattern that doesn't resemble how anyone actually
uses the site — browsing happens far more often than logging in, and real
users pause between actions instead of firing requests in a tight loop.

## 5. What Isn't Covered, and Why

- **Checkout/payment endpoints** — same reasoning as the functional test
  suites in this portfolio: the payment flow on this practice site is a
  mock with no real gateway behind it, so load-testing it would mostly
  measure the site's own mock logic.
- **Database-level metrics** (query time, connection pool saturation) — not
  observable from outside the API as a black box; would require APM
  instrumentation on the target's infrastructure, which isn't available for
  a third-party practice site. Noted here specifically because it's the
  kind of gap worth naming explicitly rather than silently omitting.
