type ErrorStateProps = Readonly<{
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}>;

export function ErrorState({
  title = 'Something went wrong',
  message,
  actionLabel,
  onAction,
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-950">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-red-800">{message}</p>
      {actionLabel && onAction ? (
        <button
          className="mt-4 rounded-md bg-red-900 px-4 py-2 text-sm font-medium text-white"
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
