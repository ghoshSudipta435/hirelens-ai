'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import * as resumeService from '@/services/resume.service';

type ResumeViewerModalProps = {
  resumeId: string | null;
  onClose: () => void;
};

export function ResumeViewerModal({ resumeId, onClose }: ResumeViewerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { data: resume } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => resumeService.getResume(resumeId!),
    enabled: !!resumeId,
  });

  const open = !!resumeId;

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  const isPdf = resume?.fileUrl?.endsWith('.pdf') ?? true;

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-4xl rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0 shadow-xl backdrop:bg-black/40"
      style={{ height: '85vh' }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {resume?.title ?? 'Resume'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1">
          {isPdf && resume ? (
            <iframe
              src={resume.fileUrl}
              className="h-full w-full"
              title={resume.title}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <p className="text-[var(--muted)]">Preview not available for this file type.</p>
                <a
                  href={resume?.fileUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
