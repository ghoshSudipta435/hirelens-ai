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
    });
    connection.on('error', (err: Error) => {
      logger.error({ err }, 'Redis connection error');
    });
  }
  return connection;
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
      return new BullMQWorker(name, processor as any, { connection: conn, ...opts });
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
  if (!manager) return null;

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
