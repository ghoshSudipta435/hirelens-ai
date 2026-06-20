# ISSUE 29 — Audit Log Partitioning & Archival Strategy

## Overview

Audit tables (`AuthAuditEvent`, `UploadAuditEvent`, `ResumeAuditEvent`) will grow indefinitely. This document defines the partitioning and archival strategy.

## Current Schema

Three audit tables with similar structure:
- `AuthAuditEvent` — Auth events (register, login, refresh, logout)
- `UploadAuditEvent` — Upload operations
- `ResumeAuditEvent` — Resume CRUD operations

All have: `id`, `eventType`, `success`, `createdAt`, optional `userId`/`ownerId`, `ipAddress`, `userAgent`, `metadata`.

## Partitioning Strategy

### PostgreSQL Native Partitioning (Recommended)

Partition by `createdAt` using monthly ranges:

```sql
-- Convert AuthAuditEvent to partitioned table
CREATE TABLE auth_audit_event_partitioned (
  LIKE auth_audit_event INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE auth_audit_event_2026_01 PARTITION OF auth_audit_event_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE auth_audit_event_2026_02 PARTITION OF auth_audit_event_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... etc
```

### Migration Plan

1. Create partitioned tables
2. Migrate existing data
3. Create a partition manager function
4. Update application code to use partitioned tables
5. Drop old tables after verification

### Partition Management Function

```sql
-- Auto-create future partitions (run monthly via cron/pg_cron)
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
DECLARE
  partition_date DATE := date_trunc('month', NOW() + INTERVAL '1 month');
  partition_name TEXT;
  next_date DATE;
BEGIN
  next_date := partition_date + INTERVAL '1 month';
  partition_name := 'auth_audit_event_' || to_char(partition_date, 'YYYY_MM');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF auth_audit_event_partitioned FOR VALUES FROM (%L) TO (%L)',
    partition_name, partition_date, next_date
  );
END;
$$ LANGUAGE plpgsql;
```

## Archival Strategy

### Retention Policy

| Table | Active | Archive | Delete After |
|-------|--------|---------|-------------|
| AuthAuditEvent | 12 months | 12-24 months | 24 months |
| UploadAuditEvent | 12 months | 12-24 months | 24 months |
| ResumeAuditEvent | 12 months | 12-24 months | 24 months |

### Archive Process

1. Export old partitions to CSV/Parquet
2. Store in S3/GCS cold storage
3. Drop old partitions from PostgreSQL

### Archive Worker (BullMQ)

```typescript
// workers/audit-archive.worker.ts
export async function archiveOldPartitions(): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 12);

  // Export partition data to cold storage
  // Drop partition from PostgreSQL
}
```

## Performance Impact

- Queries on recent data: 10-50x faster (partition pruning)
- Storage: 30-50% reduction via compression on old partitions
- Maintenance: Automated via pg_cron

## Migration Script

The migration should be run during a maintenance window:

1. Create partitioned tables
2. Copy data in batches
3. Swap table names
4. Create indexes on partitioned tables
5. Verify application queries work correctly

## Rollback Plan

1. Keep old tables renamed (not dropped) for 7 days
2. If issues arise, swap back to original tables
3. Drop old tables after verification period
