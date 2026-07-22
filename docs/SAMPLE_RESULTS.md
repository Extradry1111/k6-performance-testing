# Sample Run Results (Local Mock Validation)

Captured from actual `k6 run` executions against the local mock server (see
`mock-server/server.js` and the note in `README.md` about why it exists).
Raw JSON summaries are in `results/*.json`; this document is the
human-readable interpretation of them.

**These numbers describe the mock server, not automationexercise.com.**
They exist to prove the scripts execute correctly end-to-end and produce
real, sensible k6 metrics — not as a performance claim about the live site.
Running the same scripts with `BASE_URL=https://automationexercise.com/api`
(the default) produces real numbers for the actual target; see the CI
workflow for how that's meant to run on a schedule.

## Smoke Test

- 2 VUs, 30 seconds, 56 requests, 168 checks
- **avg 70.3ms · p90 85.4ms · p95 86.7ms**
- 0% error rate, 100% checks passed
- All configured thresholds passed

## Load Test

- Ramp 0→10→25→0 VUs over ~3.5 minutes, 1,528 requests, weighted 70/30
  between `productsList` and `verifyLogin`
- **avg 73.1ms · p90 92.1ms · p95 98.5ms · max 124.8ms**
- 0% error rate, 100% checks passed
- All configured thresholds passed (`p95<800ms`, `p99<1500ms`, error
  rate `<1%`)

## Reading These Numbers

The mock server includes an artificial, load-dependent latency penalty
(see `mock-server/server.js`) specifically so these numbers show a
*response*, not a flat, unrealistic sub-millisecond localhost number
regardless of concurrent load — p95 visibly rising from 86.7ms at 2 VUs
to 98.5ms at up to 25 VUs is the kind of pattern a real load test is meant
to surface, even though the absolute numbers here are from a stand-in
server rather than the real target.

## What a Real Run Against automationexercise.com Would Add

Running these same scripts against the live API (the default `BASE_URL`)
would surface real network latency, real backend processing time, and any
actual capacity limits of the target — none of which a local mock can
represent. The scripts, thresholds, and traffic-shape logic don't change;
only the target does, via the `BASE_URL` environment variable.
