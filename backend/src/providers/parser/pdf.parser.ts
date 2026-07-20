import type { AIProvider } from '../ai/types';
import type { ParsedResume, ResumeParser } from './types';

export class PDFResumeParser implements ResumeParser {
  constructor(private readonly aiProvider?: AIProvider) {}

  async parse(buffer: Buffer, mimeType: string): Promise<ParsedResume> {
    let text = '';

    if (mimeType === 'application/pdf') {
      try {
        const { PDFParse } = await import('pdf-parse');
        const pdf = new PDFParse(new Uint8Array(buffer) as unknown as Buffer);
        await pdf.load();
        const result = await pdf.getText() as { text?: string };
        text = result.text ?? '';
      } catch {
        const ascii = buffer.toString('latin1');
        const readable = ascii.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, ' ').trim();
        if (readable.length > 50) {
          text = readable;
        }
      }
    } else if (mimeType === 'text/plain') {
      text = buffer.toString('utf-8');
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        text = result.value ?? '';
      } catch {
        text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ').trim();
      }
    } else {
      text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ').trim();
    }

    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const parsed: ParsedResume = {
      rawText: text,
      skills: [],
      experience: [],
      education: [],
      summary: lines.slice(0, 5).join(' '),
    };

    if (this.aiProvider && text.trim().length > 20) {
      try {
        parsed.skills = await this.aiProvider.extractSkillsFromText(text);
      } catch {
        // AI enrichment is best-effort; fall back to empty arrays
      }
    }

    return parsed;
  }
}
