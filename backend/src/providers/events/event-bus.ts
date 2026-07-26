import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { businessEventsCounter } from '../metrics';

export type EventHandler<T = any> = (payload: T) => Promise<void> | void;

export class EventBus {
  private publisher: any = null;
  private subscriber: any = null;
  private readonly handlers = new Map<string, EventHandler[]>();
  private isConnected = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (!env.REDIS_URL) {
      logger.warn('REDIS_URL not provided, EventBus will run in memory-only mode');
      return;
    }

    try {
      const ioredisModule = await import('ioredis');
      const Redis = ioredisModule.default;

      this.publisher = new Redis(env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      });

      this.subscriber = new Redis(env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      });

      await Promise.all([this.publisher.connect(), this.subscriber.connect()]);

      this.isConnected = true;
      logger.info('EventBus successfully connected to Redis');

      this.subscriber.on('message', async (channel: string, message: string) => {
        try {
          const payload = JSON.parse(message);
          await this.dispatchToHandlers(channel, payload);
        } catch (error) {
          logger.error({ err: error, channel, message }, 'Failed to process event bus message');
        }
      });
    } catch (err) {
      logger.warn({ err }, 'Failed to initialize Redis for EventBus, falling back to memory mode');
    }
  }

  public async publish<T>(event: string, payload: T): Promise<void> {
    businessEventsCounter.inc({ event_type: event });

    if (this.isConnected && this.publisher) {
      try {
        await this.publisher.publish(event, JSON.stringify(payload));
        return;
      } catch (error) {
        logger.error({ err: error, event }, 'Failed to publish event to Redis');
        // Fall through to memory mode
      }
    }
    
    // In-memory fallback
    process.nextTick(() => {
      this.dispatchToHandlers(event, payload).catch(err => {
        logger.error({ err, event }, 'Error in memory fallback dispatch');
      });
    });
  }

  public async subscribe<T>(event: string, handler: EventHandler<T>): Promise<void> {
    const existing = this.handlers.get(event) || [];
    this.handlers.set(event, [...existing, handler as EventHandler]);

    if (this.isConnected && this.subscriber && existing.length === 0) {
      try {
        await this.subscriber.subscribe(event);
      } catch (error) {
        logger.error({ err: error, event }, 'Failed to subscribe to Redis channel');
      }
    }
  }

  private async dispatchToHandlers(event: string, payload: any): Promise<void> {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers || eventHandlers.length === 0) return;

    for (const handler of eventHandlers) {
      try {
        await handler(payload);
      } catch (error) {
        logger.error({ err: error, event }, 'Event handler failed');
      }
    }
  }

  public async close(): Promise<void> {
    this.isConnected = false;
    if (this.publisher) {
      await this.publisher.quit().catch(() => {});
    }
    if (this.subscriber) {
      await this.subscriber.quit().catch(() => {});
    }
  }
}

export const eventBus = new EventBus();
