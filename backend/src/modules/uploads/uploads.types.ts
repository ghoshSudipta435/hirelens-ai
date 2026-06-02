import type { UploadResourceType } from '@prisma/client';

import type { Upload } from '@prisma/client';

export type UploadResponseDto = {
  upload: Upload;
  signedUrl: string;
};

export type UploadFileContext = {
  originalName: string;
  mimeType: string;
  fileExtension: string;
  fileSizeBytes: number;
  resourceType: UploadResourceType;
};
