/**
 * AI CV Models matching TalentBay Flutter Mobile Schema
 * Firestore collections:
 *   /candidates/{uid}/generated_cvs/{cvId}
 *   /candidates/{uid}/generated_cvs/latest
 */

export interface AiCvSkillCategory {
  category: string;
  skills: string[];
}

export interface AiCvExperience {
  id: string;
  jobTitle: string;
  companyName: string;
  employmentType?: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  bulletPoints: string[];
}

export interface AiCvProject {
  id: string;
  title: string;
  role: string;
  technologies: string[];
  link?: string;
  bulletPoints: string[];
}

export interface AiCvEducation {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
  grade?: string;
}

export interface AiCvCertification {
  name: string;
  organization: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface AiCvLanguage {
  name: string;
  proficiency: string; // e.g. Native, Fluent, Intermediate
}

export interface AiCvModel {
  id: string;
  candidateId: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  targetJobRole: string;
  targetIndustry?: string;
  summary: string;
  skillCategories: AiCvSkillCategory[];
  workExperience: AiCvExperience[];
  internships: AiCvExperience[];
  projects: AiCvProject[];
  education: AiCvEducation[];
  certifications: AiCvCertification[];
  achievements: string[];
  languages: AiCvLanguage[];
  createdAt: string;
  updatedAt: string;
  isSaved?: boolean;
}

export interface GenerateAiCvPayload {
  candidateProfile: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    targetJobRole: string;
    targetIndustry?: string;
    bio?: string;
    aboutMe?: string;
    skills?: Array<{ name: string; level?: string } | string>;
    workExperience?: Array<{
      id?: string;
      jobTitle?: string;
      companyName?: string;
      startDate?: string;
      endDate?: string;
      isCurrent?: boolean;
      description?: string;
    }>;
    internships?: any[];
    education?: Array<{
      id?: string;
      degree?: string;
      institution?: string;
      fieldOfStudy?: string;
      startYear?: number | string;
      endYear?: number | string;
      grade?: string;
    }>;
    projects?: Array<{
      id?: string;
      title?: string;
      role?: string;
      technologies?: string[];
      description?: string;
      link?: string;
    }>;
    certifications?: Array<{
      name?: string;
      organization?: string;
      issueDate?: string;
      credentialUrl?: string;
    }>;
    achievements?: string[];
    languages?: Record<string, string> | Array<{ name: string; proficiency: string }>;
  };
}

export interface RegenerateSectionPayload {
  section: 'summary' | 'experience' | 'internship' | 'project' | 'skills';
  sectionData: Record<string, any>;
  targetJobRole?: string;
}

