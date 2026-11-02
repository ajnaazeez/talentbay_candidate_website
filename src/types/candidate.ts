export interface Address {
  city: string;
  state: string;
  country: string;
}

export interface JobPreference {
  role: string;
  employmentType: string; // Full-time, Part-time, Internship, Contract
  workMode: string; // On-site, Remote, Hybrid
  preferredLocations: string[];
  preferredIndustry: string;
  salaryCurrency: string;
  salaryMin: number;
  salaryMax: number;
  noticePeriod: string;
}

export interface Skill {
  name: string;
  type: string; // Primary, Secondary, Tool
  level: string; // Beginner, Intermediate, Expert
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  companyName: string;
  employmentType?: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
  grade?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  role: string;
  link?: string;
}

export interface Certification {
  name: string;
  organization: string;
  issueDate: string;
  expiryDate?: string | null;
  credentialUrl?: string;
}

export interface CandidateModel {
  uid: string;
  email: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  designation?: string;
  createdAt: string | Date;

  // Personal Info
  dob?: string | null;
  gender?: string;
  currentLocation?: Address | null;
  nationality?: string;
  willingToRelocate?: boolean;

  // Summary
  bio?: string; // Headline
  aboutMe?: string;

  // Preferences & Sections
  jobPreference?: JobPreference | null;
  skills?: Skill[];
  workExperience?: WorkExperience[];
  education?: Education[];
  projects?: Project[];
  certifications?: Certification[];

  // Resume & Links
  resumeUrl?: string;
  portfolioUrl?: string;
  githubProfile?: string;
  linkedinProfile?: string;
  otherLinks?: string[];

  // Additional
  languages?: Record<string, string>;
  achievements?: string;
  disabilityInfo?: string;

  // Saved Jobs & System
  savedJobIds?: string[];
  profileCompletionPercentage?: number;
  isProfilePublic?: boolean;
  accountStatus?: string;
  lastUpdated: string | Date;

  // Subscription & Trial
  isPremium?: boolean;
  subscriptionExpiryDate?: string | Date | null;
  subscriptionStatus?: 'none' | 'trial' | 'active' | 'expired';
  hasUsedTrial?: boolean;
  trialStartDate?: string | Date | null;
  trialExpiryDate?: string | Date | null;
  appleSubscriptionId?: string;
}
