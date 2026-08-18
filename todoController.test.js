'use strict';
const cache = require('memory-cache');
const TodoController = require('./todoController');

// A stub tracer that runs the scoped callback inline and a spyable redis client,
// so the controller's business logic and its publish-to-log_channel path are
// exercised without a real Redis or Zipkin (unit scope; research D3 keeps the
// real dependency for the integration gate).
function makeController(redisClient) {
  const tracer = { scoped: (fn) => fn(), id: 'trace-abc' };
  return new TodoController({ tracer, redisClient, logChannel: 'log_channel' });
}

function mockRes() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('TodoController', () => {
  beforeEach(() => cache.clear());

  test('list returns the seeded todo items for a new user', () => {
    const controller = makeController({ publish: jest.fn() });
    const res = mockRes();

    controller.list({ user: { username: 'alice' } }, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    const items = res.json.mock.calls[0][0];
    expect(Object.keys(items)).toHaveLength(3);
    expect(items['1'].content).toBe('Create new todo');
  });

  test('create adds a todo and publishes a CREATE event to the log channel', () => {
    const redis = { publish: jest.fn() };
    const controller = makeController(redis);
    const res = mockRes();

    controller.create({ user: { username: 'bob' }, body: { content: 'buy milk' } }, res);

    // Seeded lastInsertedID is 3, so the new todo takes id 3.
    expect(res.json).toHaveBeenCalledWith({ content: 'buy milk', id: 3 });
    expect(redis.publish).toHaveBeenCalledTimes(1);
    const [channel, payload] = redis.publish.mock.calls[0];
    expect(channel).toBe('log_channel');
    const msg = JSON.parse(payload);
    expect(msg).toMatchObject({ opName: 'CREATE', username: 'bob', todoId: 3 });
  });

  test('create persists so a subsequent list reflects the new todo', () => {
    const controller = makeController({ publish: jest.fn() });
    controller.create({ user: { username: 'carol' }, body: { content: 'task' } }, mockRes());

    const res = mockRes();
    controller.list({ user: { username: 'carol' } }, res);

    // NOTE: the seed sets lastInsertedID=3 while item '3' already exists, so the
    // first create overwrites id 3 rather than appending (pre-existing behavior
    // of the example app). The stored todo is retrievable at key '3'.
    const items = res.json.mock.calls[0][0];
    expect(items['3'].content).toBe('task');
  });

  test('delete removes a todo and publishes a DELETE event', () => {
    const redis = { publish: jest.fn() };
    const controller = makeController(redis);
    controller.list({ user: { username: 'dave' } }, mockRes()); // seed
    const res = mockRes();

    controller.delete({ user: { username: 'dave' }, params: { taskId: '2' } }, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(redis.publish).toHaveBeenCalledTimes(1);
    const msg = JSON.parse(redis.publish.mock.calls[0][1]);
    expect(msg).toMatchObject({ opName: 'DELETE', username: 'dave', todoId: '2' });

    const after = mockRes();
    controller.list({ user: { username: 'dave' } }, after);
    expect(after.json.mock.calls[0][0]['2']).toBeUndefined();
  });
});
