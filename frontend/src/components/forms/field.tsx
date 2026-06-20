import type { UseFormRegisterReturn } from 'react-hook-form';

type FieldErrorLike = {
  message?: string;
};

type FieldProps = Readonly<{
  label: string;
  id: string;
  error?: FieldErrorLike;
  hint?: string;
  registration: UseFormRegisterReturn;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}>;

export function Field({
  label,
  id,
  error,
  hint,
  registration,
  type = 'text',
  autoComplete,
  placeholder,
}: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor={id}>
        {label}
      </label>
      <input
        {...registration}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-teal-900/10"
        id={id}
        placeholder={placeholder}
        type={type}
      />
      {hint && !error ? (
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs leading-5 text-red-700" id={errorId} role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
