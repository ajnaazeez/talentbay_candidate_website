export type ApplicationStatus =
  | 'applied'
  | 'invited'
  | 'screening'
  | 'interviewing'
  | 'shortlisted'
  | 'hired'
  | 'rejected'
  | 'accepted';

export interface JobApplication {
  id: string; // Document ID: `${jobId}_${candidateId}`
  applicationId: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  companyId?: string;
  recruiterId?: string;
  resumeUrl?: string;
  coverLetter?: string;
  applicationStatus: ApplicationStatus;
  appliedAt: string | Date | any;
  updatedAt?: string | Date | any;
  source: string;

  // Enriched & Candidate metadata
  candidateAvatarUrl?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  aiMatchScore?: number;
  matchScore?: number;

  // Enriched Job metadata for application listing
  companyName?: string;
  companyLogoUrl?: string;
  jobLocation?: string;
  employmentType?: string;
  workMode?: string;
  salaryText?: string;
}
