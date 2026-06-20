type SubmitButtonProps = Readonly<{
  children: string;
  disabled?: boolean;
  isLoading?: boolean;
}>;

export function SubmitButton({ children, disabled = false, isLoading = false }: SubmitButtonProps) {
  return (
    <button
      className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={disabled || isLoading}
      type="submit"
    >
      {isLoading ? 'Please wait...' : children}
    </button>
  );
}
