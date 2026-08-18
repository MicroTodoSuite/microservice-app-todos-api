'use strict';

// Integration test (spec 007 / T014): exercises the real publish-to-log_channel
// path against a disposable Redis provided by Testcontainers. Requires Docker.

const assert = require('node:assert/strict');
const { test } = require('node:test');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const { GenericContainer } = require('testcontainers');
const { createApp } = require('../../server');

test('creating a todo publishes a CREATE event to log_channel on real Redis', async () => {
  const container = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();
  const host = container.getHost();
  const port = container.getMappedPort(6379);
  const channel = 'it-log-channel';

  const publisher = redis.createClient({ host, port });
  const subscriber = redis.createClient({ host, port });
  const received = [];

  await new Promise((resolve) => subscriber.on('ready', resolve));
  await new Promise((resolve) => subscriber.subscribe(channel, () => resolve()));
  subscriber.on('message', (ch, message) => {
    if (ch === channel) received.push(JSON.parse(message));
  });

  const app = createApp({
    redisClient: publisher,
    logChannel: channel,
    jwtSecret: 'it-secret',
    enableTracing: false,
    tracer: { id: { traceId: 'it' }, scoped: (cb) => cb() },
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = jwt.sign({ username: 'alice' }, 'it-secret', { algorithm: 'HS256' });

  try {
    const response = await fetch(`${base}/todos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: 'buy milk' }),
    });
    assert.equal(response.status, 200);

    await new Promise((resolve, reject) => {
      const deadline = setTimeout(() => reject(new Error('no message on log_channel')), 5000);
      const poll = setInterval(() => {
        if (received.length > 0) {
          clearInterval(poll);
          clearTimeout(deadline);
          resolve();
        }
      }, 50);
    });

    const event = received.find((m) => m.opName === 'CREATE');
    assert.ok(event, 'expected a CREATE event on log_channel');
    assert.equal(event.username, 'alice');
    assert.equal(typeof event.todoId, 'number');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    publisher.quit();
    subscriber.quit();
    await container.stop();
  }
});
