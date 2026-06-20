import type { Resume, UploadedFile } from '@prisma/client';

export type ResumeResponseDto = {
  id: string;
  ownerId: string;
  uploadedFileId: string;
  title: string;
  version: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  fileUrl?: string; // Derived from UploadedFile if joined
};

export type ResumeWithFile = Resume & {
  uploadedFile: UploadedFile;
};

export type ResumeListQuery = {
  page?: number;
  limit?: number;
};

export type ResumeAuditInput = {
  ownerId: string;
  resumeId?: string;
  success: boolean;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};
