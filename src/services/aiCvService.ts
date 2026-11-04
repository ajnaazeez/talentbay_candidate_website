import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';
import type { CandidateModel } from '@/types/candidate';
import type {
  AiCvModel,
  GenerateAiCvPayload,
  RegenerateSectionPayload,
} from '@/types/aiCv';

export const aiCvService = {
  /**
   * Builds the formatted candidate profile payload from the candidate document.
   */
  buildCandidateProfilePayload(
    candidate: CandidateModel,
    targetJobRole: string,
    targetIndustry?: string,
    overrides?: Partial<GenerateAiCvPayload['candidateProfile']>
  ): GenerateAiCvPayload['candidateProfile'] {
    const fullName = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ').trim() || 'Candidate';
    const email = candidate.email || auth.currentUser?.email || '';
    const phone = candidate.phoneNumber || '';
    const location = candidate.currentLocation
      ? [candidate.currentLocation.city, candidate.currentLocation.state, candidate.currentLocation.country]
          .filter(Boolean)
          .join(', ')
      : '';

    return {
      fullName,
      email,
      phone,
      location,
      targetJobRole: targetJobRole.trim() || candidate.bio || candidate.designation || 'Software Professional',
      targetIndustry: targetIndustry?.trim() || '',
      bio: candidate.bio || '',
      aboutMe: candidate.aboutMe || '',
      skills: candidate.skills?.map((s) => ({ name: s.name, level: s.level })) || [],
      workExperience: candidate.workExperience?.map((w) => ({
        id: w.id,
        jobTitle: w.jobTitle,
        companyName: w.companyName,
        startDate: w.startDate,
        endDate: w.endDate || undefined,
        isCurrent: Boolean(w.isCurrent),
        description: w.description || '',
      })) || [],
      education: candidate.education?.map((e) => ({
        id: e.id,
        degree: e.degree,
        institution: e.institution,
        fieldOfStudy: e.fieldOfStudy,
        startYear: e.startYear,
        endYear: e.endYear,
        grade: e.grade,
      })) || [],
      projects: candidate.projects?.map((p) => ({
        id: p.id,
        title: p.title,
        role: p.role,
        technologies: p.technologies || [],
        description: p.description,
        link: p.link,
      })) || [],
      certifications: candidate.certifications?.map((c) => ({
        name: c.name,
        organization: c.organization,
        issueDate: c.issueDate,
        credentialUrl: c.credentialUrl,
      })) || [],
      achievements: candidate.achievements ? [candidate.achievements] : [],
      languages: candidate.languages || {},
      ...overrides,
    };
  },

  /**
   * Calls the existing Firebase Cloud Function `generateAiCv`.
   */
  async generateAiCv(payload: GenerateAiCvPayload): Promise<AiCvModel> {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error('You must be signed in to generate an AI CV.');
    }

    try {
      const callable = httpsCallable<
        GenerateAiCvPayload,
        { success: boolean; cvData: Record<string, any> }
      >(functions, 'generateAiCv');

      const response = await callable(payload);
      if (!response.data || !response.data.success || !response.data.cvData) {
        throw new Error('AI CV service did not return valid CV data.');
      }

      const cvRaw = response.data.cvData;
      const cvId = `cv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      const aiCv: AiCvModel = {
        id: cvId,
        candidateId: uid,
        fullName: cvRaw.fullName || payload.candidateProfile.fullName,
        email: cvRaw.email || payload.candidateProfile.email,
        phone: cvRaw.phone || payload.candidateProfile.phone,
        location: cvRaw.location || payload.candidateProfile.location,
        targetJobRole: cvRaw.targetJobRole || payload.candidateProfile.targetJobRole,
        targetIndustry: cvRaw.targetIndustry || payload.candidateProfile.targetIndustry || '',
        summary: cvRaw.summary || '',
        skillCategories: Array.isArray(cvRaw.skillCategories)
          ? cvRaw.skillCategories.map((c: any) => ({
              category: String(c.category || 'Core Skills'),
              skills: Array.isArray(c.skills) ? c.skills.map((s: any) => String(s).trim()) : [],
            }))
          : [],
        workExperience: Array.isArray(cvRaw.workExperience)
          ? cvRaw.workExperience.map((exp: any, idx: number) => ({
              id: exp.id || `exp_${idx}_${Date.now()}`,
              jobTitle: exp.jobTitle || 'Role',
              companyName: exp.companyName || 'Company',
              employmentType: exp.employmentType || 'Full-time',
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              isCurrent: Boolean(exp.isCurrent),
              bulletPoints: Array.isArray(exp.bulletPoints)
                ? exp.bulletPoints.map((b: any) => String(b))
                : [],
            }))
          : [],
        internships: Array.isArray(cvRaw.internships)
          ? cvRaw.internships.map((intern: any, idx: number) => ({
              id: intern.id || `intern_${idx}_${Date.now()}`,
              jobTitle: intern.jobTitle || 'Intern',
              companyName: intern.companyName || 'Company',
              employmentType: 'Internship',
              startDate: intern.startDate || '',
              endDate: intern.endDate || '',
              isCurrent: Boolean(intern.isCurrent),
              bulletPoints: Array.isArray(intern.bulletPoints)
                ? intern.bulletPoints.map((b: any) => String(b))
                : [],
            }))
          : [],
        projects: Array.isArray(cvRaw.projects)
          ? cvRaw.projects.map((proj: any, idx: number) => ({
              id: proj.id || `proj_${idx}_${Date.now()}`,
              title: proj.title || 'Project',
              role: proj.role || 'Contributor',
              technologies: Array.isArray(proj.technologies)
                ? proj.technologies.map((t: any) => String(t))
                : [],
              link: proj.link || undefined,
              bulletPoints: Array.isArray(proj.bulletPoints)
                ? proj.bulletPoints.map((b: any) => String(b))
                : [],
            }))
          : [],
        education: Array.isArray(cvRaw.education)
          ? cvRaw.education.map((edu: any, idx: number) => ({
              id: edu.id || `edu_${idx}_${Date.now()}`,
              degree: edu.degree || 'Degree',
              institution: edu.institution || 'University',
              fieldOfStudy: edu.fieldOfStudy || 'Field',
              startYear: Number(edu.startYear) || new Date().getFullYear() - 4,
              endYear: Number(edu.endYear) || new Date().getFullYear(),
              grade: edu.grade || undefined,
            }))
          : [],
        certifications: Array.isArray(cvRaw.certifications)
          ? cvRaw.certifications.map((cert: any) => ({
              name: cert.name || 'Certification',
              organization: cert.organization || 'Issuing Organization',
              issueDate: cert.issueDate || '',
              expiryDate: cert.expiryDate || undefined,
              credentialUrl: cert.credentialUrl || undefined,
            }))
          : [],
        achievements: Array.isArray(cvRaw.achievements)
          ? cvRaw.achievements.map((a: any) => String(a))
          : [],
        languages: Array.isArray(cvRaw.languages)
          ? cvRaw.languages.map((l: any) => ({
              name: l.name || 'Language',
              proficiency: l.proficiency || 'Fluent',
            }))
          : [],
        createdAt: now,
        updatedAt: now,
        isSaved: false,
      };

      return aiCv;
    } catch (err: any) {
      console.error('[aiCvService.generateAiCv] Cloud function error:', err);
      throw new Error(err?.message || 'Failed to generate ATS CV with AI. Please try again.');
    }
  },

  /**
   * Regenerates a single CV section via `generateCvSection` Cloud Function.
   */
  async regenerateCvSection(payload: RegenerateSectionPayload): Promise<Record<string, any>> {
    try {
      const callable = httpsCallable<
        RegenerateSectionPayload,
        { success: boolean; data: Record<string, any> }
      >(functions, 'generateCvSection');

      const response = await callable(payload);
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error('Section regeneration did not return valid data.');
      }
      return response.data.data;
    } catch (err: any) {
      console.error('[aiCvService.regenerateCvSection] Cloud function error:', err);
      throw new Error(err?.message || 'Failed to regenerate CV section with AI.');
    }
  },

  /**
   * Saves or updates a generated CV in Firestore matching the Flutter app schema:
   * Batch writes to:
   *   /candidates/{uid}/generated_cvs/{cvId}
   *   /candidates/{uid}/generated_cvs/latest
   */
  async saveCv(cv: AiCvModel): Promise<void> {
    const uid = cv.candidateId || auth.currentUser?.uid;
    if (!uid || !cv.id) {
      throw new Error('Candidate UID and CV ID are required to save.');
    }

    const cvData = {
      ...cv,
      candidateId: uid,
      isSaved: true,
      updatedAt: new Date().toISOString(),
    };

    const batch = writeBatch(db);
    const cvDocRef = doc(db, COLLECTIONS.CANDIDATES, uid, 'generated_cvs', cv.id);
    const latestDocRef = doc(db, COLLECTIONS.CANDIDATES, uid, 'generated_cvs', 'latest');

    batch.set(cvDocRef, cvData, { merge: true });
    batch.set(latestDocRef, cvData, { merge: true });

    await batch.commit();
  },

  /**
   * Fetches the candidate's latest saved CV from Firestore.
   */
  async getLatestCv(candidateUid: string): Promise<AiCvModel | null> {
    if (!candidateUid) return null;

    try {
      const latestSnap = await getDoc(
        doc(db, COLLECTIONS.CANDIDATES, candidateUid, 'generated_cvs', 'latest')
      );
      if (latestSnap.exists()) {
        return latestSnap.data() as AiCvModel;
      }

      // Fallback query if 'latest' doc hasn't been set yet
      const collRef = collection(db, COLLECTIONS.CANDIDATES, candidateUid, 'generated_cvs');
      const snap = await getDocs(collRef);
      const docs = snap.docs.filter((d) => d.id !== 'latest');
      if (docs.length > 0) {
        return docs[0].data() as AiCvModel;
      }

      return null;
    } catch (err) {
      console.warn('[aiCvService.getLatestCv] Error fetching latest CV:', err);
      return null;
    }
  },

  /**
   * Retrieves all saved CVs for this candidate.
   */
  async getAllCvs(candidateUid: string): Promise<AiCvModel[]> {
    if (!candidateUid) return [];

    try {
      const collRef = collection(db, COLLECTIONS.CANDIDATES, candidateUid, 'generated_cvs');
      const snap = await getDocs(collRef);
      return snap.docs
        .filter((d) => d.id !== 'latest')
        .map((d) => d.data() as AiCvModel)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (err) {
      console.warn('[aiCvService.getAllCvs] Error fetching CV versions:', err);
      return [];
    }
  },

  /**
   * Deletes a specific CV version.
   */
  async deleteCv(candidateUid: string, cvId: string): Promise<void> {
    if (!candidateUid || !cvId || cvId === 'latest') return;

    await deleteDoc(doc(db, COLLECTIONS.CANDIDATES, candidateUid, 'generated_cvs', cvId));

    // If 'latest' points to this deleted CV, update 'latest' to the next available CV or delete 'latest'
    const latestDocRef = doc(db, COLLECTIONS.CANDIDATES, candidateUid, 'generated_cvs', 'latest');
    const latestSnap = await getDoc(latestDocRef);
    if (latestSnap.exists() && latestSnap.data()?.id === cvId) {
      const all = await this.getAllCvs(candidateUid);
      if (all.length > 0) {
        await setDoc(latestDocRef, all[0], { merge: true });
      } else {
        await deleteDoc(latestDocRef);
      }
    }
  },
};
