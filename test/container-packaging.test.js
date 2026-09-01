'use strict';

const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { test } = require('node:test');

test('the runtime image contains the operational contract module', async () => {
  const dockerfile = await readFile(path.join(__dirname, '..', 'Dockerfile'), 'utf8');
  const runtimeCopy = dockerfile
    .split('\n')
    .find(line => line.startsWith('COPY --chown=65532:65532 '));

  assert.ok(runtimeCopy, 'the runtime source COPY instruction is missing');
  assert.match(
    runtimeCopy,
    /(?:^|\s)operational\.js(?:\s|$)/,
    'server.js requires ./operational, but the runtime image does not copy operational.js'
  );
});
