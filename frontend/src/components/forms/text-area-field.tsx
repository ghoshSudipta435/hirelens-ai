import type { UseFormRegisterReturn } from 'react-hook-form';

type FieldErrorLike = {
  message?: string;
};

type TextAreaFieldProps = Readonly<{
  label: string;
  id: string;
  error?: FieldErrorLike;
  registration: UseFormRegisterReturn;
  placeholder?: string;
  rows?: number;
}>;

export function TextAreaField({
  label,
  id,
  error,
  registration,
  placeholder,
  rows = 5,
}: TextAreaFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="block text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <textarea
        {...registration}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className="mt-2 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
        id={id}
        placeholder={placeholder}
        rows={rows}
      />
      {error ? (
        <p className="mt-1 text-xs leading-5 text-red-700" id={errorId} role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
