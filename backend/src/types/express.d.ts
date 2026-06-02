import type { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      cookies?: Record<string, string | undefined>;
      file?: Express.Multer.File;
      auth?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export {};
