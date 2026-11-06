import React, { useEffect, useState } from 'react';
import { Download, X, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { AiCvModel } from '@/types/aiCv';
import { downloadAtsPdf, getPdfBlobUrl } from '@/utils/atsPdfGenerator';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cv: AiCvModel;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  cv,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    try {
      const url = getPdfBlobUrl(cv);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
        setBlobUrl(null);
      };
    } catch (err) {
      console.error('Failed to generate PDF blob URL:', err);
    }
  }, [isOpen, cv]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-card/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  ATS Resume Preview
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#16B8A6]/15 dark:bg-[#16B8A6]/20 text-[#16B8A6] dark:text-[#DCE5EB] border border-[#16B8A6]/30 dark:border-[#16B8A6]/40">
                  <CheckCircle2 className="w-3 h-3" />
                  ATS Vector Format
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Single-column text layout, standard headings, and selectable text for 100% ATS parse rate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => downloadAtsPdf(cv)}
              className="shadow-xs"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download PDF
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Container */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-2 sm:p-4 overflow-hidden relative">
          {blobUrl ? (
            <iframe
              src={blobUrl}
              title="ATS Resume PDF Preview"
              className="w-full h-full rounded-xl border border-gray-300 dark:border-gray-800 shadow-inner bg-white"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Rendering ATS PDF preview...</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card flex items-center justify-between text-xs text-gray-500">
          <span>Standard A4 • Single-column • Helvetica Vector Text</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
};

