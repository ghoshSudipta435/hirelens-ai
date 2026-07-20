import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { AIProvider } from './types';

let aiProviderInstance: AIProvider | null = null;

export async function getAIProvider(): Promise<AIProvider> {
  if (aiProviderInstance) return aiProviderInstance;

  if (env.GEMINI_API_KEY) {
    const { GeminiProvider } = await import('./gemini/gemini.provider');
    aiProviderInstance = new GeminiProvider({
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    });
    logger.info({ provider: 'gemini', model: env.GEMINI_MODEL ?? 'gemini-2.5-flash' }, 'AI provider initialized');
    return aiProviderInstance;
  }

  if (env.OPENAI_API_KEY) {
    const { OpenAIProvider } = await import('./openai.provider');
    aiProviderInstance = new OpenAIProvider(env.OPENAI_API_KEY);
    logger.info({ provider: 'openai' }, 'AI provider initialized');
    return aiProviderInstance;
  }

  if (env.OLLAMA_BASE_URL) {
    const { OllamaProvider } = await import('./ollama/ollama.provider');
    aiProviderInstance = new OllamaProvider({
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_MODEL ?? 'llama3.2',
    });
    logger.info({ provider: 'ollama', model: env.OLLAMA_MODEL ?? 'llama3.2' }, 'AI provider initialized');
    return aiProviderInstance;
  }

  if (env.LLAMACPP_BASE_URL) {
    const { LlamaCppProvider } = await import('./llamacpp/llamacpp.provider');
    aiProviderInstance = new LlamaCppProvider({
      baseUrl: env.LLAMACPP_BASE_URL,
      model: env.LLAMACPP_MODEL ?? 'default',
    });
    logger.info({ provider: 'llamacpp', model: env.LLAMACPP_MODEL ?? 'default' }, 'AI provider initialized');
    return aiProviderInstance;
  }

  throw new Error(
    'No AI provider configured. Set one of: GEMINI_API_KEY, OPENAI_API_KEY, OLLAMA_BASE_URL, or LLAMACPP_BASE_URL.',
  );
}

export function resetAIProvider(): void {
  aiProviderInstance = null;
}

export { OpenAIProvider } from './openai.provider';
export { GeminiProvider } from './gemini/gemini.provider';
export { OllamaProvider } from './ollama/ollama.provider';
export { LlamaCppProvider } from './llamacpp/llamacpp.provider';
export type { AIProvider } from './types';
export * from './types';
