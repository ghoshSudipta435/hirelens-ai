/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Job, Queue, Worker, WorkerOptions } from 'bullmq';

import { env } from '../../config/env';
import { logger } from '../../config/logger';

let connection: any = null;

function getConnection(): any {
  if (!connection) {
    if (!env.REDIS_URL) {
      throw new Error('REDIS_URL is required to connect to the queue');
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require('ioredis');
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times: number) {
        // Exponential backoff with a max of 3 seconds
        return Math.min(times * 100, 3000);
      },
      reconnectOnError(err: Error) {
        return err.message.includes('READONLY');
      },
    });
    connection.on('error', (err: Error) => {
      logger.error({ err }, 'Redis connection error');
    });
    connection.on('connect', () => {
      logger.info('Redis connected successfully');
    });
    connection.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });
  }
  return connection;
}

export async function pingRedis(): Promise<boolean> {
  if (!env.REDIS_URL) return false;
  try {
    const conn = getConnection();
    const result = await conn.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error({ error }, 'Redis ping failed');
    return false;
  }
}
export interface QueueJobData {
  [key: string]: unknown;
}

export interface QueueManager {
  getQueue(name: string): Queue;
  getWorker<T = QueueJobData>(
    name: string,
    processor: (job: Job<T>) => Promise<void>,
    opts?: Partial<WorkerOptions>
  ): Worker;
  close(): Promise<void>;
}

let queueManager: QueueManager | null = null;

export async function getQueueManager(): Promise<QueueManager | null> {
  if (!env.REDIS_URL) {
    return null;
  }

  if (queueManager) return queueManager;

  const { Queue: BullMQQueue, Worker: BullMQWorker } = await import('bullmq');
  const conn = getConnection();

  queueManager = {
    getQueue(name: string) {
      return new BullMQQueue(name, { connection: conn });
    },
    getWorker<T = QueueJobData>(
      name: string,
      processor: (job: Job<T>) => Promise<void>,
      opts?: Partial<WorkerOptions>
    ): Worker {
      const worker = new BullMQWorker(name, processor as any, { connection: conn, ...opts });
      
      worker.on('failed', (job: Job | undefined, err: Error) => {
        logger.error({ jobId: job?.id, queueName: name, err: err.message }, 'BullMQ Job failed');
      });
      
      worker.on('error', (err: Error) => {
        logger.error({ queueName: name, err: err.message }, 'BullMQ Worker error');
      });

      return worker;
    },
    async close() {
      await conn.quit();
      connection = null;
      queueManager = null;
    },
  };

  return queueManager;
}

export async function addJob<T = QueueJobData>(
  queueName: string,
  data: T,
  opts?: { delay?: number; attempts?: number; priority?: number }
): Promise<Job<T> | null> {
  const manager = await getQueueManager();
  if (!manager) {
    logger.warn({ queueName }, 'Redis not configured, executing job synchronously');
    // Inline execution fallback
    try {
      const workers = await import('../../workers');
      const mockJob = { data, id: 'sync-' + Date.now() } as unknown as Job<T>;
      
      switch (queueName) {
        case 'resume-parse':
          workers.processResumeParse(mockJob as any).catch(e => logger.error({err:e}, 'Sync job failed'));
          break;
        case 'match-score':
          workers.processMatchScore(mockJob as any).catch(e => logger.error({err:e}, 'Sync job failed'));
          break;
        case 'interview-generate':
          workers.processInterviewGeneration(mockJob as any).catch(e => logger.error({err:e}, 'Sync job failed'));
          break;
        case 'auto-match-generation':
          workers.processAutoMatchGeneration(mockJob as any).catch(e => logger.error({err:e}, 'Sync job failed'));
          break;
      }
    } catch (err) {
      logger.error({ err }, 'Failed to execute job synchronously');
    }
    return null;
  }

  const queue = manager.getQueue(queueName);
  const job = await queue.add(queueName, data as object, {
    delay: opts?.delay,
    attempts: opts?.attempts ?? 3,
    priority: opts?.priority,
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  });

  logger.info({ jobId: job.id, queueName }, 'Job added to queue');
  return job as Job<T>;
}
