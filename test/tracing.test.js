'use strict';

// Tracing contract for todos-api (spec 010, T006).
//
// Tracing starts before the server module loads, exactly as server.js starts
// it in production, but spans go to an in-memory exporter instead of OTLP, so
// the assertions read the real spans the instrumentation produces.

const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { afterEach, beforeEach, test } = require('node:test');
const { SpanKind } = require('@opentelemetry/api');
const { InMemorySpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');

const exporter = new InMemorySpanExporter();
const tracing = require('../tracing');
tracing.start({ spanProcessors: [new SimpleSpanProcessor(exporter)] });

const jwt = require('jsonwebtoken');
const { createApp } = require('../server');

const INCOMING_TRACE_ID = '0af7651916cd43dd8448eb211c80319c';
const INCOMING_PARENT_ID = 'b7ad6b7169203331';
const INCOMING_TRACEPARENT = `00-${INCOMING_TRACE_ID}-${INCOMING_PARENT_ID}-01`;
const CHANNEL = 'test-log-channel';

const openServers = [];
beforeEach(() => exporter.reset());
afterEach(async () => {
  await Promise.all(openServers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
});

async function start () {
  const publications = [];
  const app = createApp({
    redisClient: {
      publish: (channel, message, callback) => {
        publications.push({ channel, message: JSON.parse(message) });
        if (callback) callback(null, 1);
      }
    },
    logChannel: CHANNEL,
    jwtSecret: 'test-secret'
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  openServers.push(server);
  return { baseURL: `http://127.0.0.1:${server.address().port}`, publications };
}

const token = jwt.sign({ username: 'trace-user' }, 'test-secret', { algorithm: 'HS256' });

function headers (extra = {}) {
  return { Authorization: `Bearer ${token}`, traceparent: INCOMING_TRACEPARENT, ...extra };
}

async function spansMatching (predicate, { timeoutMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = exporter.getFinishedSpans().filter(predicate);
    if (found.length > 0 || Date.now() > deadline) return found;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
}

test('a traced request continues the incoming W3C trace context', async () => {
  const { baseURL } = await start();
  const response = await fetch(`${baseURL}/todos`, { headers: headers() });
  assert.equal(response.status, 200);

  const servers = await spansMatching(span => span.kind === SpanKind.SERVER);
  assert.equal(servers.length, 1, 'one SERVER span per inbound request');
  assert.equal(servers[0].spanContext().traceId, INCOMING_TRACE_ID);
  assert.equal(servers[0].parentSpanContext.spanId, INCOMING_PARENT_ID);
});

test('probes and scrapes produce no spans', async () => {
  const { baseURL } = await start();
  for (const probe of ['/health/startup', '/health/ready', '/health/live', '/metrics']) {
    const response = await fetch(`${baseURL}${probe}`, { headers: { traceparent: INCOMING_TRACEPARENT } });
    assert.ok(response.status < 500, `${probe} must answer`);
  }

  const spans = await spansMatching(() => true, { timeoutMs: 300 });
  assert.deepEqual(spans.map(span => span.name), []);
});

for (const [operation, method, route] of [['CREATE', 'POST', '/todos'], ['DELETE', 'DELETE', '/todos/1']]) {
  test(`a ${operation} publishes its PRODUCER span context in the audit message`, async () => {
    const { baseURL, publications } = await start();
    const response = await fetch(`${baseURL}${route}`, {
      method,
      headers: headers({ 'Content-Type': 'application/json' }),
      body: method === 'POST' ? JSON.stringify({ content: 'trace me' }) : undefined
    });
    assert.ok(response.status === 200 || response.status === 204);

    const producers = await spansMatching(span => span.kind === SpanKind.PRODUCER);
    assert.equal(producers.length, 1, 'one PRODUCER span per audit publish');
    const producer = producers[0];
    assert.equal(producer.name, `${CHANNEL} publish`);
    assert.equal(producer.attributes['messaging.system'], 'redis');
    assert.equal(producer.attributes['messaging.destination.name'], CHANNEL);
    assert.equal(producer.attributes['messaging.operation.type'], 'publish');
    assert.equal(producer.spanContext().traceId, INCOMING_TRACE_ID, 'the publish belongs to the request trace');

    assert.equal(publications.length, 1);
    const message = publications[0].message;
    assert.equal(message.opName, operation);
    assert.equal(
      message.traceparent,
      `00-${producer.spanContext().traceId}-${producer.spanContext().spanId}-01`,
      'the consumer must be able to continue from the PRODUCER span'
    );
    assert.equal('zipkinSpan' in message, false, 'the retired Zipkin field is no longer published');
  });
}

test('spans never carry the bearer token', async () => {
  const { baseURL } = await start();
  await fetch(`${baseURL}/todos`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ content: 'secret check' })
  });

  const spans = await spansMatching(span => span.kind === SpanKind.PRODUCER);
  assert.ok(spans.length > 0);
  const recorded = JSON.stringify(exporter.getFinishedSpans().map(span => [span.attributes, span.events]));
  assert.equal(recorded.includes(token), false, 'no span may contain the JWT');
  assert.equal(/bearer/i.test(recorded), false, 'no span may contain the Authorization header');
});

test('export is enabled only when an OTLP endpoint is configured', () => {
  assert.equal(tracing.isExportEnabled({}), false);
  assert.equal(tracing.isExportEnabled({ OTEL_EXPORTER_OTLP_ENDPOINT: '' }), false);
  assert.equal(tracing.isExportEnabled({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://jaeger-collector.observability.svc:4317' }), true);
});

test('no Zipkin package remains a dependency', async () => {
  const manifest = JSON.parse(await readFile(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const names = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies });
  assert.deepEqual(names.filter(name => /zipkin/i.test(name)), []);
});

test('the runtime image ships tracing.js', async () => {
  const dockerfile = await readFile(path.join(__dirname, '..', 'Dockerfile'), 'utf8');
  const runtimeCopy = dockerfile.split('\n').find(line => line.startsWith('COPY --chown=65532:65532 '));
  assert.ok(runtimeCopy, 'the runtime source COPY instruction is missing');
  assert.match(runtimeCopy, /(?:^|\s)tracing\.js(?:\s|$)/, 'server.js requires ./tracing, so the image must copy it');
});
