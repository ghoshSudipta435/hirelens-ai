export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<{ id: string }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export type EmailTemplateData = Record<string, string | number | undefined>;
