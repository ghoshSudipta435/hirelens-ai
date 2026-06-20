import type { Readable } from 'node:stream';

import type { UploadApiResponse } from 'cloudinary';

import { cloudinary } from '../../config/cloudinary';
import { logger } from '../../config/logger';
import type { CloudinaryUploadResult, UploadResourceType } from './cloudinary.storage';

export type StreamingUploadInput = {
  fileStream: Readable;
  fileName: string;
  folder: string;
  resourceType: UploadResourceType;
  fileSize: number;
};

export type StreamingUploadProgress = {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
};

export function uploadStream(
  fileStream: Readable,
  options: {
    folder: string;
    fileName: string;
    resourceType: UploadResourceType;
  },
  onProgress?: (progress: StreamingUploadProgress) => void
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    let bytesUploaded = 0;
    const totalBytes = 0;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resourceType === 'image' ? 'image' : 'raw',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          const message = error instanceof Error ? error.message : 'Cloudinary stream upload failed';
          reject(new Error(message));
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary stream upload returned no result'));
          return;
        }
        resolve(result);
      }
    );

    fileStream.on('data', (chunk: Buffer) => {
      bytesUploaded += chunk.length;
      if (onProgress) {
        onProgress({
          bytesUploaded,
          totalBytes,
          percentage: totalBytes > 0 ? Math.round((bytesUploaded / totalBytes) * 100) : 0,
        });
      }
    });

    fileStream.on('error', (err: Error) => {
      uploadStream.destroy(err);
      reject(err);
    });

    fileStream.pipe(uploadStream);
  });
}

export async function streamingUpload(
  input: StreamingUploadInput,
  onProgress?: (progress: StreamingUploadProgress) => void
): Promise<CloudinaryUploadResult> {
  const startTime = Date.now();

  logger.info(
    { fileName: input.fileName, folder: input.folder, resourceType: input.resourceType, fileSize: input.fileSize },
    'Starting streaming upload to Cloudinary'
  );

  const result = await uploadStream(
    input.fileStream,
    {
      folder: input.folder,
      fileName: input.fileName,
      resourceType: input.resourceType,
    },
    onProgress
  );

  const durationMs = Date.now() - startTime;

  logger.info(
    {
      publicId: result.public_id,
      bytes: result.bytes,
      durationMs,
      fileName: input.fileName,
    },
    'Streaming upload completed'
  );

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
}
