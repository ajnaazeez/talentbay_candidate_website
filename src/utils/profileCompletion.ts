import type { CandidateModel } from '@/types';

export interface ProfileFactor {
  key:
    | 'firstName'
    | 'lastName'
    | 'phoneNumber'
    | 'photoUrl'
    | 'dob'
    | 'gender'
    | 'currentLocation'
    | 'nationality'
    | 'headline'
    | 'aboutMe'
    | 'skills'
    | 'workExperience'
    | 'education'
    | 'jobPreference'
    | 'resume'
    | 'projects'
    | 'certifications'
    | 'languages'
    | 'socialLinks';
  label: string;
  completed: boolean;
  weight: number;
}

export interface ProfileCompletionResult {
  percentage: number; // 0 to 100
  ratio: number; // 0.0 to 1.0
  filledCount: number;
  totalCount: number;
  missingFields: string[];
  factors: ProfileFactor[];
}

/**
 * Calculates candidate profile completion matching TalentBay Mobile App's
 * ProfileCompletionCalculator.dart (15 factors).
 */
export function calculateProfileCompletion(candidate: CandidateModel | null): ProfileCompletionResult {
  const isFilled = (val: any) => val !== undefined && val !== null && String(val).trim().length > 0;

  const factors: ProfileFactor[] = [
    {
      key: 'firstName',
      label: 'First Name',
      completed: Boolean(candidate && isFilled(candidate.firstName)),
      weight: 7,
    },
    {
      key: 'lastName',
      label: 'Last Name',
      completed: Boolean(candidate && isFilled(candidate.lastName)),
      weight: 7,
    },
    {
      key: 'phoneNumber',
      label: 'Phone Number',
      completed: Boolean(candidate && isFilled(candidate.phoneNumber)),
      weight: 7,
    },
    {
      key: 'photoUrl',
      label: 'Profile Photo',
      completed: Boolean(candidate && isFilled(candidate.photoUrl)),
      weight: 7,
    },
    {
      key: 'dob',
      label: 'Date of Birth',
      completed: Boolean(candidate && candidate.dob),
      weight: 6,
    },
    {
      key: 'gender',
      label: 'Gender',
      completed: Boolean(candidate && isFilled(candidate.gender)),
      weight: 6,
    },
    {
      key: 'currentLocation',
      label: 'Current Location',
      completed: Boolean(
        candidate?.currentLocation &&
          (candidate.currentLocation.city || candidate.currentLocation.country)
      ),
      weight: 7,
    },
    {
      key: 'nationality',
      label: 'Nationality',
      completed: Boolean(candidate && isFilled(candidate.nationality)),
      weight: 6,
    },
    {
      key: 'headline',
      label: 'CV Headline',
      completed: Boolean(candidate && isFilled(candidate.bio)),
      weight: 7,
    },
    {
      key: 'aboutMe',
      label: 'About Me',
      completed: Boolean(candidate && isFilled(candidate.aboutMe)),
      weight: 7,
    },
    {
      key: 'skills',
      label: 'Skills',
      completed: Boolean(candidate?.skills && candidate.skills.length > 0),
      weight: 7,
    },
    {
      key: 'workExperience',
      label: 'Work Experience',
      completed: Boolean(candidate?.workExperience && candidate.workExperience.length > 0),
      weight: 7,
    },
    {
      key: 'education',
      label: 'Education',
      completed: Boolean(candidate?.education && candidate.education.length > 0),
      weight: 7,
    },
    {
      key: 'jobPreference',
      label: 'Job Preferences',
      completed: Boolean(candidate?.jobPreference && candidate.jobPreference.role),
      weight: 6,
    },
    {
      key: 'resume',
      label: 'Resume Document',
      completed: Boolean(candidate && isFilled(candidate.resumeUrl)),
      weight: 6,
    },
  ];

  const totalCount = factors.length;
  const filledCount = factors.filter((f) => f.completed).length;
  const missingFields = factors.filter((f) => !f.completed).map((f) => f.label);

  const ratio = filledCount / totalCount;
  const percentage = Math.round(ratio * 100);

  return {
    percentage,
    ratio,
    filledCount,
    totalCount,
    missingFields,
    factors,
  };
}
