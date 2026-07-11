import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { AIProvider } from './types';

let aiProviderInstance: AIProvider | null = null;

export async function getAIProvider(): Promise<AIProvider> {
  if (aiProviderInstance) return aiProviderInstance;

  if (!env.GEMINI_API_KEY) {
    throw new Error('Gemini is the only supported AI provider. Set GEMINI_API_KEY.');
  }

  const { GeminiProvider } = await import('./gemini/gemini.provider');
  aiProviderInstance = new GeminiProvider({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  });
  logger.info({ provider: 'gemini', model: env.GEMINI_MODEL ?? 'gemini-2.5-flash' }, 'AI provider initialized');

  return aiProviderInstance;
}

export function resetAIProvider(): void {
  aiProviderInstance = null;
}

export type { AIProvider } from './types';
export * from './types';
