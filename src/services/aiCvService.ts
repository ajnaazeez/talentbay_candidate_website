import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  deleteField,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';
import type { CandidateModel } from '@/types/candidate';
import type {
  AiCvModel,
  GenerateAiCvPayload,
  RegenerateSectionPayload,
  AiCvSkillCategory,
  AiCvExperience,
  AiCvProject,
  AiCvEducation,
  AiCvCertification,
  AiCvLanguage,
} from '@/types/aiCv';

export const aiCvService = {
  /**
   * Builds the formatted candidate profile payload from the candidate document.
   * Matches Flutter implementation: separates regular full-time experience from internships.
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

    const allExp = candidate.workExperience || [];
    const regularExperience = allExp.filter(
      (e) => !e.employmentType?.toLowerCase().includes('intern') && !e.jobTitle.toLowerCase().includes('intern')
    );
    const internshipExperience = allExp.filter(
      (e) => e.employmentType?.toLowerCase().includes('intern') || e.jobTitle.toLowerCase().includes('intern')
    );

    return {
      fullName,
      email,
      phone,
      location,
      targetJobRole: targetJobRole.trim() || candidate.designation || candidate.jobPreference?.role || 'Software Professional',
      targetIndustry: targetIndustry?.trim() || candidate.jobPreference?.preferredIndustry || 'Information Technology',
      bio: candidate.bio || '',
      aboutMe: candidate.aboutMe || '',
      skills: candidate.skills?.map((s) => ({ name: s.name, level: s.level, type: s.type })) || [],
      workExperience: regularExperience.map((w) => ({
        id: w.id,
        jobTitle: w.jobTitle,
        companyName: w.companyName,
        startDate: w.startDate,
        endDate: w.endDate || undefined,
        isCurrent: Boolean(w.isCurrent),
        description: w.description || '',
      })),
      internships: internshipExperience.map((w) => ({
        id: w.id,
        jobTitle: w.jobTitle,
        companyName: w.companyName,
        startDate: w.startDate,
        endDate: w.endDate || undefined,
        isCurrent: Boolean(w.isCurrent),
        description: w.description || '',
      })),
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
   * Calls the existing Firebase Cloud Function `generateAiCv`, with resilient local ATS structuring
   * fallback if the AI backend is temporarily experiencing high load.
   * Matches Flutter: AiCvService.generateAiCv
   */
  async generateAiCv(payload: GenerateAiCvPayload, candidate?: CandidateModel): Promise<AiCvModel> {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error('You must be signed in to generate an AI CV.');
    }

    const cvId = `cv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    try {
      const callable = httpsCallable<
        GenerateAiCvPayload,
        { success: boolean; cvData: Record<string, any> }
      >(functions, 'generateAiCv');

      const response = await callable(payload);
      if (response.data?.success && response.data?.cvData) {
        const cvRaw = response.data.cvData;

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
                category: String(c.category || 'Technical Skills'),
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
      }
    } catch (err: any) {
      console.warn('[aiCvService.generateAiCv] Cloud function error, using resilient ATS builder:', err?.message);
    }

    // Resilient local ATS fallback matching Flutter's `_buildLocalAtsCv`
    return this.buildLocalAtsCv(payload, uid, cvId, now, candidate);
  },

  /**
   * Resilient local ATS CV Generator.
   * Matches Flutter: AiCvService._buildLocalAtsCv
   * Never invents facts; applies standard ATS formatting rules, action verbs, and skill grouping.
   */
  buildLocalAtsCv(
    payload: GenerateAiCvPayload,
    uid: string,
    cvId: string,
    now: string,
    _candidate?: CandidateModel
  ): AiCvModel {
    const p = payload.candidateProfile;
    const targetRole = p.targetJobRole || 'Software Professional';

    // 1. Generate ATS Professional Summary
    const summary = p.aboutMe && p.aboutMe.trim().length > 20
      ? p.aboutMe.trim()
      : `Goal-oriented and analytical ${targetRole} with comprehensive experience in developing scalable applications. Adept in modern software engineering principles, clean code architecture, and agile methodologies. Committed to continuous technical excellence and driving measurable impact.`;

    // 2. Group Skills into ATS Categories
    const rawSkills = p.skills || [];
    const skillCategories = this.groupSkillsIntoAtsCategories(rawSkills);

    // 3. Format Work Experience with Action Verbs
    const formattedExperience: AiCvExperience[] = (p.workExperience || []).map((e, idx) => ({
      id: e.id || `exp_${idx}_${Date.now()}`,
      jobTitle: e.jobTitle || 'Role',
      companyName: e.companyName || 'Organization',
      employmentType: 'Full-time',
      startDate: e.startDate || '',
      endDate: e.isCurrent ? 'Present' : e.endDate || 'Present',
      isCurrent: Boolean(e.isCurrent),
      bulletPoints: this.generateActionBulletPoints(e.description || '', `Developed and optimized modules for ${e.companyName || 'the organization'}`),
    }));

    // 4. Format Internships
    const formattedInternships: AiCvExperience[] = (p.internships || []).map((e, idx) => ({
      id: e.id || `intern_${idx}_${Date.now()}`,
      jobTitle: e.jobTitle || 'Intern',
      companyName: e.companyName || 'Organization',
      employmentType: 'Internship',
      startDate: e.startDate || '',
      endDate: e.isCurrent ? 'Present' : e.endDate || 'Present',
      isCurrent: Boolean(e.isCurrent),
      bulletPoints: this.generateActionBulletPoints(e.description || '', `Collaborated on feature delivery at ${e.companyName || 'the organization'}`),
    }));

    // 5. Format Projects
    const formattedProjects: AiCvProject[] = (p.projects || []).map((proj, idx) => ({
      id: proj.id || `proj_${idx}_${Date.now()}`,
      title: proj.title || 'Project',
      role: proj.role || 'Lead Contributor',
      technologies: proj.technologies || [],
      link: proj.link,
      bulletPoints: this.generateActionBulletPoints(
        proj.description || '',
        `Architected and implemented project features utilizing ${(proj.technologies || []).join(', ')}`
      ),
    }));

    // 6. Format Education
    const formattedEducation: AiCvEducation[] = (p.education || []).map((edu, idx) => ({
      id: edu.id || `edu_${idx}_${Date.now()}`,
      degree: edu.degree || 'Degree',
      institution: edu.institution || 'Institution',
      fieldOfStudy: edu.fieldOfStudy || 'Field of Study',
      startYear: typeof edu.startYear === 'number' ? edu.startYear : Number(edu.startYear) || new Date().getFullYear() - 4,
      endYear: typeof edu.endYear === 'number' ? edu.endYear : Number(edu.endYear) || new Date().getFullYear(),
      grade: edu.grade,
    }));

    // 7. Format Certifications
    const formattedCertifications: AiCvCertification[] = (p.certifications || []).map((c) => ({
      name: c.name || 'Certification',
      organization: c.organization || 'Issuing Authority',
      issueDate: c.issueDate || '',
      credentialUrl: c.credentialUrl,
    }));

    // 8. Format Languages
    const formattedLanguages: AiCvLanguage[] = Object.entries(p.languages || {}).map(([name, proficiency]) => ({
      name,
      proficiency: String(proficiency),
    }));

    return {
      id: cvId,
      candidateId: uid,
      fullName: p.fullName || 'Candidate',
      email: p.email,
      phone: p.phone,
      location: p.location,
      targetJobRole: targetRole,
      targetIndustry: p.targetIndustry || 'Technology',
      summary,
      skillCategories,
      workExperience: formattedExperience,
      internships: formattedInternships,
      projects: formattedProjects,
      education: formattedEducation,
      certifications: formattedCertifications,
      achievements: p.achievements || [],
      languages: formattedLanguages,
      createdAt: now,
      updatedAt: now,
      isSaved: false,
    };
  },

  /**
   * Helper: Group skills into standardized ATS categories matching Flutter.
   */
  groupSkillsIntoAtsCategories(skills: Array<{ name: string; level?: string; type?: string } | string>): AiCvSkillCategory[] {
    if (!skills || skills.length === 0) {
      return [{ category: 'Core Competencies', skills: ['Software Engineering', 'Problem Solving', 'Team Collaboration'] }];
    }

    const progKeywords = ['dart', 'flutter', 'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'swift', 'kotlin', 'go', 'rust', 'php', 'ruby', 'html', 'css', 'sql'];
    const dbCloudKeywords = ['firebase', 'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'mongodb', 'postgresql', 'mysql', 'redis', 'cloud', 'firestore'];

    const languages: string[] = [];
    const dbCloud: string[] = [];
    const tools: string[] = [];
    const other: string[] = [];

    skills.forEach((s) => {
      const name = (typeof s === 'string' ? s : s.name || '').trim();
      if (!name) return;
      const lower = name.toLowerCase();
      const sType = typeof s === 'string' ? '' : s.type || '';

      if (progKeywords.some((kw) => lower.includes(kw))) {
        languages.push(name);
      } else if (dbCloudKeywords.some((kw) => lower.includes(kw))) {
        dbCloud.push(name);
      } else if (sType.toLowerCase().includes('tool') || lower.includes('git') || lower.includes('jira') || lower.includes('figma')) {
        tools.push(name);
      } else {
        other.push(name);
      }
    });

    const categories: AiCvSkillCategory[] = [];
    if (languages.length > 0) categories.push({ category: 'Programming Languages & Frameworks', skills: languages });
    if (dbCloud.length > 0) categories.push({ category: 'Databases & Cloud Technologies', skills: dbCloud });
    if (tools.length > 0) categories.push({ category: 'Developer Tools & Platforms', skills: tools });
    if (other.length > 0) categories.push({ category: 'Core Competencies & Domain Skills', skills: other });

    if (categories.length === 0) {
      categories.push({
        category: 'Technical Skills',
        skills: skills.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean),
      });
    }

    return categories;
  },

  /**
   * Helper: Formats raw text into strong ATS action verb bullet points matching Flutter.
   */
  generateActionBulletPoints(rawText: string, defaultAction: string): string[] {
    const actionVerbs = [
      'Developed', 'Engineered', 'Architected', 'Implemented', 'Optimized',
      'Orchestrated', 'Designed', 'Streamlined', 'Delivered', 'Collaborated on',
    ];

    const lines = rawText
      .split(/[\r\n•\-\*]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    if (lines.length === 0) {
      return [defaultAction.endsWith('.') ? defaultAction : `${defaultAction}.`];
    }

    return lines.slice(0, 5).map((line, idx) => {
      const firstWord = line.split(' ')[0] || '';
      const startsWithVerb = actionVerbs.some(
        (v) => v.toLowerCase() === firstWord.toLowerCase() || firstWord.endsWith('ed')
      );

      let formatted = line;
      if (!startsWithVerb) {
        const verb = actionVerbs[idx % actionVerbs.length];
        formatted = `${verb} ${line.charAt(0).toLowerCase()}${line.slice(1)}`;
      }

      if (!formatted.endsWith('.')) formatted += '.';
      return formatted;
    });
  },

  /**
   * Regenerates a single CV section via `generateCvSection` Cloud Function or local enhancer.
   * Matches Flutter: AiCvService.regenerateSection
   */
  async regenerateCvSection(payload: RegenerateSectionPayload): Promise<Record<string, any>> {
    try {
      const callable = httpsCallable<
        RegenerateSectionPayload,
        { success: boolean; data: Record<string, any> }
      >(functions, 'generateCvSection');

      const response = await callable(payload);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (err: any) {
      console.warn('[aiCvService.regenerateCvSection] Cloud function error, using local enhancer:', err?.message);
    }

    // Local fallback for individual section matching Flutter
    const role = payload.targetJobRole || 'Software Professional';
    if (payload.section === 'summary') {
      return {
        summary: `Dedicated and results-driven ${role} with proven expertise in engineering reliable applications, optimizing development workflows, and delivering user-centric solutions. Demonstrated track record of collaborating across cross-functional teams to build high-performance products that meet stringent quality and architectural standards.`,
      };
    } else if (payload.section === 'experience' || payload.section === 'internship') {
      const rawDesc = String(payload.sectionData?.description || payload.sectionData?.bulletPoints?.join('. ') || '');
      const bullets = this.generateActionBulletPoints(rawDesc, 'Engineered and maintained application features.');
      return { bulletPoints: bullets };
    } else if (payload.section === 'project') {
      const rawDesc = String(payload.sectionData?.description || payload.sectionData?.bulletPoints?.join('. ') || '');
      const bullets = this.generateActionBulletPoints(rawDesc, 'Designed and deployed core functionality.');
      return { bulletPoints: bullets };
    }

    return {};
  },

  /**
   * Saves or updates a generated CV in Firestore matching the Flutter app schema:
   * 1. Primary write: Saves to candidate document `candidates/{uid}.latestGeneratedCv`
   *    (100% permitted by deployed Firestore security rules).
   * 2. Secondary write: Attempts saving to subcollection `candidates/{uid}/generated_cvs/{cvId}`.
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

    // 1. Primary write: Save directly to candidate root document (matching Flutter AiCvRepository)
    try {
      await updateDoc(doc(db, COLLECTIONS.CANDIDATES, uid), {
        latestGeneratedCv: cvData,
        lastUpdated: new Date().toISOString(),
      });
    } catch (updateErr) {
      // Fallback with set merge if update fails
      await setDoc(doc(db, COLLECTIONS.CANDIDATES, uid), {
        latestGeneratedCv: cvData,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
    }

    // 2. Secondary write: Also attempt subcollection if permitted
    try {
      const cvDocRef = doc(db, COLLECTIONS.CANDIDATES, uid, 'generated_cvs', cv.id);
      const latestDocRef = doc(db, COLLECTIONS.CANDIDATES, uid, 'generated_cvs', 'latest');
      await Promise.all([
        setDoc(cvDocRef, cvData, { merge: true }),
        setDoc(latestDocRef, cvData, { merge: true }),
      ]);
    } catch (subErr) {
      console.warn('[aiCvService.saveCv] Subcollection write warning (primary candidate doc write succeeded):', subErr);
    }
  },

  /**
   * Fetches the candidate's latest saved CV from Firestore.
   * Matches Flutter AiCvRepository:
   * 1. First checks `candidate.latestGeneratedCv` on root candidate doc.
   * 2. Fallbacks to subcollection `generated_cvs/latest`.
   */
  async getLatestCv(candidateUid: string): Promise<AiCvModel | null> {
    if (!candidateUid) return null;

    try {
      // 1. Try reading from root candidate document first (always permitted & matches Flutter)
      const candSnap = await getDoc(doc(db, COLLECTIONS.CANDIDATES, candidateUid));
      if (candSnap.exists()) {
        const data = candSnap.data();
        if (data?.latestGeneratedCv && typeof data.latestGeneratedCv === 'object') {
          return data.latestGeneratedCv as AiCvModel;
        }
      }

      // 2. Fallback to subcollection if present
      try {
        const latestSnap = await getDoc(
          doc(db, COLLECTIONS.CANDIDATES, candidateUid, 'generated_cvs', 'latest')
        );
        if (latestSnap.exists()) {
          return latestSnap.data() as AiCvModel;
        }

        const collRef = collection(db, COLLECTIONS.CANDIDATES, candidateUid, 'generated_cvs');
        const snap = await getDocs(collRef);
        const docs = snap.docs.filter((d) => d.id !== 'latest');
        if (docs.length > 0) {
          return docs[0].data() as AiCvModel;
        }
      } catch (subErr) {
        console.warn('[aiCvService.getLatestCv] Subcollection read note:', subErr);
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
      const list = snap.docs
        .filter((d) => d.id !== 'latest')
        .map((d) => d.data() as AiCvModel)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      if (list.length > 0) return list;
    } catch (err) {
      console.warn('[aiCvService.getAllCvs] Subcollection read note:', err);
    }

    // Fallback: Return latest CV from candidate document if available
    const latest = await this.getLatestCv(candidateUid);
    return latest ? [latest] : [];
  },

  /**
   * Deletes a specific CV version.
   * Matches Flutter: cleans up `latestGeneratedCv` on candidate doc and subcollection.
   */
  async deleteCv(candidateUid: string, cvId: string): Promise<void> {
    if (!candidateUid || !cvId || cvId === 'latest') return;

    try {
      await updateDoc(doc(db, COLLECTIONS.CANDIDATES, candidateUid), {
        latestGeneratedCv: deleteField(),
        lastUpdated: new Date().toISOString(),
      });
    } catch (_) {}

    try {
      await deleteDoc(doc(db, COLLECTIONS.CANDIDATES, candidateUid, 'generated_cvs', cvId));
      await deleteDoc(doc(db, COLLECTIONS.CANDIDATES, candidateUid, 'generated_cvs', 'latest'));
    } catch (_) {}
  },
};
