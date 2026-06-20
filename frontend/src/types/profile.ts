import type { AuthUser } from '@/types/auth';

export type StudentProfile = {
  userId: string;
  fullName: string | null;
  headline: string | null;
  university: string | null;
  degree: string | null;
  graduationYear: number | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecruiterProfile = {
  userId: string;
  companyName: string | null;
  companyWebsite: string | null;
  designation: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileResponse = {
  user: AuthUser;
  profile: StudentProfile | RecruiterProfile;
};

export type StudentProfileFormValues = {
  fullName: string;
  university: string;
  degree: string;
  graduationYear: number;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  bio: string;
};

export type RecruiterProfileFormValues = {
  companyName: string;
  designation: string;
  companyWebsite?: string;
  bio: string;
};

export type ProfileFormValues = StudentProfileFormValues | RecruiterProfileFormValues;
