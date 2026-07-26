type SubmitButtonProps = Readonly<{
  children: string;
  disabled?: boolean;
  isLoading?: boolean;
}>;

export function SubmitButton({ children, disabled = false, isLoading = false }: SubmitButtonProps) {
  return (
    <button
      className="inline-flex w-full sm:w-auto min-w-[140px] items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled || isLoading}
      type="submit"
    >
      {isLoading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
}
