export const UPLOAD_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
]);

export const ALLOWED_UPLOAD_EXTENSIONS = new Set(['pdf', 'docx', 'png', 'jpg', 'jpeg']);

export const UPLOAD_FOLDER = 'hirelens-ai/uploads';

export const UPLOAD_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const UPLOAD_RATE_LIMIT_MAX = 20;
