import type { PublicUser } from '../auth/auth.types';

export type StudentProfileData = {
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
  createdAt: Date;
  updatedAt: Date;
};

export type RecruiterProfileData = {
  userId: string;
  companyName: string | null;
  companyWebsite: string | null;
  designation: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProfileResponse = {
  user: PublicUser;
  profile: StudentProfileData | RecruiterProfileData;
};

export type StudentProfileUpdateInput = {
  fullName?: string | null;
  headline?: string | null;
  university?: string | null;
  degree?: string | null;
  graduationYear?: number | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  bio?: string | null;
};

export type RecruiterProfileUpdateInput = {
  companyName?: string | null;
  companyWebsite?: string | null;
  designation?: string | null;
  bio?: string | null;
};

export type ProfileUpdateInput = StudentProfileUpdateInput | RecruiterProfileUpdateInput;
