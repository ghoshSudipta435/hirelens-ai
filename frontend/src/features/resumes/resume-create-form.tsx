'use client';

import { useState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { UploadForm } from '@/features/uploads/upload-form';
import type { UploadedFile } from '@/types/upload';
import { useCreateResumeMutation } from './use-resume-mutations';

type ResumeCreateFormProps = {
  onSuccess: (resumeId: string) => void;
};

export function ResumeCreateForm({ onSuccess }: ResumeCreateFormProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [title, setTitle] = useState('');
  const createMutation = useCreateResumeMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile || !title.trim()) return;
    try {
      const result = await createMutation.mutateAsync({ uploadedFileId: uploadedFile.id, title: title.trim() });
      onSuccess(result.id);
    } catch {
      // error toast handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      {!uploadedFile ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Upload Resume</label>
          <UploadForm
            onUploadComplete={setUploadedFile}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{uploadedFile.fileName}</p>
              <p className="text-xs text-muted">Uploaded successfully</p>
            </div>
            <button
              type="button"
              onClick={() => setUploadedFile(null)}
              className="text-xs text-muted underline hover:text-foreground"
            >
              Change
            </button>
          </div>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-foreground" htmlFor="title">
            Resume Title
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
            id="title"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Software Engineer Resume 2026"
            type="text"
            value={title}
          />
        </div>

        <SubmitButton
          disabled={!uploadedFile || !title.trim()}
          isLoading={createMutation.isPending}
        >
          Create Resume
        </SubmitButton>
      </form>
    </div>
  );
}
