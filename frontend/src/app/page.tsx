import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-accent">HireLens AI</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Smarter hiring through AI-powered matching
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted">
          Upload your resume, discover jobs that fit your skills, and get AI-generated interview 
          prep — all in one place.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface"
          >
            Sign in
          </Link>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-6 text-left">
            <div className="text-2xl">📄</div>
            <h3 className="mt-4 font-semibold text-foreground">Upload Resume</h3>
            <p className="mt-2 text-sm text-muted">
              Upload your resume and let AI extract your skills and experience automatically.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-6 text-left">
            <div className="text-2xl">🎯</div>
            <h3 className="mt-4 font-semibold text-foreground">Smart Matching</h3>
            <p className="mt-2 text-sm text-muted">
              Get detailed match scores and skill gap analysis for every job posting.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-6 text-left">
            <div className="text-2xl">🎤</div>
            <h3 className="mt-4 font-semibold text-foreground">Interview Prep</h3>
            <p className="mt-2 text-sm text-muted">
              Generate custom interview questions based on your profile and job requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
