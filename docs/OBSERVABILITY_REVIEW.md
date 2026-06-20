# Observability Review — HireLens AI

## Current State

| Component | Status | Coverage |
|-----------|--------|----------|
| **Logging** | ✅ Pino | Good — structured JSON logs |
| **Error Tracking** | ✅ Sentry | Production only |
| **Metrics** | ❌ Missing | No Prometheus/Grafana |
| **Tracing** | ❌ Missing | No OpenTelemetry |
| **Alerting** | ❌ Missing | Manual monitoring only |

---

## Implementation Roadmap

### Phase 1: Foundation (Immediate)

#### 1.1 Structured Logging Enhancement

**Status:** ✅ Partially implemented

Current Pino setup is good. Enhancements needed:

```typescript
// Add request ID tracking
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Add user context to logs
logger.info({ userId: req.user?.id, requestId: req.id }, 'Request processed');
```

#### 1.2 Sentry Enhancement

**Status:** ✅ Implemented

Current Sentry integration captures exceptions. Enhancements:

1. Add performance monitoring
2. Add release tracking
3. Add user context
4. Add breadcrumbs for debugging

```typescript
// Add to sentry.ts
Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Phase 2: Metrics (Next 30 days)

#### 2.1 Prometheus Metrics

Create `backend/src/middleware/metrics.ts`:

```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const registry = new Registry();

// Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [registry],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

// Business metrics
export const resumesUploaded = new Counter({
  name: 'resumes_uploaded_total',
  help: 'Total number of resumes uploaded',
  labelNames: ['user_role'],
  registers: [registry],
});

export const jobsCreated = new Counter({
  name: 'jobs_created_total',
  help: 'Total number of jobs created',
  registers: [registry],
});

export const matchScoresGenerated = new Counter({
  name: 'match_scores_generated_total',
  help: 'Total number of match scores generated',
  labelNames: ['score_range'],
  registers: [registry],
});

// AI metrics
export const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['provider', 'operation'],
  registers: [registry],
});

export const aiRequestDuration = new Histogram({
  name: 'ai_request_duration_seconds',
  help: 'Duration of AI requests in seconds',
  labelNames: ['provider', 'operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [registry],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [registry],
});

// Queue metrics
export const queueJobsTotal = new Counter({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['queue', 'status'],
  registers: [registry],
});

export const queueJobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Duration of queue jobs',
  labelNames: ['queue'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [registry],
});

// Cache metrics
export const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [registry],
});

export const cacheMissesTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [registry],
});
```

#### 2.2 Metrics Endpoint

```typescript
// routes/metrics.route.ts
import { Router } from 'express';
import { registry } from '../middleware/metrics';

export const metricsRouter = Router();

metricsRouter.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});
```

### Phase 3: Distributed Tracing (Next 60 days)

#### 3.1 OpenTelemetry Setup

```typescript
// config/tracing.ts
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';

const provider = new NodeTracerProvider({
  resource: new Resource({
    'service.name': 'hirelens-ai-backend',
    'service.version': process.env.npm_package_version,
  }),
});

const exporter = new OTLPTraceExporter({
  url: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318',
});

provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();
```

#### 3.2 Automatic Instrumentation

```typescript
// Auto-instrument Express
import '@opentelemetry/instrumentation-express';
import '@opentelemetry/instrumentation-http';
import '@opentelemetry/instrumentation-pg';
import '@opentelemetry/instrumentation-redis';
```

### Phase 4: Alerting (Next 90 days)

#### 4.1 Alert Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: hirelens-ai
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High latency detected

      - alert: AIProviderDown
        expr: rate(ai_requests_total{status="error"}[5m]) > 0.1
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: AI provider is down

      - alert: DatabaseSlowQueries
        expr: histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Database queries are slow
```

---

## Dashboard Design

### 1. Overview Dashboard

- Request rate (req/s)
- Error rate (%)
- Response time (p50, p95, p99)
- Active users

### 2. Business Dashboard

- Resumes uploaded (daily/weekly/monthly)
- Jobs created
- Matches generated
- Applications submitted

### 3. AI Dashboard

- AI requests by provider
- AI response times
- AI error rates
- Token usage

### 4. Infrastructure Dashboard

- Database connections
- Redis memory usage
- Queue depth
- Cache hit rates

---

## Implementation Checklist

### Immediate (Next 2 weeks)

- [ ] Add request ID tracking
- [ ] Enhance Sentry with performance monitoring
- [ ] Add business metrics counters
- [ ] Create metrics endpoint

### Short-term (Next 30 days)

- [ ] Set up Prometheus
- [ ] Create Grafana dashboards
- [ ] Add alerting rules
- [ ] Set up OpenTelemetry

### Medium-term (Next 60 days)

- [ ] Add distributed tracing
- [ ] Create runbooks for alerts
- [ ] Add log aggregation
- [ ] Set up on-call rotation

### Long-term (Next 90 days)

- [ ] Add SLO/SLI tracking
- [ ] Create capacity planning dashboards
- [ ] Add cost allocation tracking
- [ ] Set up incident response

---

## Recommended Tools

| Tool | Purpose | Cost |
|------|---------|------|
| **Prometheus** | Metrics collection | Free (self-hosted) |
| **Grafana** | Dashboards | Free (self-hosted) |
| **OpenTelemetry** | Distributed tracing | Free (open source) |
| **Sentry** | Error tracking | Free tier available |
| **Pino** | Logging | Free (open source) |
| **Loki** | Log aggregation | Free (self-hosted) |

---

## Conclusion

The current observability stack is basic but functional. With the enhancements outlined above, HireLens AI can achieve enterprise-grade observability within 90 days.

**Priority:** Implement metrics and alerting first, then add distributed tracing.
