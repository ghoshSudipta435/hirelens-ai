'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { appEnv } from '@/config/env';
import * as resumeService from '@/services/resume.service';
import { useAuthStore } from '@/stores/auth.store';

type ResumeViewerModalProps = {
  resumeId: string | null;
  onClose: () => void;
};

export function ResumeViewerModal({ resumeId, onClose }: ResumeViewerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

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

  const viewUrl = resume && accessToken ? `${appEnv.apiBaseUrl}/resumes/${resume.id}/file?token=${accessToken}#toolbar=0&navpanes=0&scrollbar=0` : '';


  return (
    <dialog
      ref={dialogRef}
      className="w-[95vw] max-w-4xl rounded-lg border border-border bg-surface p-0 shadow-xl backdrop:bg-black/40 sm:w-full"
      style={{ height: '85dvh', maxHeight: '90dvh' }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h2 className="text-lg font-semibold text-foreground">
            {resume?.title ?? 'Resume'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-background hover:text-foreground"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1">
          {resume && viewUrl ? (
            <iframe
              src={viewUrl}
              title="Resume PDF"
              className="h-full w-full rounded-b-lg border-0"
            >
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div>
                  <p className="text-muted">Your browser does not support inline PDF viewing.</p>
                  <a
                    href={resume.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Open in new tab
                  </a>
                </div>
              </div>
            </iframe>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
