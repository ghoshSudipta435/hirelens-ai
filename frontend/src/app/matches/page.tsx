
import { PageShell } from '@/components/layout/page-shell';
import { MatchesPage } from '@/features/matching/components/MatchesPage';

export const metadata = {
  title: 'Matches | HireLens AI',
  description: 'View AI-powered job matches based on your uploaded resume.',
};

export default function MatchesRoute() {
  return (
    <PageShell
      eyebrow="Matches"
      title="Job Matches"
      description="Based on your active resume, our AI has found the best opportunities for you."
    >
      <MatchesPage />
    </PageShell>
  );
}
