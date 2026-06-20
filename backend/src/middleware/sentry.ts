import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';

let sentryInitialized = false;

export function initSentry(): void {
  if (sentryInitialized || !env.SENTRY_DSN || env.NODE_ENV !== 'production') return;

  try {
    // Dynamic import to avoid loading Sentry in dev/test
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: 0.1,
      maxBreadcrumbs: 50,
      beforeSend(event: { request?: { headers?: Record<string, string> } }) {
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });
    sentryInitialized = true;
  } catch {
    // Sentry init failure should not crash the app
  }
}

export function sentryErrorHandler() {
  return (error: Error, _request: Request, response: Response, next: NextFunction) => {
    if (env.SENTRY_DSN && env.NODE_ENV === 'production') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Sentry = require('@sentry/node');
        Sentry.captureException(error);
      } catch {
        // Ignore Sentry errors
      }
    }
    next(error);
  };
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (env.SENTRY_DSN && env.NODE_ENV === 'production') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require('@sentry/node');
      if (context) {
        Sentry.withScope((scope: { setExtra: (key: string, value: unknown) => void }) => {
          for (const [key, value] of Object.entries(context)) {
            scope.setExtra(key, value);
          }
          Sentry.captureException(error);
        });
      } else {
        Sentry.captureException(error);
      }
    } catch {
      // Ignore Sentry errors
    }
  }
}
