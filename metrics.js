'use strict';

// OpenTelemetry metrics for todos-api (gitops spec 011). The instruments keep
// the exact series the golden-signal recording rules and the canary gate read,
// served on the existing /metrics route by the OpenTelemetry Prometheus
// exporter. Scope labels and target_info are off so every series keeps today's
// label set, and no runtime metrics are registered (spec 011 FR-005).

const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { AggregationType, MeterProvider } = require('@opentelemetry/sdk-metrics');

// prom-client 15.1.3's default histogram boundaries, preserved by spec 011 R3.
const REQUEST_DURATION_BOUNDARIES = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

function createMetrics () {
  const exporter = new PrometheusExporter({
    preventServerStart: true,
    withoutScopeInfo: true,
    withoutTargetInfo: true
  });
  const provider = new MeterProvider({
    readers: [exporter],
    views: [{
      instrumentName: 'todo_api_request_duration_seconds',
      aggregation: {
        type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
        options: { boundaries: REQUEST_DURATION_BOUNDARIES }
      }
    }]
  });
  const meter = provider.getMeter('todos-api');

  // The exporter appends _total to a monotonic counter.
  const requestCount = meter.createCounter('todo_api_requests', {
    description: 'Total number of requests handled by the Todo API'
  });
  const requestDuration = meter.createHistogram('todo_api_request_duration_seconds', {
    description: 'Duration of requests handled by the Todo API'
  });

  // Business metrics (spec 011 FR-006, FR-008): no attributes, so no user
  // identity or todo content can reach a label.
  const todosCreated = meter.createCounter('todo_api_todos_created', {
    description: 'Todos created successfully'
  });
  const todosDeleted = meter.createCounter('todo_api_todos_deleted', {
    description: 'Existing todos deleted successfully'
  });
  const business = {
    todoCreated: () => todosCreated.add(1),
    todoDeleted: () => todosDeleted.add(1)
  };

  function middleware (req, res, next) {
    const started = process.hrtime.bigint();
    res.on('finish', () => {
      requestCount.add(1, { method: req.method, status: String(res.statusCode) });
      requestDuration.record(Number(process.hrtime.bigint() - started) / 1e9, { method: req.method });
    });
    next();
  }

  function handler (req, res) {
    exporter.getMetricsRequestHandler(req, res);
  }

  return { middleware, handler, business };
}

module.exports = { createMetrics };
