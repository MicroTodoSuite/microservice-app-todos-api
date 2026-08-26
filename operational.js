'use strict';

// Operational contract for todos-api (spec 009, T080): health probes,
// correlation, non-secret runtime configuration, and a Redis publish that
// cannot take the API down with it.
//
// Kept out of server.js because these are platform concerns rather than todo
// concerns: how Kubernetes decides the pod is alive, how a request stays
// traceable, and what happens to the API when its audit sink is unavailable.

const crypto = require('node:crypto');

// The id a caller may supply and that this service echoes and records. The same
// header is used by the other four services, so one request produces one id
// across every log line and audit entry it touches.
const CORRELATION_HEADER = 'X-Request-Id';

// --- health ----------------------------------------------------------------

// Three separate answers. Collapsing readiness into liveness means a pod that
// is merely draining gets restarted instead of being removed from the Service,
// turning a brief degradation into a crash loop.
function createHealthState () {
  let started = true;
  let ready = true;

  return {
    setStarted (value) { started = value; },
    setReady (value) { ready = value; },
    isStarted () { return started; },
    isReady () { return ready; }
  };
}

// Mounted before the JWT middleware, deliberately.
//
// /todos sits behind expressjwt. A probe mounted after it answers 401,
// Kubernetes reads 401 as unhealthy, and every pod restarts forever while the
// application itself is perfectly fine. The same applies to /metrics: a scrape
// that needs a token stops working during exactly the incident you need it for.
function registerOperationalRoutes (app, health, metricsHandler) {
  app.get('/health/startup', (req, res) => {
    if (!health.isStarted()) {
      return res.status(503).json({ status: 'starting' });
    }
    return res.status(200).json({ status: 'ok' });
  });

  // "Should this pod receive traffic right now."
  app.get('/health/ready', (req, res) => {
    if (!health.isReady()) {
      return res.status(503).json({ status: 'not-ready' });
    }
    return res.status(200).json({ status: 'ok' });
  });

  // "Is this process wedged." It must not consult Redis: Redis carries the
  // audit log, and letting its outage restart every todos-api pod would turn a
  // logging incident into an API outage.
  app.get('/health/live', (req, res) => res.status(200).json({ status: 'ok' }));

  if (metricsHandler) {
    app.get('/metrics', metricsHandler);
  }
}

// --- correlation -----------------------------------------------------------

function correlationMiddleware () {
  return function (req, res, next) {
    const id = req.get(CORRELATION_HEADER) || crypto.randomUUID();
    req.correlationId = id;
    res.set(CORRELATION_HEADER, id);
    next();
  };
}

// --- runtime configuration -------------------------------------------------

function envBool (name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true' || raw === '1';
}

function envInt (name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value < 0) return fallback;
  return value;
}

// Non-secret operational values only.
//
// This object gets logged at startup so an operator can see what the pod
// actually loaded, which is exactly why the JWT secret must not be in it: a
// secret in a loggable object is a secret in the log aggregator.
function loadRuntimeConfig () {
  return {
    features: {
      // Off by default. A toggle that defaults on ships its behaviour to
      // production the moment it merges, which defeats the point of having one.
      verboseErrors: envBool('TODO_API_FEATURE_VERBOSE_ERRORS', false)
    },
    redis: {
      // Usable rather than zero: a zero timeout means every audit write fails
      // instantly, so a missing ConfigMap key would silently disable the audit
      // trail rather than degrade it.
      publishTimeoutMs: envInt('TODO_API_REDIS_PUBLISH_TIMEOUT_MS', 1000),
      failureThreshold: envInt('TODO_API_REDIS_BREAKER_THRESHOLD', 5),
      breakerOpenMs: envInt('TODO_API_REDIS_BREAKER_OPEN_MS', 10000)
    }
  };
}

// --- Redis safety ----------------------------------------------------------

// node-redis surfaces connection failures as an 'error' event on the client.
// An unhandled 'error' event terminates the Node process, so without this a
// Redis restart takes todos-api down with it — for a dependency that only
// carries the audit log.
function attachRedisErrorHandler (redisClient, logger = console) {
  if (!redisClient || typeof redisClient.on !== 'function') return redisClient;

  redisClient.on('error', error => {
    logger.error(JSON.stringify({
      level: 'error',
      msg: 'redis_client_error',
      error: error && error.message ? error.message : String(error)
    }));
  });

  return redisClient;
}

// Stops publishing to a Redis that is clearly down.
//
// Once Redis is failing, every create would otherwise wait out the full timeout
// before succeeding, so a logging outage becomes a latency incident on the API.
// The breaker closes itself after its window rather than needing a restart.
function createCircuitBreaker ({ failureThreshold = 5, openMs = 10000 } = {}) {
  let failures = 0;
  let openedAt = 0;
  let isOpen = false;

  return {
    allows () {
      if (!isOpen) return true;
      if (Date.now() - openedAt >= openMs) {
        // Half-open: allow one probe through.
        isOpen = false;
        failures = failureThreshold - 1;
        return true;
      }
      return false;
    },
    recordSuccess () {
      failures = 0;
      isOpen = false;
    },
    recordFailure () {
      failures += 1;
      if (failures >= failureThreshold) {
        isOpen = true;
        openedAt = Date.now();
      }
    },
    get open () { return isOpen; }
  };
}

// Publishes an audit line without ever letting Redis fail the request.
//
// Three things can go wrong and all three are contained here: the callback
// reports an error, the call throws synchronously, or it never settles at all.
// The last is the nastiest — a hung Redis would otherwise hold every create
// open indefinitely — so the promise resolves on a timer regardless.
//
// It resolves rather than rejects on failure by design. The caller is a todo
// write, and the audit line is best-effort; a rejected promise here would only
// invite someone to await it and reintroduce the coupling.
function publishAudit (redisClient, channel, message, { timeoutMs = 1000, breaker, logger = console } = {}) {
  return new Promise(resolve => {
    if (breaker && !breaker.allows()) {
      logger.error(JSON.stringify({ level: 'warn', msg: 'redis_audit_skipped_circuit_open', channel }));
      return resolve({ published: false, reason: 'circuit-open' });
    }

    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      if (breaker) {
        if (result.published) breaker.recordSuccess();
        else breaker.recordFailure();
      }
      resolve(result);
    };

    const timer = setTimeout(() => {
      logger.error(JSON.stringify({ level: 'warn', msg: 'redis_audit_timeout', channel, timeoutMs }));
      finish({ published: false, reason: 'timeout' });
    }, timeoutMs);
    if (typeof timer.unref === 'function') timer.unref();

    const done = result => {
      clearTimeout(timer);
      finish(result);
    };

    try {
      redisClient.publish(channel, message, error => {
        if (error) {
          logger.error(JSON.stringify({
            level: 'error',
            msg: 'redis_audit_failed',
            channel,
            error: error.message
          }));
          return done({ published: false, reason: 'error' });
        }
        return done({ published: true });
      });
    } catch (error) {
      logger.error(JSON.stringify({
        level: 'error',
        msg: 'redis_audit_threw',
        channel,
        error: error.message
      }));
      done({ published: false, reason: 'threw' });
    }
  });
}

module.exports = {
  CORRELATION_HEADER,
  createHealthState,
  registerOperationalRoutes,
  correlationMiddleware,
  loadRuntimeConfig,
  attachRedisErrorHandler,
  createCircuitBreaker,
  publishAudit
};
