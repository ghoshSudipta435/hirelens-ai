const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const RETRYABLE_CODES = new Set([
  429,
  500,
  502,
  503,
  504,
]);

export class AiTimeoutError extends Error {
  constructor() {
    super('AI request timed out after 30 seconds');
    this.name = 'AiTimeoutError';
  }
}

export class AiRateLimitError extends Error {
  constructor() {
    super('AI rate limit exceeded');
    this.name = 'AiRateLimitError';
  }
}

function isRetryable(error: unknown): boolean {
  if (error instanceof AiTimeoutError) return true;
  if (error instanceof AiRateLimitError) return true;

  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return RETRYABLE_CODES.has(status);
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response: { status: number } }).response;
    if (response?.status && RETRYABLE_CODES.has(response.status)) return true;
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ECONNREFUSED') return true;
  }

  return false;
}

export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const result = await fn(controller.signal);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        lastError = new AiTimeoutError();
      }

      if (!isRetryable(lastError)) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
