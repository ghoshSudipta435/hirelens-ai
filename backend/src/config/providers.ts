import type { AIProvider } from '../providers/ai/types';
import type { EmailService } from '../providers/email/email.service';
import type { ResumeParser } from '../providers/parser/types';
import type { CloudinaryStorage } from '../providers/storage/cloudinary.storage';

type ProviderRegistryConfig = {
  aiProvider?: AIProvider;
  storageProvider?: CloudinaryStorage;
  parserProvider?: ResumeParser;
  emailService?: EmailService;
};

class ProviderRegistry {
  private config: ProviderRegistryConfig = {};
  private instances: {
    aiProvider?: AIProvider;
    storageProvider?: CloudinaryStorage;
    parserProvider?: ResumeParser;
    emailService?: EmailService;
  } = {};

  configure(config: ProviderRegistryConfig): void {
    this.config = { ...this.config, ...config };
    this.instances = {};
  }

  reset(): void {
    this.config = {};
    this.instances = {};
  }

  registerAI(provider: AIProvider): void {
    this.config.aiProvider = provider;
    this.instances.aiProvider = provider;
  }

  registerStorage(provider: CloudinaryStorage): void {
    this.config.storageProvider = provider;
    this.instances.storageProvider = provider;
  }

  registerParser(provider: ResumeParser): void {
    this.config.parserProvider = provider;
    this.instances.parserProvider = provider;
  }

  registerEmail(service: EmailService): void {
    this.config.emailService = service;
    this.instances.emailService = service;
  }

  async getAI(): Promise<AIProvider> {
    if (this.instances.aiProvider) return this.instances.aiProvider;
    if (this.config.aiProvider) {
      this.instances.aiProvider = this.config.aiProvider;
      return this.instances.aiProvider;
    }
    const { getAIProvider } = await import('../providers/ai');
    this.instances.aiProvider = await getAIProvider();
    return this.instances.aiProvider;
  }

  async getStorage(): Promise<CloudinaryStorage> {
    if (this.instances.storageProvider) return this.instances.storageProvider;
    if (this.config.storageProvider) {
      this.instances.storageProvider = this.config.storageProvider;
      return this.instances.storageProvider;
    }
    const { cloudinaryStorage } = await import('../providers/storage/cloudinary.storage');
    this.instances.storageProvider = cloudinaryStorage;
    return this.instances.storageProvider;
  }

  async getParser(): Promise<ResumeParser> {
    if (this.instances.parserProvider) return this.instances.parserProvider;
    if (this.config.parserProvider) {
      this.instances.parserProvider = this.config.parserProvider;
      return this.instances.parserProvider;
    }
    const ai = await this.getAI();
    const { PDFResumeParser } = await import('../providers/parser/pdf.parser');
    this.instances.parserProvider = new PDFResumeParser(ai);
    return this.instances.parserProvider;
  }

  async getEmail(): Promise<EmailService | null> {
    if (this.instances.emailService) return this.instances.emailService;
    if (this.config.emailService) {
      this.instances.emailService = this.config.emailService;
      return this.instances.emailService;
    }
    const { env } = await import('./env');
    if (env.RESEND_API_KEY && env.EMAIL_FROM) {
      const { ResendEmailProvider } = await import('../providers/email/resend.provider');
      const { EmailService } = await import('../providers/email/email.service');
      const provider = new ResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM);
      this.instances.emailService = new EmailService(provider);
      return this.instances.emailService;
    }
    return null;
  }
}

export const providers = new ProviderRegistry();
