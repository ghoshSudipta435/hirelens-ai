import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { initSentry } from './middleware/sentry';

initSentry();

const app = createApp();

const server = app.listen(env.PORT, () => {
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

function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Received shutdown signal, closing connections');

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      const { stopWorkers } = await import('./workers');
      await stopWorkers();
      logger.info('Background workers stopped');
    } catch (error) {
      logger.warn({ err: error }, 'Error stopping background workers');
    }
    try {
      await prisma.$disconnect();
      logger.info('Database connections closed');
    } catch (error) {
      logger.error({ err: error }, 'Error disconnecting from database');
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception, shutting down');
  process.exit(1);
});
