const DEFAULT_API_BASE_URL = 'https://hirelens-ai-y87h.onrender.com/api/v1';

export const appEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'HireLens AI',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
} as const;
