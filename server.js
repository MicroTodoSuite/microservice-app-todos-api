'use strict';

const express = require('express');
const bodyParser = require("body-parser");
const jwt = require('express-jwt');
const prometheus = require('prom-client');
const ZIPKIN_URL = process.env.ZIPKIN_URL || 'http://127.0.0.1:9411/api/v2/spans';

// Import Zipkin modules for tracing
const {
  Tracer,
  BatchRecorder,
  jsonEncoder: { JSON_V2 }
} = require('zipkin');

const CLSContext = require('zipkin-context-cls');
const { HttpLogger } = require('zipkin-transport-http');
const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;

// Configuration for Redis channel
const logChannel = process.env.REDIS_CHANNEL || 'log_channel';

// Redis client configuration
const redisClient = require("redis").createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retry_strategy: function (options) {
    // Retry strategy in case of connection errors
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

const port = process.env.TODO_API_PORT || 8082;
const jwtSecret = process.env.JWT_SECRET || "foo";

const app = express();

// Prometheus metrics routes
const Registry = prometheus.Registry;
const collectDefaultMetrics = prometheus.collectDefaultMetrics;
const register = new Registry();
const prefix = 'todos_api_';

const requestCount = new prometheus.Counter({
  name: 'todo_api_requests_total',
  help: 'Total number of requests handled by the Todo API',
  labelNames: ['method', 'status'],
  registers: [register],
});

collectDefaultMetrics({ register, prefix });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Zipkin tracing setup
const ctxImpl = new CLSContext('zipkin');
const recorder = new BatchRecorder({
  logger: new HttpLogger({
    endpoint: ZIPKIN_URL,
    jsonEncoder: JSON_V2,
    error: (error) => {
      console.error('Error sending data to Zipkin:', error);
    }
  })
});
const localServiceName = 'todos-api';
const tracer = new Tracer({ ctxImpl, recorder, localServiceName });

// Middleware setup
app.use(jwt({ secret: jwtSecret }));
app.use(zipkinMiddleware({ tracer }));

// Error handling middleware for JWT authentication
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({ message: 'Invalid token' });
  }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Route handling
const routes = require('./routes');
routes(app, { tracer, redisClient, logChannel });

app.listen(port, function () {
  console.log('Todo list RESTful API server started on port: ' + port);
});

