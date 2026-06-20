import type { AIProvider } from '../ai/types';
import { PDFResumeParser } from './pdf.parser';
import type { ResumeParser } from './types';

let parserInstance: ResumeParser | null = null;

export function getResumeParser(aiProvider?: AIProvider): ResumeParser {
  if (!parserInstance) {
    parserInstance = new PDFResumeParser(aiProvider);
  }

  return parserInstance;
}

export type { ResumeParser } from './types';
export * from './types';
