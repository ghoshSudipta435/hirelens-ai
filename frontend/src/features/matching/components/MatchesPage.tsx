'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import * as matchingService from '@/services/matching.service';

import type { MatchResult } from '@/types/matching';

function CompanyFilterInput({ onSearch }: { onSearch: (val: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <input
      type="text"
      placeholder="Filter by company..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') { onSearch(value); } }}
      onBlur={() => { onSearch(value); }}
      className="w-full px-4 py-2 rounded-lg border border-border bg-transparent text-sm focus:border-accent outline-none"
    />
  );
}

export function MatchesPage() {
  const minScoreThreshold = 65;
  const [showAll, setShowAll] = useState(false);
  const [debouncedCompany, setDebouncedCompany] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [locationMode, setLocationMode] = useState('');
  const category = '';
  const [sort, setSort] = useState('score_highest');
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [page, setPage] = useState(1);

  // Poll status every 3 seconds if not completed
  const { data: statusData } = useQuery({
    queryKey: ['matches-status'],
    queryFn: matchingService.getAutoMatchStatus,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.total > 0 && data.completed < data.total) {
        return 3000;
      }
      return false;
    },
  });

  const isProcessing = statusData && statusData.total > 0 && statusData.completed < statusData.total;

  const fetchMatches = useCallback(async () => {
    return matchingService.listMatches({ 
      page,
      limit: 20,
      contextType: 'AUTO_MATCH',
      minScore: showAll ? undefined : minScoreThreshold,
      company: debouncedCompany || undefined,
      employmentType: employmentType || undefined,
      locationMode: locationMode || undefined,
      category: category || undefined,
      salaryMin: salaryMin !== '' ? salaryMin : undefined,
      sort: sort,
    });
  }, [page, showAll, minScoreThreshold, debouncedCompany, employmentType, locationMode, category, salaryMin, sort]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['auto-matches', showAll, debouncedCompany, employmentType, locationMode, category, salaryMin, sort, page],
    queryFn: fetchMatches,
    enabled: !isProcessing, // don't refetch matches while processing
  });

  const getMatchGroup = (score: number) => {
    if (score >= 90) return 'Excellent Matches';
    if (score >= 80) return 'Very Good Matches';
    if (score >= 65) return 'Good Matches';
    return 'Need Improvement';
  };

  const groupedMatches = data?.items?.reduce((acc, match) => {
    const group = getMatchGroup(match.score);
    if (!acc[group]) acc[group] = [];
    acc[group].push(match);
    return acc;
  }, {} as Record<string, MatchResult[]>) || {};

  const groupOrder = ['Excellent Matches', 'Very Good Matches', 'Good Matches', 'Need Improvement'];

  return (
    <div className="space-y-6">
      {isProcessing && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Processing Resume & Matching Skills...</h3>
            <div className="w-full max-w-md h-2 bg-muted/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-500 ease-in-out"
                style={{ width: `${(statusData.completed / statusData.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted">
              {statusData.completed} / {statusData.total} jobs evaluated
            </p>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${showAll ? 'bg-accent' : 'bg-muted'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showAll ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="text-sm font-medium text-foreground">
                Show All Jobs (default &gt;= 65%)
              </span>
            </label>
          </div>
          <div className="flex-1 relative max-w-sm">
            <CompanyFilterInput onSearch={setDebouncedCompany} />
          </div>
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="score_highest">Highest Match</option>
            <option value="score_lowest">Lowest Match</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="salary">Highest Salary</option>
            <option value="company">Company Name (A-Z)</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-4">
          <select 
            value={employmentType} 
            onChange={(e) => setEmploymentType(e.target.value)}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent flex-1 min-w-[120px]"
          >
            <option value="">All Employment</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
          <select 
            value={locationMode} 
            onChange={(e) => setLocationMode(e.target.value)}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent flex-1 min-w-[120px]"
          >
            <option value="">All Locations</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">Onsite</option>
          </select>
          <input
            type="number"
            placeholder="Min Salary (e.g. 50000)"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value ? Number(e.target.value) : '')}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent flex-1 min-w-[140px]"
          />
        </div>
      </div>

      {isLoading && !isProcessing ? (
        <div className="space-y-12">
          {[1, 2].map((groupIdx) => (
            <div key={groupIdx} className="space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-6 w-48 bg-muted/20 rounded"></div>
                <div className="h-px bg-border flex-1"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((cardIdx) => (
                  <div key={cardIdx} className="flex flex-col rounded-xl border border-border bg-surface p-5 h-[320px]">
                    <div className="h-6 w-3/4 bg-muted/20 rounded mb-4"></div>
                    <div className="h-4 w-1/2 bg-muted/20 rounded mb-6"></div>
                    <div className="space-y-2 mb-8">
                      <div className="h-4 w-full bg-muted/20 rounded"></div>
                      <div className="h-4 w-5/6 bg-muted/20 rounded"></div>
                    </div>
                    <div className="mt-auto h-10 w-full bg-muted/20 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error instanceof Error ? error.message : 'Failed to load matches'} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No Matches Found"
          message="We couldn't find any match results. Generate new matches to see them here."
          icon={
            <svg className="w-8 h-8 text-accent/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          }
        />
      ) : (
        <div className="space-y-12">
          {groupOrder.map((group) => {
            const matches = groupedMatches[group];
            if (!matches || matches.length === 0) return null;

            return (
              <div key={group} className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-foreground">{group}</h2>
                  <div className="h-px bg-border flex-1"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map((match) => (
                    <div key={match.id} className="flex flex-col rounded-xl border border-border bg-surface overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
                      {/* Score Indicator */}
                      <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-sm font-bold text-white shadow-md z-10 bg-gradient-to-r
                        ${match.score >= 90 ? 'from-emerald-400 to-emerald-600' : match.score >= 80 ? 'from-green-400 to-green-600' : match.score >= 65 ? 'from-amber-400 to-amber-600' : 'from-red-400 to-red-600'}`}
                      >
                        {match.score}% Match
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col relative z-0">
                        <div className="pr-16 mb-4">
                          <h3 className="font-bold text-base text-foreground truncate group-hover:text-accent transition-colors">{match.jobPosting?.title}</h3>
                          <div className="text-sm font-medium text-accent mt-1">
                            {match.jobPosting?.recruiter?.recruiterProfile?.companyName || 'Company'}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted flex-wrap">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {match.jobPosting?.locationMode}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              {match.jobPosting?.employmentType?.replace('_', ' ')}
                            </span>
                            {match.jobPosting?.salaryMin !== null && match.jobPosting?.salaryMax !== null && (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium w-full mt-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ${match.jobPosting?.salaryMin?.toLocaleString()} - ${match.jobPosting?.salaryMax?.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 mb-6 flex-1">
                          {match.strengths && match.strengths.length > 0 && (
                            <div className="text-sm bg-accent/5 p-3 rounded-lg border border-accent/10">
                              <span className="font-semibold text-accent block mb-1">Recommendation</span>
                              <p className="text-muted line-clamp-2 leading-relaxed">{match.strengths[0]}</p>
                            </div>
                          )}
                          
                          <div>
                            <span className="font-semibold text-xs text-foreground block mb-2 uppercase tracking-wider">Matched Skills</span>
                            <div className="flex flex-wrap gap-1.5">
                              {match.matchedSkills?.slice(0, 5).map(skill => (
                                <span key={skill} className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  {skill}
                                </span>
                              ))}
                              {(match.matchedSkills?.length || 0) > 5 && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted/20 text-muted border border-border">
                                  +{(match.matchedSkills?.length || 0) - 5}
                                </span>
                              )}
                            </div>
                          </div>
                          {match.missingSkills && match.missingSkills.length > 0 && (
                            <div>
                              <span className="font-semibold text-xs text-foreground block mb-2 uppercase tracking-wider">Missing Skills</span>
                              <div className="flex flex-wrap gap-1.5">
                                {match.missingSkills.slice(0, 3).map(skill => (
                                  <span key={skill} className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                                    {skill}
                                  </span>
                                ))}
                                {match.missingSkills.length > 3 && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted/20 text-muted border border-border">
                                    +{match.missingSkills.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
                          <Link
                            href={`/jobs/${match.jobPosting?.id}`}
                            className="flex-1 text-center py-2.5 px-4 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-all hover:shadow-md hover:scale-[1.02]"
                          >
                            View & Apply
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-border">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-muted">
            Page <span className="text-foreground">{page}</span> of <span className="text-foreground">{data.totalPages}</span>
          </span>
          <button
            disabled={page === data.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
