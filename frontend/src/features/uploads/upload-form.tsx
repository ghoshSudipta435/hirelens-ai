'use client';

import { useCallback, useState } from 'react';

import type { UploadedFile } from '@/types/upload';
import { useUploadFileMutation } from './use-upload-mutations';

type UploadFormProps = {
  onUploadComplete: (file: UploadedFile) => void;
  accept?: string;
  maxSizeMB?: number;
};

export function UploadForm({ onUploadComplete, accept = 'application/pdf', maxSizeMB = 10 }: UploadFormProps) {
  const [dragOver, setDragOver] = useState(false);
  const uploadMutation = useUploadFileMutation();
  const maxBytes = maxSizeMB * 1024 * 1024;

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > maxBytes) {
        return;
      }
      try {
        const result = await uploadMutation.mutateAsync(file);
        onUploadComplete(result);
      } catch {
        // error toast handled by mutation
      }
    },
    [uploadMutation, onUploadComplete, maxBytes, maxSizeMB],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`rounded-lg border-2 border-dashed p-8 text-center transition ${
        dragOver
          ? 'border-[var(--accent)] bg-[var(--accent)]/5'
          : 'border-[var(--border)] hover:border-[var(--accent)]/50'
      }`}
    >
      <input
        accept={accept}
        className="hidden"
        id="file-upload"
        onChange={handleChange}
        type="file"
      />
      <label className="cursor-pointer" htmlFor="file-upload">
        <div className="flex flex-col items-center gap-2">
          <svg className="h-10 w-10 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          </svg>
          {uploadMutation.isPending ? (
            <p className="text-sm text-[var(--muted)]">Uploading...</p>
          ) : (
            <>
              <p className="text-sm text-[var(--foreground)]">
                <span className="font-medium text-[var(--accent)]">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-[var(--muted)]">PDF only &middot; Max {maxSizeMB}MB</p>
            </>
          )}
        </div>
      </label>
    </div>
  );
}
