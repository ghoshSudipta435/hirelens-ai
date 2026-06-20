import type { UploadApiResponse } from 'cloudinary';

import { cloudinary } from '../../config/cloudinary';

export type UploadResourceType = 'image' | 'raw';

export type CloudinaryUploadInput = {
  buffer: Buffer;
  originalName: string;
  folder: string;
  resourceType: UploadResourceType;
};

export type CloudinaryUploadResult = {
  publicId: string;
  secureUrl: string;
};

export type CloudinaryStorage = {
  uploadFile(input: CloudinaryUploadInput): Promise<CloudinaryUploadResult>;
  deleteFile(input: { publicId: string; resourceType: UploadResourceType }): Promise<void>;
  createSignedUrl(input: { publicId: string; resourceType: UploadResourceType }): string;
  downloadFile(input: { url: string }): Promise<Buffer>;
};

function normalizeCloudinaryResourceType(resourceType: UploadResourceType) {
  return resourceType === 'image' ? 'image' : 'raw';
}

function uploadBufferStream(
  buffer: Buffer,
  options: {
    folder: string;
    originalName: string;
    resourceType: UploadResourceType;
  },
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: normalizeCloudinaryResourceType(options.resourceType),
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          const uploadError: Error =
            error instanceof Error ? error : new Error('Cloudinary upload failed');

          reject(uploadError);

          return;
        }

        if (!result) {
          reject(new Error('Cloudinary upload returned no result'));

          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
}

async function downloadFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export const cloudinaryStorage: CloudinaryStorage = {
  uploadFile: async ({ buffer, folder, originalName, resourceType }) => {
    const result = await uploadBufferStream(buffer, { folder, originalName, resourceType });

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
    };
  },
  deleteFile: async ({ publicId, resourceType }) => {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: normalizeCloudinaryResourceType(resourceType),
      invalidate: true,
    });
  },
  createSignedUrl: ({ publicId, resourceType }) =>
    cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      resource_type: normalizeCloudinaryResourceType(resourceType),
    }),
  downloadFile: async ({ url }) => downloadFromUrl(url),
};
