import client from 'prom-client';

// Clear registry to avoid "already registered" errors in tests
client.register.clear();

// Collect default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics();

// Custom Metrics
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 300, 500, 1000, 3000, 5000],
});

export const businessEventsCounter = new client.Counter({
  name: 'business_events_total',
  help: 'Total number of business events (e.g. applications, matches)',
  labelNames: ['event_type'],
});

export const metricsRegistry = client.register;
