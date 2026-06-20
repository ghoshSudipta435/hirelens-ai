import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { initSentry } from './middleware/sentry';

initSentry();

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      apiPrefix: env.API_PREFIX,
    },
    'Backend server started',
  );

  void (async () => {
    try {
      const { startWorkers } = await import('./workers');
      await startWorkers();
    } catch (error) {
      logger.warn({ err: error }, 'Failed to start background workers');
    }
  })();
});
