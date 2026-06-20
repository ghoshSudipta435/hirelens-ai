import { logger } from '../../config/logger';
import type { EmailProvider, EmailTemplateData } from './types';
import { renderTemplate } from './templates';

export class EmailService {
  private readonly provider: EmailProvider | null;

  constructor(provider?: EmailProvider) {
    this.provider = provider ?? null;
  }

  async send(templateId: string, to: string | string[], data: EmailTemplateData): Promise<boolean> {
    if (!this.provider) {
      logger.debug({ templateId, to }, 'Email provider not configured, skipping email');
      return false;
    }

    try {
      const { subject, html, text } = renderTemplate(templateId, data);
      const result = await this.provider.send({ to, subject, html, text });
      logger.info({ templateId, to, id: result.id }, 'Email sent successfully');
      return true;
    } catch (error) {
      logger.error({ err: error, templateId, to }, 'Failed to send email');
      return false;
    }
  }
}
