'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { Field } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextAreaField } from '@/components/forms/text-area-field';
import {
  recruiterProfileFormSchema,
  studentProfileFormSchema,
  type RecruiterProfileSchemaValues,
  type StudentProfileFormInput,
  type StudentProfileSchemaValues,
} from '@/features/profile/profile.schemas';
import {
  useCurrentProfileQuery,
  useUpdateProfileMutation,
} from '@/features/profile/use-profile-mutations';
import { useAuthStore } from '@/stores/auth.store';
import { isProfileComplete, isRecruiterProfile, isStudentProfile } from '@/utils/profile-completion';

export function CompleteProfileForm() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const profileQuery = useCurrentProfileQuery(Boolean(user));

  useEffect(() => {
    if (profileQuery.data && isProfileComplete(profileQuery.data)) {
      router.replace('/dashboard');
    }
  }, [profileQuery.data, router]);

  if (profileQuery.isLoading) {
    return <LoadingState label="Loading profile" />;
  }

  if (profileQuery.isError) {
    return (
      <ErrorState
        actionLabel="Try again"
        message="We could not load your profile. Please retry before continuing."
        onAction={() => void profileQuery.refetch()}
      />
    );
  }

  if (!profileQuery.data || !user) {
    return <LoadingState label="Preparing profile" />;
  }

  if (user.role === 'STUDENT' && isStudentProfile(profileQuery.data.profile)) {
    return <StudentProfileForm profile={profileQuery.data.profile} />;
  }

  if (user.role === 'RECRUITER' && isRecruiterProfile(profileQuery.data.profile)) {
    return <RecruiterProfileForm profile={profileQuery.data.profile} />;
  }

  return <ErrorState message="Your profile type does not match your account role." />;
}

type StudentProfileFormProps = Readonly<{
  profile: {
    fullName: string | null;
    university: string | null;
    degree: string | null;
    graduationYear: number | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    bio: string | null;
  };
}>;

function StudentProfileForm({ profile }: StudentProfileFormProps) {
  const router = useRouter();
  const mutation = useUpdateProfileMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<StudentProfileFormInput, unknown, StudentProfileSchemaValues>({
    resolver: zodResolver(studentProfileFormSchema),
    defaultValues: {
      fullName: profile.fullName ?? '',
      university: profile.university ?? '',
      degree: profile.degree ?? '',
      graduationYear: profile.graduationYear ?? new Date().getFullYear(),
      githubUrl: profile.githubUrl ?? '',
      linkedinUrl: profile.linkedinUrl ?? '',
      portfolioUrl: profile.portfolioUrl ?? '',
      bio: profile.bio ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      router.replace('/dashboard');
    } catch {
      // Mutation onError already shows toast
    }
  });

  return (
    <form className="grid gap-5 sm:grid-cols-2" noValidate onSubmit={onSubmit}>
      <Field error={errors.fullName} id="fullName" label="Full Name" registration={register('fullName')} />
      <Field error={errors.university} id="university" label="University" registration={register('university')} />
      <Field error={errors.degree} id="degree" label="Degree" registration={register('degree')} />
      <Field
        error={errors.graduationYear}
        id="graduationYear"
        label="Graduation Year"
        registration={register('graduationYear', { valueAsNumber: true })}
        type="number"
      />
      <Field error={errors.githubUrl} id="githubUrl" label="GitHub URL" registration={register('githubUrl')} type="url" />
      <Field error={errors.linkedinUrl} id="linkedinUrl" label="LinkedIn URL" registration={register('linkedinUrl')} type="url" />
      <Field error={errors.portfolioUrl} id="portfolioUrl" label="Portfolio URL" registration={register('portfolioUrl')} type="url" />
      <div className="sm:col-span-2">
        <TextAreaField error={errors.bio} id="bio" label="Bio" registration={register('bio')} />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton isLoading={mutation.isPending}>Complete profile</SubmitButton>
      </div>
    </form>
  );
}

type RecruiterProfileFormProps = Readonly<{
  profile: {
    companyName: string | null;
    designation: string | null;
    companyWebsite: string | null;
    bio: string | null;
  };
}>;

function RecruiterProfileForm({ profile }: RecruiterProfileFormProps) {
  const router = useRouter();
  const mutation = useUpdateProfileMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RecruiterProfileSchemaValues>({
    resolver: zodResolver(recruiterProfileFormSchema),
    defaultValues: {
      companyName: profile.companyName ?? '',
      designation: profile.designation ?? '',
      companyWebsite: profile.companyWebsite ?? '',
      bio: profile.bio ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      router.replace('/dashboard');
    } catch {
      // Mutation onError already shows toast
    }
  });

  return (
    <form className="grid gap-5 sm:grid-cols-2" noValidate onSubmit={onSubmit}>
      <Field error={errors.companyName} id="companyName" label="Company Name" registration={register('companyName')} />
      <Field error={errors.designation} id="designation" label="Designation" registration={register('designation')} />
      <div className="sm:col-span-2">
        <Field
          error={errors.companyWebsite}
          id="companyWebsite"
          label="Company Website"
          registration={register('companyWebsite')}
          type="url"
        />
      </div>
      <div className="sm:col-span-2">
        <TextAreaField error={errors.bio} id="bio" label="Bio" registration={register('bio')} />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton isLoading={mutation.isPending}>Complete profile</SubmitButton>
      </div>
    </form>
  );
}
