'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import * as jobService from '@/services/job.service';
import { useAuthStore } from '@/stores/auth.store';

export function JobList() {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [locationMode, setLocationMode] = useState('');
  const [company, setCompany] = useState('');
  const [debouncedCompany, setDebouncedCompany] = useState('');
  const [category, setCategory] = useState('');
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [sort, setSort] = useState('newest');

  // Simple manual debounce to avoid extra dependency files
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompany(e.target.value);
  };

  const fetchJobs = useCallback(async () => {
    return jobService.listJobs({ 
      page, 
      limit: 20,
      search: debouncedSearch || undefined,
      company: debouncedCompany || undefined,
      employmentType: employmentType || undefined,
      locationMode: locationMode || undefined,
      category: category || undefined,
      salaryMin: salaryMin !== '' ? salaryMin : undefined,
      experienceYears: experienceYears !== '' ? experienceYears : undefined,
      sort: sort,
    });
  }, [page, debouncedSearch, debouncedCompany, employmentType, locationMode, category, salaryMin, experienceYears, sort]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['jobs', page, debouncedSearch, debouncedCompany, employmentType, locationMode, category, salaryMin, experienceYears, sort],
    queryFn: fetchJobs,
  });

  return (
    <div className="space-y-6">
      {/* Advanced Filters */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search jobs by title or keyword..."
              value={search}
              onChange={handleSearchChange}
              onKeyDown={(e) => { if (e.key === 'Enter') { setDebouncedSearch(search); setPage(1); } }}
              onBlur={() => { setDebouncedSearch(search); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-transparent text-sm focus:border-accent outline-none"
            />
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Filter by company..."
              value={company}
              onChange={handleCompanyChange}
              onKeyDown={(e) => { if (e.key === 'Enter') { setDebouncedCompany(company); setPage(1); } }}
              onBlur={() => { setDebouncedCompany(company); setPage(1); }}
              className="w-full px-4 py-2 rounded-lg border border-border bg-transparent text-sm focus:border-accent outline-none"
            />
          </div>
          <select 
            value={sort} 
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="salary_highest">Highest Salary</option>
            <option value="salary_lowest">Lowest Salary</option>
            <option value="company_name">Company Name (A-Z)</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
          <select 
            value={employmentType} 
            onChange={(e) => { setEmploymentType(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent w-full sm:flex-1 sm:w-auto sm:min-w-[120px]"
          >
            <option value="">All Employment</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
          <select 
            value={locationMode} 
            onChange={(e) => { setLocationMode(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent w-full sm:flex-1 sm:w-auto sm:min-w-[120px]"
          >
            <option value="">All Locations</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">Onsite</option>
          </select>
          <select 
            value={category} 
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent w-full sm:flex-1 sm:w-auto sm:min-w-[120px]"
          >
            <option value="">All Categories</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Product">Product</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
          </select>
          <div className="flex w-full sm:flex-1 sm:w-auto gap-4">
            <input
              type="number"
              placeholder="Min Salary"
              value={salaryMin}
              onChange={(e) => { setSalaryMin(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
              className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent w-full min-w-0"
            />
            <input
              type="number"
              placeholder="Max Exp (Yrs)"
              value={experienceYears}
              onChange={(e) => { setExperienceYears(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
              className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent w-full min-w-0"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading jobs..." />
      ) : isError ? (
        <ErrorState message={error instanceof Error ? error.message : 'Failed to load jobs'} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState 
          title="No Jobs Found" 
          message={user?.role === 'RECRUITER'
            ? 'No job postings match your filters. Try adjusting them or create a new posting.'
            : 'No job postings match your search right now. Try adjusting your filters.'}
          icon={
            <svg className="w-8 h-8 text-accent/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          }
        />
      ) : (
        <div className="space-y-4">
          {data.items.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md hover:border-accent/50 group"
            >
              <div className="flex flex-col md:flex-row justify-between gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors truncate w-full sm:w-auto">{job.title}</h3>
                    <div className="flex items-center gap-2">
                      {job.status === 'ACTIVE' && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                      {job.status === 'DRAFT' && (
                        <span className="inline-flex items-center rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted/90">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {job.employmentType.replace('_', ' ')}
                    </span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {job.locationMode}
                    </span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    {job.recruiter?.recruiterProfile?.companyName && (
                      <span className="text-accent font-semibold whitespace-nowrap">{job.recruiter.recruiterProfile.companyName}</span>
                    )}
                    {job.salaryMin != null && job.salaryMax != null && (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ${job.salaryMin!.toLocaleString()} - ${job.salaryMax!.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col flex-wrap md:flex-nowrap gap-2 md:items-end md:justify-center md:min-w-[140px] pt-2 md:pt-0 border-t md:border-t-0 border-border md:border-l md:pl-4">
                  {job.extractedSkills?.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-accent/5 px-2.5 py-1 text-[11px] font-semibold text-accent border border-accent/10 whitespace-nowrap"
                    >
                      {skill}
                    </span>
                  ))}
                  {(job.extractedSkills?.length ?? 0) > 3 && (
                    <span className="rounded-md bg-muted/10 px-2.5 py-1 text-[11px] font-semibold text-muted border border-border whitespace-nowrap">
                      +{job.extractedSkills!.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6 mt-4 border-t border-border">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-surface-hover disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-muted">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-surface-hover disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
