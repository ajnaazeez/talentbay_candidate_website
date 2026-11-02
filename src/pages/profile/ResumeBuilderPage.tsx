import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { Button } from '@/components/common/Button';
import type { Skill, WorkExperience, Education, Project, Certification } from '@/types';
import {
  Printer,
  ArrowLeft,
  Settings2,
  Check,
  Palette,
  Layout,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileCheck,
} from 'lucide-react';

type TemplateStyle = 'modern' | 'classic' | 'minimal';
type AccentColor = 'indigo' | 'slate' | 'navy' | 'emerald' | 'purple';
type PageDensity = 'compact' | 'normal' | 'spacious';

const COLOR_MAP: Record<AccentColor, { hex: string; bgClass: string; textClass: string; borderClass: string }> = {
  indigo: {
    hex: '#4f46e5',
    bgClass: 'bg-indigo-600',
    textClass: 'text-indigo-600',
    borderClass: 'border-indigo-600',
  },
  slate: {
    hex: '#334155',
    bgClass: 'bg-slate-700',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-700',
  },
  navy: {
    hex: '#1e3a8a',
    bgClass: 'bg-blue-900',
    textClass: 'text-blue-900',
    borderClass: 'border-blue-900',
  },
  emerald: {
    hex: '#059669',
    bgClass: 'bg-emerald-600',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-600',
  },
  purple: {
    hex: '#7c3aed',
    bgClass: 'bg-purple-600',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-600',
  },
};

export const ResumeBuilderPage: React.FC = () => {
  const { candidate } = useAuth();

  const [template, setTemplate] = useState<TemplateStyle>('modern');
  const [accentColor, setAccentColor] = useState<AccentColor>('indigo');
  const [density, setDensity] = useState<PageDensity>('normal');

  // Section visibility toggles
  const [visibleSections, setVisibleSections] = useState({
    summary: true,
    skills: true,
    experience: true,
    education: true,
    projects: true,
    certifications: true,
    languages: true,
  });

  const toggleSection = (sec: keyof typeof visibleSections) => {
    setVisibleSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const activeColor = COLOR_MAP[accentColor];

  const fullName = [candidate?.firstName, candidate?.lastName].filter(Boolean).join(' ') || 'Candidate Name';
  const headline = candidate?.bio || candidate?.designation || 'Professional Title';

  return (
    <div className="min-h-screen pb-16">
      {/* Print Specific CSS: Injected directly for print fidelity */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all application elements */
          header, aside, .no-print, .candidate-sidebar, .candidate-header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .resume-container {
            margin: 0 !important;
            padding: 18mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>

      {/* Control Bar (Hidden when printing) */}
      <div className="no-print bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border px-6 py-4 mb-8 sticky top-0 z-30 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={ROUTES.PROFILE}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Profile
              </Button>
            </Link>
            <div className="h-4 w-px bg-gray-200 dark:bg-dark-border hidden sm:block" />
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-brand-600" />
                ATS Web Resume Builder
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Generate an ATS-friendly, scannable resume directly from your verified profile.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handlePrint}
              className="shadow-md shadow-brand-500/20"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Customization Panel (Hidden when printing) */}
        <div className="no-print lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6 shadow-soft space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-dark-border">
              <Settings2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Resume Configuration
              </h3>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5" /> Template Layout
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'modern', name: 'Modern Clean' },
                    { id: 'classic', name: 'Executive' },
                    { id: 'minimal', name: 'Minimal Tech' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      template === t.id
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                        : 'border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Accent Color
              </label>
              <div className="flex items-center gap-3">
                {(['indigo', 'slate', 'navy', 'emerald', 'purple'] as AccentColor[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccentColor(c)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                      accentColor === c ? 'scale-110 ring-2 ring-offset-2 ring-brand-500' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: COLOR_MAP[c].hex }}
                  >
                    {accentColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Spacing &amp; Density
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'normal', 'spacious'] as PageDensity[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDensity(d)}
                    className={`py-1.5 rounded-lg border text-xs capitalize font-medium transition-colors ${
                      density === d
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-600 font-semibold'
                        : 'border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Visibility Toggles */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-dark-border">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Include Sections
              </label>
              <div className="space-y-2">
                {[
                  { key: 'summary', label: 'Professional Summary' },
                  { key: 'skills', label: 'Skills & Tools' },
                  { key: 'experience', label: 'Work Experience' },
                  { key: 'education', label: 'Education' },
                  { key: 'projects', label: 'Projects' },
                  { key: 'certifications', label: 'Certifications' },
                  { key: 'languages', label: 'Languages' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 cursor-pointer p-1.5 hover:bg-gray-50 dark:hover:bg-dark-hover rounded-lg"
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={visibleSections[key as keyof typeof visibleSections]}
                      onChange={() => toggleSection(key as keyof typeof visibleSections)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/40 text-xs text-brand-900 dark:text-brand-300 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-brand-600" />
              ATS Best Practice Tip
            </p>
            <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
              ATS parsers favor standard section headings, clear chronological work history, and standard font hierarchies. We automatically structure all sections for maximum parse rate.
            </p>
          </div>
        </div>

        {/* Right Printable Resume Canvas Preview */}
        <div className="lg:col-span-8 flex justify-center">
          <div
            id="printable-cv"
            className={`resume-container w-full max-w-[800px] bg-white text-gray-900 shadow-xl rounded-2xl border border-gray-200 p-8 sm:p-12 transition-all ${
              density === 'compact' ? 'space-y-4 text-xs' : density === 'spacious' ? 'space-y-7 text-sm' : 'space-y-5 text-sm'
            }`}
            style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b' }}
          >
            {/* 1. Header Details */}
            {template === 'classic' ? (
              <div className="text-center pb-4 border-b-2 border-gray-900">
                <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-gray-900 mb-1">
                  {fullName}
                </h1>
                <p className="text-sm font-semibold tracking-wider text-gray-600 uppercase mb-2">
                  {headline}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-600">
                  {candidate?.email && <span>{candidate.email}</span>}
                  {candidate?.phoneNumber && <span>• {candidate.phoneNumber}</span>}
                  {candidate?.currentLocation && (
                    <span>
                      • {[candidate.currentLocation.city, candidate.currentLocation.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {candidate?.linkedinProfile && (
                    <span>
                      •{' '}
                      <a href={candidate.linkedinProfile} className="text-gray-900 underline">
                        LinkedIn
                      </a>
                    </span>
                  )}
                  {candidate?.portfolioUrl && (
                    <span>
                      •{' '}
                      <a href={candidate.portfolioUrl} className="text-gray-900 underline">
                        Portfolio
                      </a>
                    </span>
                  )}
                </div>
              </div>
            ) : template === 'minimal' ? (
              <div className="pb-4 border-b border-gray-300">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                  {fullName}
                </h1>
                <p className="text-sm font-medium text-gray-600 mb-3">{headline}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-mono">
                  {candidate?.email && <span>email: {candidate.email}</span>}
                  {candidate?.phoneNumber && <span>tel: {candidate.phoneNumber}</span>}
                  {candidate?.currentLocation && (
                    <span>
                      loc: {[candidate.currentLocation.city, candidate.currentLocation.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {candidate?.githubProfile && <span>github: {candidate.githubProfile}</span>}
                </div>
              </div>
            ) : (
              /* Modern Clean */
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-gray-200 gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    {fullName}
                  </h1>
                  <p className={`text-base font-semibold ${activeColor.textClass}`}>
                    {headline}
                  </p>
                </div>

                <div className="text-xs text-gray-600 space-y-1 sm:text-right">
                  {candidate?.email && (
                    <div className="flex items-center sm:justify-end gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{candidate.email}</span>
                    </div>
                  )}
                  {candidate?.phoneNumber && (
                    <div className="flex items-center sm:justify-end gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{candidate.phoneNumber}</span>
                    </div>
                  )}
                  {candidate?.currentLocation && (
                    <div className="flex items-center sm:justify-end gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {[candidate.currentLocation.city, candidate.currentLocation.country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  {candidate?.linkedinProfile && (
                    <div className="flex items-center sm:justify-end gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      <a href={candidate.linkedinProfile} className="hover:underline">
                        {candidate.linkedinProfile.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Professional Summary */}
            {visibleSections.summary && candidate?.aboutMe && (
              <section className="space-y-1.5">
                <h2
                  className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                    template === 'classic'
                      ? 'border-gray-900 text-gray-900'
                      : `${activeColor.borderClass} ${activeColor.textClass}`
                  }`}
                >
                  Professional Summary
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {candidate.aboutMe}
                </p>
              </section>
            )}

            {/* 3. Skills */}
            {visibleSections.skills && candidate?.skills && candidate.skills.length > 0 && (
              <section className="space-y-2">
                <h2
                  className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                    template === 'classic'
                      ? 'border-gray-900 text-gray-900'
                      : `${activeColor.borderClass} ${activeColor.textClass}`
                  }`}
                >
                  Core Competencies &amp; Skills
                </h2>

                <div className="space-y-1.5 text-xs sm:text-sm">
                  {candidate.skills.some((s: Skill) => s.type === 'Primary') && (
                    <div>
                      <span className="font-bold text-gray-900">Primary Skills: </span>
                      <span className="text-gray-700">
                        {candidate.skills
                          .filter((s: Skill) => s.type === 'Primary')
                          .map((s: Skill) => s.name)
                          .join(' • ')}
                      </span>
                    </div>
                  )}

                  {candidate.skills.some((s: Skill) => s.type === 'Secondary') && (
                    <div>
                      <span className="font-bold text-gray-900">Additional Skills: </span>
                      <span className="text-gray-700">
                        {candidate.skills
                          .filter((s: Skill) => s.type === 'Secondary')
                          .map((s: Skill) => s.name)
                          .join(' • ')}
                      </span>
                    </div>
                  )}

                  {candidate.skills.some((s: Skill) => s.type === 'Tool') && (
                    <div>
                      <span className="font-bold text-gray-900">Tools &amp; Frameworks: </span>
                      <span className="text-gray-700">
                        {candidate.skills
                          .filter((s: Skill) => s.type === 'Tool')
                          .map((s: Skill) => s.name)
                          .join(' • ')}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 4. Work Experience */}
            {visibleSections.experience && candidate?.workExperience && candidate.workExperience.length > 0 && (
              <section className="space-y-3">
                <h2
                  className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                    template === 'classic'
                      ? 'border-gray-900 text-gray-900'
                      : `${activeColor.borderClass} ${activeColor.textClass}`
                  }`}
                >
                  Professional Experience
                </h2>

                <div className="space-y-3">
                  {candidate.workExperience.map((exp: WorkExperience) => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-sm">
                        <div className="font-bold text-gray-900">
                          {exp.jobTitle}{' '}
                          <span className="font-semibold text-gray-600">
                            | {exp.companyName}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium sm:text-right">
                          {exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''} -{' '}
                          {exp.isCurrent
                            ? 'Present'
                            : exp.endDate
                            ? new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                            : ''}
                        </div>
                      </div>

                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Projects */}
            {visibleSections.projects && candidate?.projects && candidate.projects.length > 0 && (
              <section className="space-y-3">
                <h2
                  className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                    template === 'classic'
                      ? 'border-gray-900 text-gray-900'
                      : `${activeColor.borderClass} ${activeColor.textClass}`
                  }`}
                >
                  Key Projects &amp; Contributions
                </h2>

                <div className="space-y-2.5">
                  {candidate.projects.map((proj: Project) => (
                    <div key={proj.id} className="space-y-0.5">
                      <div className="flex items-baseline justify-between text-xs sm:text-sm">
                        <span className="font-bold text-gray-900">
                          {proj.title}{' '}
                          <span className="font-normal text-gray-600 text-xs">
                            ({proj.role})
                          </span>
                        </span>
                        {proj.link && (
                          <a
                            href={proj.link}
                            className="text-xs text-brand-600 hover:underline flex items-center gap-0.5"
                          >
                            Demo <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <p className="text-xs text-gray-700 leading-relaxed">
                        {proj.description}
                      </p>

                      {proj.technologies?.length > 0 && (
                        <p className="text-[11px] text-gray-500">
                          <span className="font-semibold">Tech: </span>
                          {proj.technologies.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 6. Education */}
            {visibleSections.education && candidate?.education && candidate.education.length > 0 && (
              <section className="space-y-2">
                <h2
                  className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                    template === 'classic'
                      ? 'border-gray-900 text-gray-900'
                      : `${activeColor.borderClass} ${activeColor.textClass}`
                  }`}
                >
                  Education
                </h2>

                <div className="space-y-2">
                  {candidate.education.map((edu: Education) => (
                    <div
                      key={edu.id}
                      className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-sm"
                    >
                      <div>
                        <div className="font-bold text-gray-900">
                          {edu.degree} in {edu.fieldOfStudy}
                        </div>
                        <div className="text-xs text-gray-600">
                          {edu.institution} {edu.grade && `• Grade: ${edu.grade}`}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {edu.startYear} - {edu.endYear}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 7. Certifications */}
            {visibleSections.certifications && candidate?.certifications && candidate.certifications.length > 0 && (
              <section className="space-y-2">
                <h2
                  className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                    template === 'classic'
                      ? 'border-gray-900 text-gray-900'
                      : `${activeColor.borderClass} ${activeColor.textClass}`
                  }`}
                >
                  Certifications
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {candidate.certifications.map((cert: Certification) => (
                    <div key={cert.name} className="space-y-0.5">
                      <div className="font-bold text-gray-900">{cert.name}</div>
                      <div className="text-gray-600">
                        {cert.organization}{' '}
                        {cert.issueDate && `(${new Date(cert.issueDate).getFullYear()})`}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 8. Languages */}
            {visibleSections.languages && candidate?.languages && Object.keys(candidate.languages).length > 0 && (
              <section className="space-y-1.5">
                <h2
                  className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                    template === 'classic'
                      ? 'border-gray-900 text-gray-900'
                      : `${activeColor.borderClass} ${activeColor.textClass}`
                  }`}
                >
                  Languages
                </h2>
                <p className="text-xs text-gray-700">
                  {Object.entries(candidate.languages)
                    .map(([lang, prof]) => `${lang} (${prof})`)
                    .join(' • ')}
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ResumeBuilderPage;
