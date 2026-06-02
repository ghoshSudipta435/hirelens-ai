export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Phase 2 Skeleton
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          HireLens AI monorepo is scaffolded and ready for feature implementation.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
          The frontend uses Next.js App Router with TailwindCSS and TypeScript. Product
          features, dashboards, and API integrations will be added in Phase 2.
        </p>
      </div>
    </main>
  );
}
