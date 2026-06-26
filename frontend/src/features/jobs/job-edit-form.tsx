'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Field } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextAreaField } from '@/components/forms/text-area-field';
import { updateJobFormSchema, type UpdateJobFormValues } from '@/features/jobs/jobs.schemas';
import { useUpdateJobMutation } from '@/features/jobs/use-job-mutations';
import type { JobPosting } from '@/types/job';

type JobEditFormProps = {
  job: JobPosting;
};

export function JobEditForm({ job }: JobEditFormProps) {
  const router = useRouter();
  const updateJobMutation = useUpdateJobMutation();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateJobFormValues>({
    resolver: zodResolver(updateJobFormSchema),
    defaultValues: {
      title: job.title,
      description: job.description,
      employmentType: job.employmentType,
      locationMode: job.locationMode,
      status: job.status === 'ARCHIVED' ? 'ARCHIVED' : (job.status as 'DRAFT' | 'ACTIVE'),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateJobMutation.mutateAsync({ id: job.id, ...values });
      router.push(`/jobs/${job.id}`);
    } catch {
      // Mutation onError already shows toast
    }
  });

  return (
    <form className="space-y-5" noValidate onSubmit={onSubmit}>
      <Field
        error={errors.title}
        id="title"
        label="Job Title"
        placeholder="e.g. Senior Frontend Engineer"
        registration={register('title')}
      />

      <TextAreaField
        error={errors.description}
        id="description"
        label="Description"
        placeholder="Describe the role, responsibilities, and requirements..."
        registration={register('description')}
        rows={8}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="employmentType">
            Employment Type
          </label>
          <select
            {...register('employmentType')}
            aria-invalid={Boolean(errors.employmentType)}
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-teal-900/10"
            id="employmentType"
          >
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="locationMode">
            Location Mode
          </label>
          <select
            {...register('locationMode')}
            aria-invalid={Boolean(errors.locationMode)}
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-teal-900/10"
            id="locationMode"
          >
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="status">
          Status
        </label>
        <select
          {...register('status')}
          className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-teal-900/10"
          id="status"
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active (Publish)</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <SubmitButton isLoading={updateJobMutation.isPending}>Update Job Posting</SubmitButton>
    </form>
  );
}
