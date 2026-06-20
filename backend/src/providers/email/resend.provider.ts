import type { EmailOptions, EmailProvider } from './types';

export class ResendEmailProvider implements EmailProvider {
  private readonly from: string;
  private readonly apiKey: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(options: EmailOptions): Promise<{ id: string }> {
    const { Resend } = await import('resend');
    const resend = new Resend(this.apiKey);

    const result = await resend.emails.send({
      from: this.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return { id: result.data?.id ?? '' };
  }
}
