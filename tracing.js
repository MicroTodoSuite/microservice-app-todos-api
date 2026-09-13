'use strict';

// OpenTelemetry tracing for todos-api (spec 010).
//
// server.js requires this file before anything else: the HTTP and Express
// instrumentations patch those modules as they load, so a request handled by
// an Express that loaded first would never produce a span.

const { trace } = require('@opentelemetry/api');
const { W3CTraceContextPropagator } = require('@opentelemetry/core');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { BatchSpanProcessor, NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

const SERVICE_NAME = 'todos-api';

// Probes and scrapes arrive every few seconds; tracing them would bury the
// requests someone actually needs to follow.
const UNTRACED_PATHS = /^\/(?:health\/|metrics(?:[/?]|$))/;

let started = false;

function isExportEnabled (env = process.env) {
  return Boolean(env.OTEL_EXPORTER_OTLP_ENDPOINT);
}

function exportingProcessors (env) {
  if (!isExportEnabled(env)) return [];
  // Loaded only when exporting: the exporter reads OTEL_EXPORTER_OTLP_ENDPOINT
  // itself, and batching keeps export off the request path, so an unreachable
  // collector costs spans and nothing else.
  const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
  return [new BatchSpanProcessor(new OTLPTraceExporter())];
}

// Idempotent. Tests start tracing with an in-memory processor before loading
// the server, which then finds tracing already started.
function start ({ env = process.env, spanProcessors } = {}) {
  if (started) return true;
  const processors = spanProcessors || exportingProcessors(env);
  if (processors.length === 0) return false;

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME || SERVICE_NAME }),
    spanProcessors: processors
  });
  provider.register({ propagator: new W3CTraceContextPropagator() });
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: request => UNTRACED_PATHS.test(request.url || '')
      }),
      new ExpressInstrumentation()
    ]
  });
  started = true;
  return true;
}

function tracer () {
  return trace.getTracer(SERVICE_NAME);
}

module.exports = { isExportEnabled, start, tracer };
