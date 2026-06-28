function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window === 'undefined' && !url) {
    console.warn('[HireLens] NEXT_PUBLIC_API_BASE_URL is not set — API calls will fail');
  }
  return url ?? '';
}

export const appEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'HireLens AI',
  apiBaseUrl: getApiBaseUrl(),
} as const;
