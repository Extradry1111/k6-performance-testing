/**
 * Local mock server used ONLY to validate that the k6 scripts in this
 * project run correctly and produce meaningful metrics, in an environment
 * with no outbound network access to the real target (automationexercise.com).
 *
 * Adds artificial latency (with jitter, and mild degradation as concurrent
 * requests increase) so the captured k6 output has a realistic-looking
 * response time distribution rather than sub-millisecond localhost noise.
 * This is NOT part of the portfolio deliverable — see README.md for how
 * these same scripts are meant to run against the live API.
 */
const http = require('http');

let inFlight = 0;

function sendJson(res, status, body, delayMs) {
  setTimeout(() => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
    inFlight--;
  }, delayMs);
}

function latencyFor(baseMs) {
  // Base latency + jitter + a mild penalty that grows with concurrent
  // in-flight requests, to roughly simulate a system under increasing load
  // rather than a flat, unrealistic response time regardless of VU count.
  const jitter = Math.random() * 40;
  const loadPenalty = Math.min(inFlight * 1.5, 300);
  return baseMs + jitter + loadPenalty;
}

const server = http.createServer((req, res) => {
  inFlight++;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api', '');

  if (path === '/productsList' && req.method === 'GET') {
    return sendJson(
      res,
      200,
      { responseCode: 200, products: [{ id: 1, name: 'Blue Top', price: 'Rs. 500' }] },
      latencyFor(45)
    );
  }

  if (path === '/verifyLogin' && req.method === 'POST') {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      sendJson(res, 200, { responseCode: 404, message: 'User not found!' }, latencyFor(60));
    });
    return;
  }

  sendJson(res, 404, { message: 'Not found in mock server' }, 10);
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Mock API server (with simulated latency) listening on :${PORT}`));
