import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { OpenAIProvider } from './openai.provider';
import type { AIProvider } from './types';

let aiProviderInstance: AIProvider | null = null;

export async function getAIProvider(): Promise<AIProvider> {
  if (aiProviderInstance) return aiProviderInstance;

  // Priority: Ollama > llama.cpp > OpenAI
  if (env.OLLAMA_BASE_URL) {
    const { OllamaProvider } = await import('./ollama/ollama.provider');
    aiProviderInstance = new OllamaProvider({
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_MODEL ?? 'llama3.1',
    });
    logger.info({ provider: 'ollama', model: env.OLLAMA_MODEL ?? 'llama3.1' }, 'AI provider initialized');
  } else if (env.LLAMACPP_BASE_URL) {
    const { LlamaCppProvider } = await import('./llamacpp/llamacpp.provider');
    aiProviderInstance = new LlamaCppProvider({
      baseUrl: env.LLAMACPP_BASE_URL,
      model: env.LLAMACPP_MODEL ?? 'default',
    });
    logger.info({ provider: 'llamacpp', model: env.LLAMACPP_MODEL ?? 'default' }, 'AI provider initialized');
  } else if (env.OPENAI_API_KEY) {
    aiProviderInstance = new OpenAIProvider(env.OPENAI_API_KEY);
    logger.info({ provider: 'openai', model: 'gpt-4o-mini' }, 'AI provider initialized');
  } else {
    throw new Error('No AI provider configured. Set OLLAMA_BASE_URL, LLAMACPP_BASE_URL, or OPENAI_API_KEY.');
  }

  return aiProviderInstance;
}

export function resetAIProvider(): void {
  aiProviderInstance = null;
}

export type { AIProvider } from './types';
export * from './types';
