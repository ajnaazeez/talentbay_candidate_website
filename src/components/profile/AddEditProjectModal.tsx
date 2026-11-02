import React, { useState } from 'react';
import type { Project } from '@/types';
import { aiService } from '@/services/aiService';
import { Button } from '@/components/common/Button';
import { X, Sparkles, Plus, Trash2, Globe } from 'lucide-react';

interface AddEditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  onSave: (project: Project) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const AddEditProjectModal: React.FC<AddEditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
  onDelete,
}) => {
  const isEditing = !!project;
  const [title, setTitle] = useState(project?.title || '');
  const [role, setRole] = useState(project?.role || '');
  const [link, setLink] = useState(project?.link || '');
  const [description, setDescription] = useState(project?.description || '');
  const [technologies, setTechnologies] = useState<string[]>(project?.technologies || []);
  const [techInput, setTechInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens or project changes
  React.useEffect(() => {
    if (project) {
      setTitle(project.title);
      setRole(project.role);
      setLink(project.link || '');
      setDescription(project.description);
      setTechnologies(project.technologies || []);
    } else {
      setTitle('');
      setRole('');
      setLink('');
      setDescription('');
      setTechnologies([]);
    }
    setError(null);
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleAddTech = () => {
    const trimmed = techInput.trim();
    if (trimmed && !technologies.includes(trimmed)) {
      setTechnologies([...technologies, trimmed]);
      setTechInput('');
    }
  };

  const handleRemoveTech = (item: string) => {
    setTechnologies(technologies.filter((t) => t !== item));
  };

  const handleEnhanceDescription = async () => {
    if (!description.trim()) {
      setError('Please enter some project description text first.');
      return;
    }
    setEnhancing(true);
    setError(null);
    try {
      const enhanced = await aiService.enhanceText({ text: description, type: 'project' });
      setDescription(enhanced);
    } catch (err: any) {
      setError(err?.message || 'Failed to enhance project description with AI.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Project title is required.');
      return;
    }
    if (!role.trim()) {
      setError('Your role is required (e.g. Lead Developer, Full Stack Engineer).');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updatedProject: Project = {
        id: project?.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        role: role.trim(),
        link: link.trim() || undefined,
        description: description.trim(),
        technologies,
      };

      await onSave(updatedProject);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project?.id || !onDelete) return;
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(project.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete project.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Project' : 'Add Project'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. TalentBay Recruitment Platform"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Your Role *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lead Frontend Developer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Project / Demo Link
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  placeholder="https://github.com/... or https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Technologies Used */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Technologies & Tools
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g. React, TypeScript, Node.js"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="px-3.5 py-2 bg-gray-100 dark:bg-dark-hover hover:bg-gray-200 dark:hover:bg-dark-border rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            {technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {technologies.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-lg text-xs font-medium border border-brand-200 dark:border-brand-800/40"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(t)}
                      className="hover:text-red-500 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description & AI Enhance */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Project Description & Achievements *
              </label>
              <button
                type="button"
                disabled={enhancing || !description.trim()}
                onClick={handleEnhanceDescription}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 disabled:opacity-50 transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 ${enhancing ? 'animate-spin' : ''}`} />
                {enhancing ? 'Enhancing with AI...' : 'Enhance with AI'}
              </button>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Describe the problem solved, your key contributions, architecture, metrics and impact..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
            {isEditing && onDelete ? (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={saving}>
                Save Project
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
