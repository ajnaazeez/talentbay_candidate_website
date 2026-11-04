export type JobStatus = 'active' | 'closed' | 'draft';
export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite' | string;
export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship' | string;

export interface JobLocation {
  city: string;
  state: string;
  country: string;
}

export interface JobExperienceRequired {
  minYears: number;
  maxYears: number;
}

export interface JobSalary {
  min: number;
  max: number;
  currency: string;
  type: string; // 'CTC', 'Monthly', 'Hourly'
}

export interface Job {
  id: string; // Document ID (jobId)
  jobId: string;
  companyId: string;
  recruiterId: string;
  roleId?: string;
  roleName: string;
  designationId?: string;
  designationName?: string;
  experienceLevel?: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  jobLocation: JobLocation;
  locations?: string[];
  jobLocations?: JobLocation[];
  vacancies: number;
  officeCount?: number;
  experienceRequired: JobExperienceRequired;
  salary: JobSalary;
  skillsRequired: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  jobDescription: string;
  responsibilities: string[];
  requirements: string[];
  interviewProcess: string[];
  extraQuestions?: string[];
  status: JobStatus;
  visibility: 'public' | 'private' | string;
  postedAt: string | Date | any;
  expiresAt: string | Date | any;

  // Enriched company fields
  companyName?: string;
  companyLogoUrl?: string;
  isVerifiedCompany?: boolean;

  // Compatibility aliases
  title?: string;
  department?: string;
  location?: string | JobLocation;
}

export interface JobFilterOptions {
  searchQuery?: string;
  location?: string;
  workMode?: string;
  employmentType?: string;
  minSalary?: number;
  maxSalary?: number;
  minExperience?: number;
  skills?: string[];
  sortBy?: 'newest' | 'highest_salary' | 'match_score';
}

export interface SkillMatchResult {
  matchPercentage: number;
  matchingSkills: string[];
  missingSkills: string[];
  totalRequired: number;
  hasMatch: boolean;
}
