'use strict';

// Operational contract for todos-api (spec 009, T075).
//
// The Redis cases are the reason this file exists. todos-api publishes an audit
// line to Redis on every create and delete, but Redis is a *logging* dependency:
// losing it must degrade the audit trail, not the API. Today it does neither
// safely — `publish` is called with no callback, and node-redis surfaces those
// failures as an 'error' event on the client, which crashes the Node process
// when nothing is listening. A Redis restart therefore takes the whole todo API
// down with it.

const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const jwt = require('jsonwebtoken');
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

function stubTracer () {
  return {
    id: {
      _traceId: { value: 'trace-id' },
      _spanId: 'span-id',
      _sampled: { value: true }
    },
    scoped: callback => callback()
  };
}

function buildApp (overrides = {}) {
  const publications = [];
  const redisClient = overrides.redisClient || {
    publish: (channel, message, callback) => {
      publications.push({ channel, message });
      if (callback) callback(null, 1);
    }
  };

  const app = createApp({
    tracer: stubTracer(),
    redisClient,
    logChannel: 'test-log-channel',
    jwtSecret: 'test-secret',
    enableTracing: false,
    ...overrides.appOptions
  });

  return { app, publications };
}

function tokenFor (username = 'alice') {
  return jwt.sign({ username }, 'test-secret', { algorithm: 'HS256' });
}

// --- health probes ---------------------------------------------------------

// The specific trap in this service: /todos sits behind expressjwt. A probe
// mounted after that middleware answers 401, Kubernetes reads 401 as "not
// healthy", and every pod is restarted forever while the app is perfectly fine.
test('health probes answer without a JWT', async () => {
  const { app } = buildApp();
  const base = await start(app);

  for (const path of ['/health/startup', '/health/ready', '/health/live']) {
    const response = await fetch(`${base}${path}`);
    assert.equal(
      response.status,
      200,
      `${path} returned ${response.status} without a token; a probe behind the JWT middleware restarts every pod forever`
    );
    const body = await response.json();
    assert.equal(body.status, 'ok', `${path} reported ${body.status}`);
  }
});

test('readiness can fail while liveness still passes', async () => {
  const { app } = buildApp();
  const base = await start(app);

  app.locals.health.setReady(false);

  const ready = await fetch(`${base}/health/ready`);
  assert.equal(ready.status, 503, 'readiness must fail once the app declares itself not ready');

  const live = await fetch(`${base}/health/live`);
  assert.equal(
    live.status,
    200,
    'liveness must stay healthy while merely not ready: a pod draining connections must be removed from the Service, not restarted'
  );
});

// --- Redis resilience ------------------------------------------------------

// Redis carries the audit log, not the todos. Losing it must cost the audit
// line, not the request.
test('a create still succeeds when Redis publish fails', async () => {
  const { app } = buildApp({
    redisClient: {
      publish: (channel, message, callback) => {
        if (callback) return callback(new Error('READONLY You cannot write against a read only replica'));
        throw new Error('READONLY You cannot write against a read only replica');
      }
    }
  });
  const base = await start(app);

  const response = await fetch(`${base}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenFor()}`
    },
    body: JSON.stringify({ content: 'survives a redis outage' })
  });

  assert.equal(
    response.status,
    200,
    'a Redis failure must not fail the request: Redis carries the audit line, not the todo'
  );
  const body = await response.json();
  assert.equal(body.content, 'survives a redis outage');
});

// node-redis emits failures as an 'error' event on the client. An unhandled
// 'error' event terminates the Node process, so a Redis restart would take
// todos-api down with it.
test('a Redis client error event does not crash the process', async () => {
  const { EventEmitter } = require('node:events');
  const redisClient = new EventEmitter();
  redisClient.publish = (channel, message, callback) => { if (callback) callback(null, 1); };

  const { app } = buildApp({ redisClient });
  await start(app);

  assert.ok(
    redisClient.listenerCount('error') > 0,
    'nothing listens for the Redis client error event; an unhandled error event terminates the process'
  );

  // Emitting must not throw now that a listener exists.
  assert.doesNotThrow(() => redisClient.emit('error', new Error('connection lost')));
});

// A publish that never settles must not hold the response open. Without a
// bound, a hung Redis turns every create into a hung request.
test('a Redis publish that never settles does not hold the request open', async () => {
  const { app } = buildApp({
    redisClient: {
      publish: () => { /* never calls back */ }
    },
    appOptions: { redisPublishTimeoutMs: 50 }
  });
  const base = await start(app);

  const response = await Promise.race([
    fetch(`${base}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenFor()}`
      },
      body: JSON.stringify({ content: 'not blocked by redis' })
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('request hung waiting on Redis')), 3000))
  ]);

  assert.equal(response.status, 200, 'the request must complete even when Redis never answers');
});

// --- correlation -----------------------------------------------------------

test('a supplied correlation id is echoed back', async () => {
  const { app } = buildApp();
  const base = await start(app);

  const response = await fetch(`${base}/health/live`, {
    headers: { 'X-Request-Id': 'caller-supplied-id' }
  });

  assert.equal(response.headers.get('x-request-id'), 'caller-supplied-id');
});

test('a correlation id is generated when the caller supplies none', async () => {
  const { app } = buildApp();
  const base = await start(app);

  const response = await fetch(`${base}/health/live`);
  assert.ok(response.headers.get('x-request-id'), 'an untraced request must still get an id');
});

// The audit line is only useful if it can be tied back to the request that
// produced it.
test('the Redis audit line carries the correlation id', async () => {
  const { app, publications } = buildApp();
  const base = await start(app);

  await fetch(`${base}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenFor()}`,
      'X-Request-Id': 'audit-correlation-id'
    },
    body: JSON.stringify({ content: 'correlated' })
  });

  assert.equal(publications.length, 1, 'a create must publish exactly one audit line');
  const payload = JSON.parse(publications[0].message);
  assert.equal(
    payload.correlationId,
    'audit-correlation-id',
    'the audit line must carry the correlation id, or it cannot be tied to the request that caused it'
  );
});

// --- configuration ---------------------------------------------------------

test('feature toggles default off', async () => {
  const { loadRuntimeConfig } = require('../operational');
  delete process.env.TODO_API_FEATURE_VERBOSE_ERRORS;

  const config = loadRuntimeConfig();
  assert.equal(
    config.features.verboseErrors,
    false,
    'an enabled-by-default toggle reaches production on merge, which defeats the point of a toggle'
  );
});

test('runtime config defaults are usable rather than zero', async () => {
  const { loadRuntimeConfig } = require('../operational');
  delete process.env.TODO_API_REDIS_PUBLISH_TIMEOUT_MS;

  const config = loadRuntimeConfig();
  assert.ok(
    config.redis.publishTimeoutMs > 0,
    'a zero publish timeout means every audit write fails instantly'
  );
});

test('runtime config carries no secret material', async () => {
  const { loadRuntimeConfig } = require('../operational');
  process.env.JWT_SECRET = 'super-secret-value';

  try {
    const rendered = JSON.stringify(loadRuntimeConfig());
    assert.ok(
      !rendered.includes('super-secret-value'),
      'the runtime config carries the JWT secret; config objects get logged and this would leak it'
    );
  } finally {
    delete process.env.JWT_SECRET;
  }
});

// --- metrics ---------------------------------------------------------------

// The golden-signal dashboard and the error-rate alert both query these exact
// names. Renaming one silently empties a panel and disarms an alert.
test('metrics expose the golden-signal series without a token', async () => {
  const { app } = buildApp();
  const base = await start(app);

  // Produce a request first: a Prometheus vec exports nothing until a label
  // combination has been observed.
  await fetch(`${base}/health/live`);

  const response = await fetch(`${base}/metrics`);
  assert.equal(response.status, 200, '/metrics must be scrapeable without a token');

  const body = await response.text();
  for (const series of ['todo_api_requests_total', 'todo_api_request_duration_seconds']) {
    assert.ok(body.includes(series), `/metrics is missing ${series}`);
  }
});
