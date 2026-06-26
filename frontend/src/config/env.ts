export const appEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'HireLens AI',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
} as const;
