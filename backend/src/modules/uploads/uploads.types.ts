import type { UploadedFile } from '@prisma/client';

export type UploadedFileResponseDto = {
  uploadedFile: UploadedFile;
  signedUrl: string;
};

export type UploadFileContext = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  resourceType: 'image' | 'raw';
};

export type UploadListQuery = {
  page?: number;
  limit?: number;
};

export type UploadAuditInput = {
  ownerId: string;
  uploadedFileId?: string;
  fileName?: string;
  success: boolean;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};
