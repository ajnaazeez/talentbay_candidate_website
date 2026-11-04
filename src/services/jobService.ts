import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';
import type { Job, JobFilterOptions, JobApplication } from '@/types';

// In-memory cache for company enrichment to avoid redundant roundtrips
const companyCache = new Map<string, { companyName: string; logoUrl?: string; isVerified?: boolean }>();

async function getCompanyEnrichment(companyId: string) {
  if (!companyId) return null;
  if (companyCache.has(companyId)) {
    return companyCache.get(companyId)!;
  }

  try {
    const snap = await getDoc(doc(db, COLLECTIONS.COMPANIES, companyId));
    if (snap.exists()) {
      const data = snap.data();
      const profile = data.profile || {};
      const verification = data.verification || {};
      const enrichment = {
        companyName: profile.companyName || data.companyName || 'TalentBay Partner',
        logoUrl: profile.logoUrl || data.logoUrl || data.companyLogoUrl,
        isVerified: Boolean(verification.isVerified || data.isVerified),
      };
      companyCache.set(companyId, enrichment);
      return enrichment;
    }
  } catch (err) {
    console.warn(`[jobService] Could not fetch company ${companyId}`, err);
  }
  return null;
}

export const jobService = {
  /**
   * Fetches active, public jobs and enriches them with company profile data.
   */
  async getJobs(filterOptions?: JobFilterOptions): Promise<Job[]> {
    try {
      // Query active and public jobs
      const jobsRef = collection(db, COLLECTIONS.JOBS);
      const q = query(
        jobsRef,
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      const jobs: Job[] = [];

      for (const d of snapshot.docs) {
        const data = d.data();
        const jobId = data.jobId || d.id;

        // Skip private or non-public jobs if visibility is set
        if (data.visibility && data.visibility !== 'public') continue;

        // Company enrichment
        let companyName = data.companyName;
        let companyLogoUrl = data.companyLogoUrl;
        let isVerifiedCompany = false;

        if (data.companyId) {
          const comp = await getCompanyEnrichment(data.companyId);
          if (comp) {
            companyName = comp.companyName || companyName;
            companyLogoUrl = comp.logoUrl || companyLogoUrl;
            isVerifiedCompany = Boolean(comp.isVerified);
          }
        }

        const job: Job = {
          id: d.id,
          jobId,
          companyId: data.companyId || '',
          recruiterId: data.recruiterId || '',
          roleId: data.roleId || '',
          roleName: data.roleName || data.title || 'Untitled Role',
          title: data.title || data.roleName || 'Untitled Role',
          designationId: data.designationId || '',
          designationName: data.designationName || '',
          experienceLevel: data.experienceLevel || '',
          employmentType: data.employmentType || 'Full-Time',
          workMode: data.workMode || 'Remote',
          jobLocation: data.jobLocation || {
            city: data.city || '',
            state: data.state || '',
            country: data.country || '',
          },
          locations: Array.isArray(data.locations) && data.locations.length > 0
            ? data.locations.filter((l: any) => typeof l === 'string' && l.trim())
            : (data.jobLocation?.city ? [data.jobLocation.city] : (data.city ? [data.city] : [])),
          jobLocations: Array.isArray(data.jobLocations)
            ? data.jobLocations
            : (data.jobLocation ? [data.jobLocation] : []),
          vacancies: Number(data.vacancies) || 1,
          officeCount: Number(data.officeCount) || 0,
          experienceRequired: data.experienceRequired || {
            minYears: Number(data.minExperienceYears) || 0,
            maxYears: Number(data.maxExperienceYears) || 0,
          },
          salary: data.salary || {
            min: Number(data.minSalary) || Number(data.salaryRange?.min) || 0,
            max: Number(data.maxSalary) || Number(data.salaryRange?.max) || 0,
            currency: data.salaryCurrency || data.salaryRange?.currency || 'INR',
            type: data.salaryPeriod || 'CTC',
          },
          skillsRequired: Array.isArray(data.skillsRequired)
            ? data.skillsRequired
            : Array.isArray(data.skills)
            ? data.skills
            : [],
          mustHaveSkills: Array.isArray(data.mustHaveSkills) ? data.mustHaveSkills : [],
          niceToHaveSkills: Array.isArray(data.niceToHaveSkills) ? data.niceToHaveSkills : [],
          jobDescription: data.jobDescription || data.description || '',
          responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
          requirements: Array.isArray(data.requirements) ? data.requirements : [],
          interviewProcess: Array.isArray(data.interviewProcess) ? data.interviewProcess : [],
          extraQuestions: Array.isArray(data.extraQuestions) ? data.extraQuestions : [],
          status: data.status || 'active',
          visibility: data.visibility || 'public',
          postedAt: data.postedAt?.toDate ? data.postedAt.toDate().toISOString() : data.postedAt || new Date().toISOString(),
          expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate().toISOString() : data.expiresAt,
          companyName: companyName || 'Confidential Company',
          companyLogoUrl,
          isVerifiedCompany,
        };

        jobs.push(job);
      }

      // In-Memory Filtering for maximum search versatility
      let filtered = jobs;

      if (filterOptions) {
        const {
          searchQuery,
          location,
          workMode,
          employmentType,
          minSalary,
          minExperience,
          skills,
        } = filterOptions;

        if (searchQuery && searchQuery.trim()) {
          const qLower = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(
            (j) =>
              j.roleName.toLowerCase().includes(qLower) ||
              j.companyName?.toLowerCase().includes(qLower) ||
              j.skillsRequired.some((s) => s.toLowerCase().includes(qLower)) ||
              j.jobDescription.toLowerCase().includes(qLower) ||
              (j.locations && j.locations.some((l: string) => l.toLowerCase().includes(qLower))) ||
              (j.jobLocation?.city && j.jobLocation.city.toLowerCase().includes(qLower))
          );
        }

        if (location && location.trim() && location !== 'all') {
          const locLower = location.toLowerCase().trim();
          filtered = filtered.filter((j) => {
            if (j.locations && j.locations.some((l: string) => l.toLowerCase().includes(locLower))) {
              return true;
            }
            if (j.jobLocations && j.jobLocations.some((jl: any) =>
              jl.city?.toLowerCase().includes(locLower) ||
              jl.state?.toLowerCase().includes(locLower) ||
              jl.country?.toLowerCase().includes(locLower)
            )) {
              return true;
            }
            const city = j.jobLocation.city?.toLowerCase() || '';
            const state = j.jobLocation.state?.toLowerCase() || '';
            const country = j.jobLocation.country?.toLowerCase() || '';
            return city.includes(locLower) || state.includes(locLower) || country.includes(locLower);
          });
        }

        if (workMode && workMode !== 'all') {
          filtered = filtered.filter(
            (j) => j.workMode.toLowerCase() === workMode.toLowerCase()
          );
        }

        if (employmentType && employmentType !== 'all') {
          filtered = filtered.filter(
            (j) => j.employmentType.toLowerCase() === employmentType.toLowerCase()
          );
        }

        if (minSalary && minSalary > 0) {
          filtered = filtered.filter((j) => (j.salary.max || j.salary.min) >= minSalary);
        }

        if (minExperience !== undefined && minExperience >= 0) {
          filtered = filtered.filter((j) => j.experienceRequired.minYears <= minExperience);
        }

        if (skills && skills.length > 0) {
          filtered = filtered.filter((j) =>
            skills.some((sk) =>
              j.skillsRequired.some((jsk) => jsk.toLowerCase() === sk.toLowerCase())
            )
          );
        }

        // Sorting
        if (filterOptions.sortBy === 'highest_salary') {
          filtered.sort((a, b) => (b.salary.max || 0) - (a.salary.max || 0));
        } else {
          // Default: newest postedAt
          filtered.sort(
            (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          );
        }
      } else {
        filtered.sort(
          (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        );
      }

      return filtered;
    } catch (err) {
      console.error('[jobService] Error fetching jobs:', err);
      throw err;
    }
  },

  /**
   * Fetches a single job by its ID.
   */
  async getJobById(jobId: string): Promise<Job | null> {
    if (!jobId) return null;
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.JOBS, jobId));
      if (!snap.exists()) return null;

      const data = snap.data();
      let companyName = data.companyName;
      let companyLogoUrl = data.companyLogoUrl;
      let isVerifiedCompany = false;

      if (data.companyId) {
        const comp = await getCompanyEnrichment(data.companyId);
        if (comp) {
          companyName = comp.companyName || companyName;
          companyLogoUrl = comp.logoUrl || companyLogoUrl;
          isVerifiedCompany = Boolean(comp.isVerified);
        }
      }

      return {
        id: snap.id,
        jobId: data.jobId || snap.id,
        companyId: data.companyId || '',
        recruiterId: data.recruiterId || '',
        roleId: data.roleId || '',
        roleName: data.roleName || data.title || 'Untitled Role',
        title: data.title || data.roleName || 'Untitled Role',
        designationId: data.designationId || '',
        designationName: data.designationName || '',
        experienceLevel: data.experienceLevel || '',
        employmentType: data.employmentType || 'Full-Time',
        workMode: data.workMode || 'Remote',
        jobLocation: data.jobLocation || {
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
        },
        locations: Array.isArray(data.locations) && data.locations.length > 0
          ? data.locations.filter((l: any) => typeof l === 'string' && l.trim())
          : (data.jobLocation?.city ? [data.jobLocation.city] : (data.city ? [data.city] : [])),
        jobLocations: Array.isArray(data.jobLocations)
          ? data.jobLocations
          : (data.jobLocation ? [data.jobLocation] : []),
        vacancies: Number(data.vacancies) || 1,
        officeCount: Number(data.officeCount) || 0,
        experienceRequired: data.experienceRequired || {
          minYears: Number(data.minExperienceYears) || 0,
          maxYears: Number(data.maxExperienceYears) || 0,
        },
        salary: data.salary || {
          min: Number(data.minSalary) || Number(data.salaryRange?.min) || 0,
          max: Number(data.maxSalary) || Number(data.salaryRange?.max) || 0,
          currency: data.salaryCurrency || data.salaryRange?.currency || 'INR',
          type: data.salaryPeriod || 'CTC',
        },
        skillsRequired: Array.isArray(data.skillsRequired)
          ? data.skillsRequired
          : Array.isArray(data.skills)
          ? data.skills
          : [],
        mustHaveSkills: Array.isArray(data.mustHaveSkills) ? data.mustHaveSkills : [],
        niceToHaveSkills: Array.isArray(data.niceToHaveSkills) ? data.niceToHaveSkills : [],
        jobDescription: data.jobDescription || data.description || '',
        responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
        requirements: Array.isArray(data.requirements) ? data.requirements : [],
        interviewProcess: Array.isArray(data.interviewProcess) ? data.interviewProcess : [],
        extraQuestions: Array.isArray(data.extraQuestions) ? data.extraQuestions : [],
        status: data.status || 'active',
        visibility: data.visibility || 'public',
        postedAt: data.postedAt?.toDate ? data.postedAt.toDate().toISOString() : data.postedAt || new Date().toISOString(),
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate().toISOString() : data.expiresAt,
        companyName: companyName || 'Confidential Company',
        companyLogoUrl,
        isVerifiedCompany,
      };
    } catch (err) {
      console.error(`[jobService] Error fetching job ${jobId}:`, err);
      return null;
    }
  },

  /**
   * Checks whether candidate has already applied to a specific job.
   */
  async hasCandidateApplied(jobId: string, candidateId: string): Promise<boolean> {
    if (!jobId || !candidateId) return false;
    try {
      const appId = `${jobId}_${candidateId}`;
      const snap = await getDoc(doc(db, COLLECTIONS.JOB_APPLICATIONS, appId));
      return snap.exists();
    } catch {
      return false;
    }
  },

  /**
   * Submits a job application with strict duplicate prevention.
   */
  async applyToJob(params: {
    jobId: string;
    candidateId: string;
    candidateName: string;
    jobTitle: string;
    companyId?: string;
    recruiterId?: string;
    resumeUrl?: string;
    coverLetter?: string;
    candidateEmail?: string;
    candidatePhone?: string;
    candidateAvatarUrl?: string;
    matchScore?: number;
  }): Promise<JobApplication> {
    const { jobId, candidateId } = params;
    if (!jobId || !candidateId) {
      throw new Error('Missing Job ID or Candidate ID.');
    }

    const applicationId = `${jobId}_${candidateId}`;
    const appRef = doc(db, COLLECTIONS.JOB_APPLICATIONS, applicationId);

    // 1. Strict Duplicate Check
    const existing = await getDoc(appRef);
    if (existing.exists()) {
      throw new Error('You have already submitted an application for this job.');
    }

    // 2. Prepare Application Document
    const applicationData: Record<string, any> = {
      applicationId,
      jobId,
      candidateId,
      candidateName: params.candidateName || 'Candidate',
      jobTitle: params.jobTitle || 'Job Role',
      companyId: params.companyId || '',
      recruiterId: params.recruiterId || '',
      resumeUrl: params.resumeUrl || '',
      coverLetter: params.coverLetter || '',
      applicationStatus: 'applied',
      appliedAt: serverTimestamp(),
      source: 'candidate_web',
      candidateAvatarUrl: params.candidateAvatarUrl || '',
      candidateEmail: params.candidateEmail || '',
      candidatePhone: params.candidatePhone || '',
      aiMatchScore: params.matchScore || 0,
      matchScore: params.matchScore || 0,
    };

    // 3. Save Document
    await setDoc(appRef, applicationData);

    return {
      id: applicationId,
      ...applicationData,
      appliedAt: new Date().toISOString(),
    } as JobApplication;
  },

  /**
   * Retrieves all job applications submitted by candidate.
   */
  async getCandidateApplications(candidateId: string): Promise<JobApplication[]> {
    if (!candidateId) return [];
    try {
      const q = query(
        collection(db, COLLECTIONS.JOB_APPLICATIONS),
        where('candidateId', '==', candidateId)
      );
      const snap = await getDocs(q);
      const apps: JobApplication[] = [];

      for (const d of snap.docs) {
        const data = d.data();
        apps.push({
          id: d.id,
          applicationId: data.applicationId || d.id,
          jobId: data.jobId,
          candidateId: data.candidateId,
          candidateName: data.candidateName,
          jobTitle: data.jobTitle,
          companyId: data.companyId,
          recruiterId: data.recruiterId,
          resumeUrl: data.resumeUrl,
          coverLetter: data.coverLetter,
          applicationStatus: data.applicationStatus || 'applied',
          appliedAt: data.appliedAt?.toDate ? data.appliedAt.toDate().toISOString() : data.appliedAt,
          source: data.source || 'portal',
          matchScore: data.matchScore || data.aiMatchScore || 0,
        });
      }

      apps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      return apps;
    } catch (err) {
      console.error('[jobService] Error fetching applications:', err);
      return [];
    }
  },

  /**
   * Realtime stream of candidate applications.
   * Matches Flutter getCandidateApplications stream.
   */
  subscribeToCandidateApplications(
    candidateId: string,
    callback: (applications: JobApplication[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!candidateId) {
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, COLLECTIONS.JOB_APPLICATIONS),
      where('candidateId', '==', candidateId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const apps: JobApplication[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            applicationId: data.applicationId || d.id,
            jobId: data.jobId,
            candidateId: data.candidateId,
            candidateName: data.candidateName || '',
            jobTitle: data.jobTitle || '',
            companyId: data.companyId,
            recruiterId: data.recruiterId,
            resumeUrl: data.resumeUrl,
            coverLetter: data.coverLetter,
            applicationStatus: data.applicationStatus || 'applied',
            appliedAt: data.appliedAt?.toDate ? data.appliedAt.toDate().toISOString() : data.appliedAt || new Date().toISOString(),
            source: data.source || 'portal',
            matchScore: data.matchScore || data.aiMatchScore || 0,
          };
        });

        apps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
        callback(apps);
      },
      (err) => {
        console.error('[jobService.subscribeToCandidateApplications] Error:', err);
        onError?.(err);
      }
    );
  },

  /**
   * Fetches recruiter invitations for the candidate.
   * Queries job_applications where status == 'invited'.
   */
  async getInvites(candidateId: string): Promise<JobApplication[]> {
    if (!candidateId) return [];
    try {
      const q = query(
        collection(db, COLLECTIONS.JOB_APPLICATIONS),
        where('candidateId', '==', candidateId),
        where('applicationStatus', '==', 'invited')
      );
      const snap = await getDocs(q);
      const invites: JobApplication[] = [];

      for (const d of snap.docs) {
        const data = d.data();
        invites.push({
          id: d.id,
          applicationId: data.applicationId || d.id,
          jobId: data.jobId,
          candidateId: data.candidateId,
          candidateName: data.candidateName || '',
          jobTitle: data.jobTitle || '',
          companyId: data.companyId,
          recruiterId: data.recruiterId,
          resumeUrl: data.resumeUrl,
          coverLetter: data.coverLetter,
          applicationStatus: 'invited',
          appliedAt: data.appliedAt?.toDate ? data.appliedAt.toDate().toISOString() : data.appliedAt || new Date().toISOString(),
          source: data.source || 'recruiter_invite',
          matchScore: data.matchScore || data.aiMatchScore || 0,
        });
      }

      invites.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      return invites;
    } catch (err) {
      console.error('[jobService.getInvites] Error:', err);
      return [];
    }
  },

  /**
   * Realtime stream of candidate invitations.
   * Matches Flutter JobRepository.getInvites(candidateId).
   */
  subscribeToInvites(
    candidateId: string,
    callback: (invites: JobApplication[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!candidateId) {
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, COLLECTIONS.JOB_APPLICATIONS),
      where('candidateId', '==', candidateId),
      where('applicationStatus', '==', 'invited')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const invites: JobApplication[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            applicationId: data.applicationId || d.id,
            jobId: data.jobId,
            candidateId: data.candidateId,
            candidateName: data.candidateName || '',
            jobTitle: data.jobTitle || '',
            companyId: data.companyId,
            recruiterId: data.recruiterId,
            resumeUrl: data.resumeUrl,
            coverLetter: data.coverLetter,
            applicationStatus: 'invited',
            appliedAt: data.appliedAt?.toDate ? data.appliedAt.toDate().toISOString() : data.appliedAt || new Date().toISOString(),
            source: data.source || 'recruiter_invite',
            matchScore: data.matchScore || data.aiMatchScore || 0,
          };
        });

        invites.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
        callback(invites);
      },
      (err) => {
        console.error('[jobService.subscribeToInvites] Error:', err);
        onError?.(err);
      }
    );
  },

  /**
   * Accepts an invitation: updates status to 'applied' and sets appliedAt to serverTimestamp().
   * Matches Flutter acceptInvitation(applicationId).
   */
  async acceptInvitation(applicationId: string): Promise<void> {
    if (!applicationId) throw new Error('Missing application ID to accept.');
    const appRef = doc(db, COLLECTIONS.JOB_APPLICATIONS, applicationId);
    await updateDoc(appRef, {
      applicationStatus: 'applied',
      appliedAt: serverTimestamp(),
    });
  },

  /**
   * Declines an invitation: updates status to 'rejected'.
   * Matches Flutter declineInvitation(applicationId).
   */
  async declineInvitation(applicationId: string): Promise<void> {
    if (!applicationId) throw new Error('Missing application ID to decline.');
    const appRef = doc(db, COLLECTIONS.JOB_APPLICATIONS, applicationId);
    await updateDoc(appRef, {
      applicationStatus: 'rejected',
    });
  },

  /**
   * Saves a job to candidate's wishlist.
   */
  async saveJob(candidateId: string, jobId: string): Promise<void> {
    if (!candidateId || !jobId) return;
    const candRef = doc(db, COLLECTIONS.CANDIDATES, candidateId);
    await updateDoc(candRef, {
      savedJobIds: arrayUnion(jobId),
      lastUpdated: new Date().toISOString(),
    });
  },

  /**
   * Removes a job from candidate's wishlist.
   */
  async unsaveJob(candidateId: string, jobId: string): Promise<void> {
    if (!candidateId || !jobId) return;
    const candRef = doc(db, COLLECTIONS.CANDIDATES, candidateId);
    await updateDoc(candRef, {
      savedJobIds: arrayRemove(jobId),
      lastUpdated: new Date().toISOString(),
    });
  },

  /**
   * Fetches multiple jobs by an array of job IDs.
   */
  async getJobsByIds(jobIds: string[]): Promise<Job[]> {
    if (!jobIds || jobIds.length === 0) return [];
    const jobs: Job[] = [];

    await Promise.all(
      jobIds.map(async (id) => {
        const job = await jobService.getJobById(id);
        if (job) jobs.push(job);
      })
    );

    return jobs;
  },
};
