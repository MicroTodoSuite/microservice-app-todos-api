'use strict';

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

function fixture () {
  const publications = [];
  const tracer = {
    id: {
      _traceId: { value: 'trace-id' },
      _spanId: 'span-id',
      _sampled: { value: true }
    },
    scoped: callback => callback()
  };
  const redisClient = {
    publish: (channel, message) => publications.push({ channel, message })
  };
  const app = createApp({
    tracer,
    redisClient,
    logChannel: 'test-log-channel',
    jwtSecret: 'test-secret',
    enableTracing: false
  });
  return { app, publications };
}

test('metrics remains reachable without a bearer token', async () => {
  const { app } = fixture();
  const baseURL = await start(app);
  const response = await fetch(`${baseURL}/metrics`);

  assert.equal(response.status, 200);
  assert.match(await response.text(), /todos_api_process_/);
});

test('todo routes reject missing JWT credentials', async () => {
  const { app } = fixture();
  const baseURL = await start(app);
  const response = await fetch(`${baseURL}/todos`);

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Invalid token' });
});

test('authenticated create publishes the existing Redis event contract', async () => {
  const { app, publications } = fixture();
  const baseURL = await start(app);
  const token = jwt.sign({ username: 'route-test-user' }, 'test-secret', { algorithm: 'HS256' });
  const response = await fetch(`${baseURL}/todos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: 'Verify namespace release' })
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { content: 'Verify namespace release', id: 3 });
  assert.equal(publications.length, 1);
  assert.equal(publications[0].channel, 'test-log-channel');
  assert.deepEqual(JSON.parse(publications[0].message), {
    zipkinSpan: {
      _traceId: { value: 'trace-id' },
      _spanId: 'span-id',
      _sampled: { value: true }
    },
    opName: 'CREATE',
    username: 'route-test-user',
    todoId: 3
  });
});
