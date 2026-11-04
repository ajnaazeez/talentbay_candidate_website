import React, { useState } from 'react';
import {
  Sparkles,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Languages as LangIcon,
  Plus,
  Trash2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { CandidateModel, Skill, WorkExperience, Education, Project, Certification } from '@/types';
import type { GenerateAiCvPayload } from '@/types/aiCv';

interface AiCvInputFormProps {
  candidate: CandidateModel;
  onGenerate: (payload: GenerateAiCvPayload) => Promise<void>;
  isGenerating: boolean;
}

export const AiCvInputForm: React.FC<AiCvInputFormProps> = ({
  candidate,
  onGenerate,
  isGenerating,
}) => {
  // Target job role and industry
  const [targetRole, setTargetRole] = useState(
    candidate.designation || candidate.jobPreference?.role || candidate.bio || ''
  );
  const [targetIndustry, setTargetIndustry] = useState(
    candidate.jobPreference?.preferredIndustry || ''
  );

  // Editable customization state prefilled from candidate
  const [summary, setSummary] = useState(candidate.aboutMe || candidate.bio || '');

  // Skills
  const [skills, setSkills] = useState<Skill[]>(candidate.skills || []);
  const [newSkillName, setNewSkillName] = useState('');

  // Experience
  const [experience, setExperience] = useState<WorkExperience[]>(candidate.workExperience || []);

  // Education
  const [education, setEducation] = useState<Education[]>(candidate.education || []);

  // Projects
  const [projects, setProjects] = useState<Project[]>(candidate.projects || []);

  // Certifications
  const [certifications, setCertifications] = useState<Certification[]>(candidate.certifications || []);

  // Achievements
  const [achievements, setAchievements] = useState<string[]>(
    candidate.achievements ? [candidate.achievements] : []
  );
  const [newAchievement, setNewAchievement] = useState('');

  // Languages
  const [languages, setLanguages] = useState<Record<string, string>>(candidate.languages || {});
  const [newLangName, setNewLangName] = useState('');
  const [newLangProf, setNewLangProf] = useState('Fluent');

  // Active section toggles
  const [includedSections, setIncludedSections] = useState({
    summary: true,
    skills: true,
    experience: true,
    education: true,
    projects: true,
    certifications: true,
    achievements: true,
    languages: true,
  });

  const toggleSection = (key: keyof typeof includedSections) => {
    setIncludedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Skill management
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setSkills([
      ...skills,
      {
        name: newSkillName.trim(),
        level: 'Intermediate',
        type: 'Primary',
      },
    ]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, idx) => idx !== index));
  };

  // Achievement management
  const handleAddAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAchievement.trim()) return;
    setAchievements([...achievements, newAchievement.trim()]);
    setNewAchievement('');
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements(achievements.filter((_, idx) => idx !== index));
  };

  // Language management
  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLangName.trim()) return;
    setLanguages({
      ...languages,
      [newLangName.trim()]: newLangProf,
    });
    setNewLangName('');
  };

  const handleRemoveLanguage = (langKey: string) => {
    const updated = { ...languages };
    delete updated[langKey];
    setLanguages(updated);
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullName = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ').trim() || 'Candidate';
    const email = candidate.email || '';
    const phone = candidate.phoneNumber || '';
    const location = candidate.currentLocation
      ? [candidate.currentLocation.city, candidate.currentLocation.state, candidate.currentLocation.country]
          .filter(Boolean)
          .join(', ')
      : '';

    const payload: GenerateAiCvPayload = {
      candidateProfile: {
        fullName,
        email,
        phone,
        location,
        targetJobRole: targetRole.trim() || 'Software Professional',
        targetIndustry: targetIndustry.trim(),
        bio: candidate.bio || '',
        aboutMe: includedSections.summary ? summary.trim() : '',
        skills: includedSections.skills
          ? skills.map((s) => ({ name: s.name, level: s.level }))
          : [],
        workExperience: includedSections.experience
          ? experience.map((w) => ({
              id: w.id,
              jobTitle: w.jobTitle,
              companyName: w.companyName,
              startDate: w.startDate,
              endDate: w.endDate || undefined,
              isCurrent: Boolean(w.isCurrent),
              description: w.description || '',
            }))
          : [],
        education: includedSections.education
          ? education.map((e) => ({
              id: e.id,
              degree: e.degree,
              institution: e.institution,
              fieldOfStudy: e.fieldOfStudy,
              startYear: e.startYear,
              endYear: e.endYear,
              grade: e.grade,
            }))
          : [],
        projects: includedSections.projects
          ? projects.map((p) => ({
              id: p.id,
              title: p.title,
              role: p.role,
              technologies: p.technologies || [],
              description: p.description,
              link: p.link,
            }))
          : [],
        certifications: includedSections.certifications
          ? certifications.map((c) => ({
              name: c.name,
              organization: c.organization,
              issueDate: c.issueDate,
              credentialUrl: c.credentialUrl,
            }))
          : [],
        achievements: includedSections.achievements ? achievements : [],
        languages: includedSections.languages ? languages : {},
      },
    };

    await onGenerate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Target Role & Industry (Crucial for AI Optimization) */}
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Target Role &amp; Industry Alignment
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                The AI will tailor keywords, summary, and bullet points specifically for this position.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Target Job Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer, Product Manager"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Target Industry / Sector
            </label>
            <input
              type="text"
              value={targetIndustry}
              onChange={(e) => setTargetIndustry(e.target.value)}
              placeholder="e.g. FinTech, SaaS, Healthcare, E-Commerce"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Professional Summary Customization */}
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Professional Summary / Bio
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <span>Include in CV</span>
            <input
              type="checkbox"
              checked={includedSections.summary}
              onChange={() => toggleSection('summary')}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
          </label>
        </div>

        {includedSections.summary && (
          <div>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter your current professional summary or let the AI synthesize one based on your background and target role..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Tip: The AI will refine this summary into a high-impact, ATS-optimized executive summary.
            </p>
          </div>
        )}
      </div>

      {/* 3. Skills Customization */}
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Core Skills ({skills.length})
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <span>Include in CV</span>
            <input
              type="checkbox"
              checked={includedSections.skills}
              onChange={() => toggleSection('skills')}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
          </label>
        </div>

        {includedSections.skills && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {skills.map((s, idx) => (
                <span
                  key={`${s.name}-${idx}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                >
                  {s.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-brand-400 hover:text-brand-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Add custom skill (e.g. React, Node.js, AWS)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddSkill}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Work Experience Review */}
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Work Experience ({experience.length})
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <span>Include in CV</span>
            <input
              type="checkbox"
              checked={includedSections.experience}
              onChange={() => toggleSection('experience')}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
          </label>
        </div>

        {includedSections.experience && (
          <div className="space-y-3">
            {experience.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No work experience in profile.</p>
            ) : (
              experience.map((exp, idx) => (
                <div
                  key={exp.id || idx}
                  className="p-3 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-hover/50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-900 dark:text-white">{exp.jobTitle}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {exp.companyName} • {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="text-gray-500 line-clamp-2 mt-1">{exp.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setExperience(experience.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="Remove from this CV"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 5. Projects Review */}
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Projects ({projects.length})
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <span>Include in CV</span>
            <input
              type="checkbox"
              checked={includedSections.projects}
              onChange={() => toggleSection('projects')}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
          </label>
        </div>

        {includedSections.projects && (
          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No projects in profile.</p>
            ) : (
              projects.map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  className="p-3 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-hover/50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-900 dark:text-white">{proj.title}</p>
                    <p className="text-gray-600 dark:text-gray-400">{proj.role}</p>
                    {proj.description && (
                      <p className="text-gray-500 line-clamp-2 mt-1">{proj.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="Remove from this CV"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 6. Education Review */}
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Education ({education.length})
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <span>Include in CV</span>
            <input
              type="checkbox"
              checked={includedSections.education}
              onChange={() => toggleSection('education')}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
          </label>
        </div>

        {includedSections.education && (
          <div className="space-y-3">
            {education.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No education records in profile.</p>
            ) : (
              education.map((edu, idx) => (
                <div
                  key={edu.id || idx}
                  className="p-3 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-hover/50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {edu.degree} in {edu.fieldOfStudy}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {edu.institution} ({edu.startYear} - {edu.endYear})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEducation(education.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="Remove from this CV"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 7. Certifications */}
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Certifications ({certifications.length})
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <span>Include in CV</span>
            <input
              type="checkbox"
              checked={includedSections.certifications}
              onChange={() => toggleSection('certifications')}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
          </label>
        </div>

        {includedSections.certifications && (
          <div className="space-y-3">
            {certifications.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No certifications in profile.</p>
            ) : (
              certifications.map((cert, idx) => (
                <div
                  key={cert.name + idx}
                  className="p-3 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-hover/50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-900 dark:text-white">{cert.name}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {cert.organization} {cert.issueDate && `• ${cert.issueDate}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="Remove from this CV"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 8. Honors & Achievements */}
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Honors &amp; Achievements ({achievements.length})
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <span>Include in CV</span>
            <input
              type="checkbox"
              checked={includedSections.achievements}
              onChange={() => toggleSection('achievements')}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
          </label>
        </div>

        {includedSections.achievements && (
          <div className="space-y-3">
            {achievements.map((ach, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-hover/50 flex items-center justify-between gap-3 text-xs"
              >
                <p className="text-gray-800 dark:text-gray-200">{ach}</p>
                <button
                  type="button"
                  onClick={() => handleRemoveAchievement(idx)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                placeholder="Add an honor or achievement..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddAchievement}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 9. Languages */}
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LangIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Languages ({Object.keys(languages).length})
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <span>Include in CV</span>
            <input
              type="checkbox"
              checked={includedSections.languages}
              onChange={() => toggleSection('languages')}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
          </label>
        </div>

        {includedSections.languages && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(languages).map(([lang, prof]) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-gray-100 dark:bg-dark-hover text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-dark-border"
                >
                  {lang} ({prof})
                  <button
                    type="button"
                    onClick={() => handleRemoveLanguage(lang)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newLangName}
                onChange={(e) => setNewLangName(e.target.value)}
                placeholder="Language name..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white"
              />
              <select
                value={newLangProf}
                onChange={(e) => setNewLangProf(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white"
              >
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Fluent">Fluent</option>
                <option value="Native">Native</option>
              </select>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddLanguage}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Action */}
      <div className="sticky bottom-4 z-20 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-dark-border shadow-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <HelpCircle className="w-4 h-4 text-brand-600" />
          <span>Generates an ATS-optimized CV using TalentBay Cloud AI</span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isGenerating || !targetRole.trim()}
          className="shadow-md shadow-brand-500/25 px-8"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Generating ATS Resume...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate ATS Resume
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

