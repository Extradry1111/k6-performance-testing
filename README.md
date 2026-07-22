# Automation Exercise — k6 Performance Testing

Performance/load test scripts for the [automationexercise.com](https://automationexercise.com)
API — the third leg of a QA portfolio that also includes a
[Playwright functional automation framework](https://github.com/Extradry1111/qa-automation-framework) and a
[Postman/Newman API collection](https://github.com/Extradry1111/postman-api-collection), all targeting
the same API from three different angles: functional correctness (Playwright
+ Postman) and performance under load (this project).

## Why k6

k6 was chosen over JMeter for a few concrete reasons worth stating rather
than assuming: test scripts are JavaScript (consistent with the Playwright
framework in this portfolio, rather than introducing an XML-based DSL),
it's CLI-first and scriptable (fits cleanly into the same GitHub Actions
approach used across this portfolio's other projects), and its threshold
system (`options.thresholds`) makes pass/fail criteria part of the test
script itself rather than a separate manual step of eyeballing a report.

## Scenarios

| Script | What it simulates | Duration |
|---|---|---|
| `scripts/smoke.js` | Baseline health check before running anything heavier | 30s |
| `scripts/load.js` | Expected normal-to-peak traffic, gradual ramp | ~3.5 min |
| `scripts/stress.js` | Traffic beyond expected capacity, to find the breaking point | ~6 min |
| `scripts/spike.js` | Sudden traffic surge with no warm-up period | ~2 min |

Full reasoning for each scenario, the threshold values, and the endpoint
selection is in [`docs/PERFORMANCE_TEST_PLAN.md`](docs/PERFORMANCE_TEST_PLAN.md).

## Sample Results

Real captured output from running these scripts end-to-end — see
[`docs/SAMPLE_RESULTS.md`](docs/SAMPLE_RESULTS.md) for the full write-up and
`results/*.json` for the raw k6 summaries.

**Smoke:** avg 70.3ms · p95 86.7ms · 0% errors · 100% checks passed
**Load (up to 25 VUs):** avg 73.1ms · p95 98.5ms · 0% errors · 100% checks passed

## About the local mock server

`mock-server/server.js` is a small Node script with artificial,
load-dependent latency, used to validate that these k6 scripts actually run
correctly and produce sensible metrics in a sandboxed environment with no
outbound access to the live target. **It is not part of the portfolio
deliverable** — the scripts default to `https://automationexercise.com/api`
and are meant to run against the real target, both locally and in CI. See
`docs/SAMPLE_RESULTS.md` for the full explanation of what the mock does and
doesn't represent.

## Running It

### Install k6
```bash
# macOS
brew install k6

# Linux (see https://grafana.com/docs/k6/latest/set-up/install-k6/ for other distros)
curl -sL https://github.com/grafana/k6/releases/latest/download/k6-linux-amd64.tar.gz -o k6.tar.gz
tar xzf k6.tar.gz --wildcards '*/k6' --strip-components=1
sudo mv k6 /usr/local/bin/k6

# Windows
winget install k6 --source winget
```

### Run against the live target (default)
```bash
k6 run scripts/smoke.js
k6 run scripts/load.js
k6 run scripts/stress.js
k6 run scripts/spike.js
```

### Run against a different target
```bash
BASE_URL=https://staging.example.com/api k6 run scripts/load.js
```

### Validate against the local mock (no internet required)
```bash
node mock-server/server.js &
BASE_URL=http://localhost:3000/api k6 run scripts/load.js
```

### Export a JSON summary (for CI artifacts or historical comparison)
```bash
k6 run --summary-export results/load-test-summary.json scripts/load.js
```

## CI

`.github/workflows/k6-performance.yml` runs the smoke and load scenarios
weekly against the live API (performance testing is scheduled rather than
run on every PR — see the workflow file for the reasoning), with results
uploaded as build artifacts. The load job depends on the smoke job passing
first, so a genuinely down target doesn't waste minutes running a full load
scenario against it.

## Project Structure

```
k6-performance-testing/
├── README.md
├── scripts/
│   ├── config.js        # shared thresholds, target URL, helpers
│   ├── smoke.js
│   ├── load.js
│   ├── stress.js
│   └── spike.js
├── mock-server/
│   └── server.js         # local validation aid, see note above
├── results/
│   ├── smoke-test-summary.json   # captured from a real local validation run
│   └── load-test-summary.json    # captured from a real local validation run
├── docs/
│   ├── PERFORMANCE_TEST_PLAN.md  # methodology, scenario reasoning, thresholds
│   └── SAMPLE_RESULTS.md          # interpretation of the captured results
└── .github/workflows/
    └── k6-performance.yml
```
