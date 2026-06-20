import type { AIProvider } from '../ai/types';
import type { ParsedResume, ResumeParser } from './types';

export class PDFResumeParser implements ResumeParser {
  constructor(private readonly aiProvider?: AIProvider) {}

  async parse(buffer: Buffer, mimeType: string): Promise<ParsedResume> {
    let text = '';

    if (mimeType === 'application/pdf') {
      try {
        const { PDFParse } = await import('pdf-parse');
        const pdf = new PDFParse(buffer);
        await pdf.load();
        text = await pdf.getText();
      } catch {
        text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }

    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const parsed: ParsedResume = {
      rawText: text,
      skills: [],
      experience: [],
      education: [],
      summary: lines.slice(0, 5).join(' '),
    };

    if (this.aiProvider && text.trim().length > 0) {
      try {
        parsed.skills = await this.aiProvider.extractSkillsFromText(text);
      } catch {
        // AI enrichment is best-effort; fall back to empty arrays
      }
    }

    return parsed;
  }
}
