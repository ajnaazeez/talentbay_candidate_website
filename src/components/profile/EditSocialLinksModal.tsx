import React, { useState } from 'react';
import { Button } from '@/components/common/Button';
import { ModalPortal } from '@/components/common/Modal';
import { X, Plus, Trash2, Globe, Linkedin, Github, Languages, Link as LinkIcon } from 'lucide-react';

interface EditSocialLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    linkedinProfile?: string;
    githubProfile?: string;
    portfolioUrl?: string;
    otherLinks?: string[];
    languages?: Record<string, string>;
  };
  onSave: (data: {
    linkedinProfile?: string;
    githubProfile?: string;
    portfolioUrl?: string;
    otherLinks: string[];
    languages: Record<string, string>;
  }) => Promise<void>;
}

const PROFICIENCY_LEVELS = ['Elementary', 'Limited Working', 'Professional Working', 'Full Professional', 'Native / Bilingual'];

export const EditSocialLinksModal: React.FC<EditSocialLinksModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
}) => {
  const [linkedin, setLinkedin] = useState(initialData.linkedinProfile || '');
  const [github, setGithub] = useState(initialData.githubProfile || '');
  const [portfolio, setPortfolio] = useState(initialData.portfolioUrl || '');
  
  // Other Links
  const [otherLinks, setOtherLinks] = useState<string[]>(initialData.otherLinks || []);
  const [newLink, setNewLink] = useState('');

  // Languages: key-value pairs
  const [languages, setLanguages] = useState<Record<string, string>>(initialData.languages || {});
  const [langName, setLangName] = useState('');
  const [langProficiency, setLangProficiency] = useState(PROFICIENCY_LEVELS[2]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setLinkedin(initialData.linkedinProfile || '');
    setGithub(initialData.githubProfile || '');
    setPortfolio(initialData.portfolioUrl || '');
    setOtherLinks(initialData.otherLinks || []);
    setLanguages(initialData.languages || {});
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddOtherLink = () => {
    const trimmed = newLink.trim();
    if (trimmed && !otherLinks.includes(trimmed)) {
      setOtherLinks([...otherLinks, trimmed]);
      setNewLink('');
    }
  };

  const handleRemoveOtherLink = (index: number) => {
    setOtherLinks(otherLinks.filter((_, i) => i !== index));
  };

  const handleAddLanguage = () => {
    const trimmed = langName.trim();
    if (trimmed) {
      setLanguages({ ...languages, [trimmed]: langProficiency });
      setLangName('');
    }
  };

  const handleRemoveLanguage = (name: string) => {
    const updated = { ...languages };
    delete updated[name];
    setLanguages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        linkedinProfile: linkedin.trim() || undefined,
        githubProfile: github.trim() || undefined,
        portfolioUrl: portfolio.trim() || undefined,
        otherLinks,
        languages,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update links & languages.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-[#0E2233] rounded-3xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Online Profiles & Languages
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Social Profiles */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Social & Portfolio Profiles
            </h4>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-3 w-4 h-4 text-[#1F2D3D] dark:text-[#BACDD8]" />
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                GitHub Profile URL
              </label>
              <div className="relative">
                <Github className="absolute left-3 top-3 w-4 h-4 text-gray-700 dark:text-gray-300" />
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Personal Portfolio or Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 text-brand-600" />
                <input
                  type="url"
                  placeholder="https://myportfolio.dev"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Other links */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Other Links (Blog, Dribbble, Medium, etc.)
              </label>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOtherLink();
                      }
                    }}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddOtherLink}
                  className="px-3.5 py-2 bg-gray-100 dark:bg-dark-hover hover:bg-gray-200 dark:hover:bg-dark-border rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {otherLinks.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {otherLinks.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border text-xs"
                    >
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 dark:text-brand-400 hover:underline truncate max-w-[340px]"
                      >
                        {link}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveOtherLink(idx)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Languages Section */}
          <div className="pt-4 border-t border-gray-100 dark:border-dark-border space-y-4">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Languages Spoken
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Language (e.g. English, Spanish, Hindi)"
                value={langName}
                onChange={(e) => setLangName(e.target.value)}
                className="md:col-span-6 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={langProficiency}
                onChange={(e) => setLangProficiency(e.target.value)}
                className="md:col-span-4 px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {PROFICIENCY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddLanguage}
                className="md:col-span-2 px-3 py-2 bg-gray-100 dark:bg-dark-hover hover:bg-gray-200 dark:hover:bg-dark-border rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {Object.keys(languages).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {Object.entries(languages).map(([lang, prof]) => (
                  <div
                    key={lang}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{lang}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{prof}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};
