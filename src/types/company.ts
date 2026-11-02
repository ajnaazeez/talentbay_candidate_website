export interface CompanyProfile {
  companyName: string;
  tagline?: string;
  about?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  industry?: string;
  companyType?: string;
  companySize?: string;
  website?: string;
  foundedYear?: number | string;
}

export interface CompanyContact {
  city?: string;
  state?: string;
  country?: string;
  addressLine?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface CompanyVerification {
  isVerified: boolean;
  status?: string;
}

export interface CompanyStats {
  totalJobs?: number;
  activeJobs?: number;
  totalApplicants?: number;
}

export interface Company {
  id: string; // Document ID
  profile: CompanyProfile;
  contact?: CompanyContact;
  verification?: CompanyVerification;
  stats?: CompanyStats;
  social?: Record<string, string>;

  // Fallback flat fields for backward compatibility
  companyName?: string;
  logoUrl?: string;
  about?: string;
  industry?: string;
  website?: string;
  isVerified?: boolean;
}
