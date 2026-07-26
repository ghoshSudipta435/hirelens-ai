function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== 'undefined' && url) {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      if (url.includes('localhost')) {
        return url.replace('localhost', window.location.hostname);
      }
    }
  }
  if (typeof window === 'undefined' && !url) {
    console.warn('[HireLens] NEXT_PUBLIC_API_BASE_URL is not set — API calls will fail');
  }
  return url ?? '';
}

export const appEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'HireLens AI',
  apiBaseUrl: getApiBaseUrl(),
} as const;
