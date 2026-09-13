'use strict';

// Metrics contract for todos-api (spec 011 T001). The golden-signal recording
// rules and the canary gate read these series, so their names, labels, and
// histogram buckets must survive the move to OpenTelemetry, and nothing the
// specification drops (runtime families, scope labels, target_info) may leak
// into the exposition.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { afterEach, test } = require('node:test');
const { createApp } = require('../server');

const openServers = [];
afterEach(async () => {
  await Promise.all(openServers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
});

async function start (app) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  openServers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}

function buildApp () {
  return createApp({
    redisClient: { publish: () => {} },
    logChannel: 'test-log-channel',
    jwtSecret: 'test-secret'
  });
}

// prom-client 15.1.3's default boundaries, which spec 011 R3 preserves.
const BUCKETS = ['0.005', '0.01', '0.025', '0.05', '0.1', '0.25', '0.5', '1', '2.5', '5', '10', '+Inf'];

async function scrapeAfterTraffic () {
  const base = await start(buildApp());
  // A counter or histogram with labels exports nothing until one is observed.
  await fetch(`${base}/health/live`);
  const response = await fetch(`${base}/metrics`);
  assert.equal(response.status, 200, '/metrics must answer without a token');
  return response.text();
}

function samples (body, name) {
  return body.split('\n').filter(line => line.startsWith(`${name}{`) || line.startsWith(`${name} `));
}

function labelNames (line) {
  const labels = line.match(/^[^{\s]+\{([^}]*)\}/);
  return labels ? [...labels[1].matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)="/g)].map(match => match[1]).sort() : [];
}

function labelValue (line, name) {
  const match = line.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : undefined;
}

test('the request counter keeps its name and labels', async () => {
  const body = await scrapeAfterTraffic();
  const lines = samples(body, 'todo_api_requests_total');
  assert.ok(lines.length > 0, 'todo_api_requests_total is missing');
  for (const line of lines) {
    assert.deepEqual(labelNames(line), ['method', 'status'], line);
  }
});

test('the duration histogram keeps its name, labels, and buckets', async () => {
  const body = await scrapeAfterTraffic();
  const buckets = samples(body, 'todo_api_request_duration_seconds_bucket')
    .filter(line => labelValue(line, 'method') === 'GET');
  assert.deepEqual(buckets.map(line => labelNames(line)).filter((names, index, all) => index === all.findIndex(other => other.join() === names.join())), [['le', 'method']]);
  assert.deepEqual(buckets.map(line => labelValue(line, 'le')), BUCKETS);
  for (const suffix of ['_sum', '_count']) {
    const lines = samples(body, `todo_api_request_duration_seconds${suffix}`);
    assert.ok(lines.length > 0, `todo_api_request_duration_seconds${suffix} is missing`);
    for (const line of lines) {
      assert.deepEqual(labelNames(line), ['method'], line);
    }
  }
});

test('the exposition has no scope labels, target_info, or runtime families', async () => {
  const body = await scrapeAfterTraffic();
  assert.doesNotMatch(body, /otel_scope_/, 'scope labels must be disabled');
  assert.equal(samples(body, 'target_info').length, 0, 'target_info must be disabled');
  const runtime = body.split('\n').filter(line => line.startsWith('todos_api_'));
  assert.deepEqual(runtime, [], 'default runtime metrics must no longer be exposed');
});

test('no metric is recorded through prom-client', () => {
  const root = path.join(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal((manifest.dependencies || {})['prom-client'], undefined, 'package.json must not depend on prom-client');
  const sources = fs.readdirSync(root).filter(file => file.endsWith('.js'));
  for (const file of sources) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(text, /require\(['"]prom-client['"]\)/, `${file} must not require prom-client`);
  }
});
