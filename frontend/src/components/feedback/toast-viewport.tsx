'use client';

import { useEffect } from 'react';

import { useToastStore, type Toast } from '@/stores/toast.store';

const toastStyles: Record<Toast['variant'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  error: 'border-red-200 bg-red-50 text-red-950',
  info: 'border-sky-200 bg-sky-50 text-sky-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
};

function ToastItem({ toast }: Readonly<{ toast: Toast }>) {
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => removeToast(toast.id), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [removeToast, toast.id]);

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${toastStyles[toast.variant]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm leading-5 opacity-85">{toast.description}</p>
          ) : null}
        </div>
        <button
          aria-label="Dismiss notification"
          className="text-lg leading-none opacity-70 hover:opacity-100"
          type="button"
          onClick={() => removeToast(toast.id)}
        >
          x
        </button>
      </div>
    </div>
  );
}

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
