'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Field } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextAreaField } from '@/components/forms/text-area-field';
import { createJobFormSchema, type CreateJobFormValues } from '@/features/jobs/jobs.schemas';
import { useCreateJobMutation } from '@/features/jobs/use-job-mutations';
import { useToastStore } from '@/stores/toast.store';

export function JobForm() {
  const router = useRouter();
  const createJobMutation = useCreateJobMutation();
  const pushToast = useToastStore((state) => state.pushToast);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateJobFormValues>({
    resolver: zodResolver(createJobFormSchema),
    defaultValues: {
      title: '',
      description: '',
      employmentType: undefined,
      locationMode: undefined,
      status: 'DRAFT',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await createJobMutation.mutateAsync(values);
      router.push(`/jobs/${result.id}`);
    } catch (err) {
      pushToast({
        title: 'Failed to create job',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
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
            <option value="">Select type</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
          {errors.employmentType ? (
            <p className="mt-1 text-xs leading-5 text-red-700" role="alert">
              {errors.employmentType.message}
            </p>
          ) : null}
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
            <option value="">Select mode</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>
          {errors.locationMode ? (
            <p className="mt-1 text-xs leading-5 text-red-700" role="alert">
              {errors.locationMode.message}
            </p>
          ) : null}
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
        </select>
      </div>

      <SubmitButton isLoading={createJobMutation.isPending}>Create Job Posting</SubmitButton>
    </form>
  );
}
