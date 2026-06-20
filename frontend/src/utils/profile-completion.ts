import type { ProfileResponse, RecruiterProfile, StudentProfile } from '@/types/profile';

function hasValue(value: string | number | null | undefined): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  return Boolean(value?.trim());
}

export function isStudentProfile(profile: ProfileResponse['profile']): profile is StudentProfile {
  return 'university' in profile;
}

export function isRecruiterProfile(profile: ProfileResponse['profile']): profile is RecruiterProfile {
  return 'companyName' in profile;
}

export function isProfileComplete(profileResponse: ProfileResponse): boolean {
  const { profile, user } = profileResponse;

  if (user.role === 'STUDENT' && isStudentProfile(profile)) {
    return (
      hasValue(profile.fullName) &&
      hasValue(profile.university) &&
      hasValue(profile.degree) &&
      hasValue(profile.graduationYear) &&
      hasValue(profile.bio)
    );
  }

  if (user.role === 'RECRUITER' && isRecruiterProfile(profile)) {
    return (
      hasValue(profile.companyName) &&
      hasValue(profile.designation) &&
      hasValue(profile.bio)
    );
  }

  return false;
}
