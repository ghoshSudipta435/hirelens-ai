import axios from 'axios';

import type { ApiErrorResponse } from '@/types/api';

export class ClientApiError extends Error {
  constructor(
    message: string,
    readonly code = 'UNKNOWN_ERROR',
    readonly status?: number,
    readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = 'ClientApiError';
  }
}

export function normalizeApiError(error: unknown): ClientApiError {
  if (error instanceof ClientApiError) {
    return error;
  }

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const response = error.response;
    const payload = response?.data;

    if (payload?.success === false) {
      return new ClientApiError(
        payload.error.message,
        payload.error.code,
        response?.status,
        payload.error.details,
      );
    }

    return new ClientApiError(
      error.message || 'Network request failed',
      'NETWORK_ERROR',
      response?.status,
    );
  }

  if (error instanceof Error) {
    return new ClientApiError(error.message);
  }

  return new ClientApiError('An unexpected error occurred');
}
