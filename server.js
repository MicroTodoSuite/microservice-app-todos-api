'use strict';

// Tracing starts before express and http load, or their requests produce no
// spans (spec 010).
require('./tracing').start();

const express = require('express');
const { expressjwt } = require('express-jwt');
const redis = require('redis');
const routes = require('./routes');
const { createMetrics } = require('./metrics');
const {
  createHealthState,
  registerOperationalRoutes,
  correlationMiddleware,
  loadRuntimeConfig,
  attachRedisErrorHandler,
  createCircuitBreaker
} = require('./operational');

function createRedisClient () {
  return redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retry_strategy: function (options) {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        return new Error('The server refused the connection');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Retry time exhausted');
      }
      if (options.attempt > 10) {
        console.log('Reattempting to connect to Redis, attempt #' + options.attempt);
        return undefined;
      }
      return Math.min(options.attempt * 100, 2000);
    }
  });
}

function createApp (options = {}) {
  const app = express();
  const redisClient = options.redisClient || createRedisClient();
  const logChannel = options.logChannel || process.env.REDIS_CHANNEL || 'log_channel';
  const jwtSecret = options.jwtSecret || process.env.JWT_SECRET || 'foo';

  const config = options.config || loadRuntimeConfig();
  const health = createHealthState();

  // node-redis reports connection failures as an 'error' event. Unhandled, that
  // event terminates the process, so a Redis restart would take the todo API
  // down for the sake of its audit log.
  attachRedisErrorHandler(redisClient);

  const redisBreaker = createCircuitBreaker({
    failureThreshold: config.redis.failureThreshold,
    openMs: config.redis.breakerOpenMs
  });

  const metrics = createMetrics();

  // Correlation first, so every downstream log line and the audit record all
  // carry the same id.
  app.use(correlationMiddleware());

  app.use(metrics.middleware);
  // Before expressjwt, deliberately: a probe or a scrape that needs a token
  // answers 401, Kubernetes reads that as unhealthy, and every pod restarts
  // forever while the application is fine.
  registerOperationalRoutes(app, health, metrics.handler);

  app.use(expressjwt({
    secret: jwtSecret,
    algorithms: ['HS256'],
    requestProperty: 'user'
  }));

  app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).send({ message: 'Invalid token' });
    }
    return next(err);
  });

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.locals.health = health;
  app.locals.config = config;

  routes(app, {
    redisClient,
    logChannel,
    redisBreaker,
    redisPublishTimeoutMs: options.redisPublishTimeoutMs || config.redis.publishTimeoutMs,
    metrics: metrics.business
  });

  return app;
}

if (require.main === module) {
  const port = process.env.TODO_API_PORT || 8082;
  createApp().listen(port, function () {
    console.log('Todo list RESTful API server started on port: ' + port);
  });
}

module.exports = { createApp, createRedisClient };
