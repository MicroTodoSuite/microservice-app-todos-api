'use strict';

const express = require('express');
const { expressjwt } = require('express-jwt');
const prometheus = require('prom-client');
const redis = require('redis');
const {
  Tracer,
  BatchRecorder,
  jsonEncoder: { JSON_V2 }
} = require('zipkin');
const CLSContext = require('zipkin-context-cls');
const { HttpLogger } = require('zipkin-transport-http');
const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;
const routes = require('./routes');

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

function createTracer () {
  const zipkinURL = process.env.ZIPKIN_URL || 'http://127.0.0.1:9411/api/v2/spans';
  const ctxImpl = new CLSContext('zipkin');
  const recorder = new BatchRecorder({
    logger: new HttpLogger({
      endpoint: zipkinURL,
      jsonEncoder: JSON_V2,
      error: (error) => console.error('Error sending data to Zipkin:', error)
    })
  });
  return new Tracer({ ctxImpl, recorder, localServiceName: 'todos-api' });
}

function createApp (options = {}) {
  const app = express();
  const tracer = options.tracer || createTracer();
  const redisClient = options.redisClient || createRedisClient();
  const logChannel = options.logChannel || process.env.REDIS_CHANNEL || 'log_channel';
  const jwtSecret = options.jwtSecret || process.env.JWT_SECRET || 'foo';

  const register = new prometheus.Registry();
  const requestCount = new prometheus.Counter({
    name: 'todo_api_requests_total',
    help: 'Total number of requests handled by the Todo API',
    labelNames: ['method', 'status'],
    registers: [register]
  });
  const requestDuration = new prometheus.Histogram({
    name: 'todo_api_request_duration_seconds',
    help: 'Duration of requests handled by the Todo API',
    labelNames: ['method'],
    registers: [register]
  });
  prometheus.collectDefaultMetrics({ register, prefix: 'todos_api_' });

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.use((req, res, next) => {
    const stopTimer = requestDuration.startTimer({ method: req.method });
    res.on('finish', () => {
      requestCount.labels(req.method, String(res.statusCode)).inc();
      stopTimer();
    });
    next();
  });
  app.use(expressjwt({
    secret: jwtSecret,
    algorithms: ['HS256'],
    requestProperty: 'user'
  }));
  if (options.enableTracing !== false) {
    app.use(zipkinMiddleware({ tracer }));
  }

  app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).send({ message: 'Invalid token' });
    }
    return next(err);
  });

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  routes(app, { tracer, redisClient, logChannel });

  return app;
}

if (require.main === module) {
  const port = process.env.TODO_API_PORT || 8082;
  createApp().listen(port, function () {
    console.log('Todo list RESTful API server started on port: ' + port);
  });
}

module.exports = { createApp, createRedisClient, createTracer };
