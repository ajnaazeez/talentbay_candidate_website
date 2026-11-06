import React, { useState } from 'react';
import type { Certification } from '@/types';
import { Button } from '@/components/common/Button';
import { ModalPortal } from '@/components/common/Modal';
import { X, Trash2, Award, Calendar, Link as LinkIcon } from 'lucide-react';

interface AddEditCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  certification?: Certification | null;
  onSave: (cert: Certification) => Promise<void>;
  onDelete?: (name: string) => Promise<void>;
}

export const AddEditCertificationModal: React.FC<AddEditCertificationModalProps> = ({
  isOpen,
  onClose,
  certification,
  onSave,
  onDelete,
}) => {
  const isEditing = !!certification;
  const [name, setName] = useState(certification?.name || '');
  const [organization, setOrganization] = useState(certification?.organization || '');
  const [issueDate, setIssueDate] = useState(
    certification?.issueDate ? certification.issueDate.split('T')[0] : ''
  );
  const [doesExpire, setDoesExpire] = useState(!!certification?.expiryDate);
  const [expiryDate, setExpiryDate] = useState(
    certification?.expiryDate ? certification.expiryDate.split('T')[0] : ''
  );
  const [credentialUrl, setCredentialUrl] = useState(certification?.credentialUrl || '');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (certification) {
      setName(certification.name);
      setOrganization(certification.organization);
      setIssueDate(certification.issueDate ? certification.issueDate.split('T')[0] : '');
      setDoesExpire(!!certification.expiryDate);
      setExpiryDate(certification.expiryDate ? certification.expiryDate.split('T')[0] : '');
      setCredentialUrl(certification.credentialUrl || '');
    } else {
      setName('');
      setOrganization('');
      setIssueDate('');
      setDoesExpire(false);
      setExpiryDate('');
      setCredentialUrl('');
    }
    setError(null);
  }, [certification, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Certification name is required.');
      return;
    }
    if (!organization.trim()) {
      setError('Issuing organization is required.');
      return;
    }
    if (!issueDate) {
      setError('Issue date is required.');
      return;
    }
    if (doesExpire && !expiryDate) {
      setError('Please provide an expiry date or uncheck expiry.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updatedCert: Certification = {
        name: name.trim(),
        organization: organization.trim(),
        issueDate: new Date(issueDate).toISOString(),
        expiryDate: doesExpire && expiryDate ? new Date(expiryDate).toISOString() : null,
        credentialUrl: credentialUrl.trim() || undefined,
      };

      await onSave(updatedCert);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save certification.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!certification?.name || !onDelete) return;
    if (!window.confirm('Are you sure you want to delete this certification?')) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(certification.name);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete certification.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#0E2233] rounded-3xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#00BFA6]/15 text-[#00BFA6]">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Certification' : 'Add Certification'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Certification Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AWS Certified Solutions Architect"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Issuing Organization *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Amazon Web Services, Google, Coursera"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Issue Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Expiry Date
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doesExpire}
                    onChange={(e) => setDoesExpire(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                  />
                  Expires
                </label>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  disabled={!doesExpire}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Credential Verification URL
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="url"
                placeholder="https://www.credly.com/badges/..."
                value={credentialUrl}
                onChange={(e) => setCredentialUrl(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
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
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={saving}>
                Save Certification
              </Button>
            </div>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};
