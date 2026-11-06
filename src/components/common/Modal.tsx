import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalPortalProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  overlayClassName?: string;
  zIndex?: string;
}

/**
 * ModalPortal: Teleports modal dialogs directly into document.body.
 * - Escapes parent transforms, filters, and container overflow clipping.
 * - Positions strictly against the visible browser viewport.
 * - Prevents background scrolling while modal is open, with automatic scroll restoration.
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({
  children,
  isOpen = true,
  onClose,
  closeOnBackdrop = true,
  closeOnEscape = true,
  overlayClassName,
  zIndex = 'z-50',
}) => {
  const scrollYRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    // 1. Capture current viewport scroll position
    scrollYRef.current = window.scrollY;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // 2. Prevent layout shift from scrollbar removal
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // 3. Lock background body scrolling
    document.body.style.overflow = 'hidden';

    // 4. Handle Escape key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && onClose) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      // 5. Restore user scroll position exactly
      window.scrollTo({ top: scrollYRef.current, behavior: 'instant' as ScrollBehavior });
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdrop && onClose) {
      onClose();
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-150',
        zIndex,
        overlayClassName
      )}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  overlayClassName?: string;
  zIndex?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  full: 'max-w-5xl',
};

/**
 * Standard Shared Modal Component
 * Renders into document.body via ModalPortal, centered in the viewport.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  overlayClassName,
  zIndex = 'z-50',
}) => {
  if (!isOpen) return null;

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      overlayClassName={overlayClassName}
      zIndex={zIndex}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full bg-white dark:bg-[#0E2233] rounded-3xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-2xl overflow-hidden flex flex-col my-auto transition-all max-h-[90vh]',
          sizeClasses[size],
          className
        )}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              'flex items-center justify-between px-6 py-4 border-b border-[#D8E4EA] dark:border-[#1F2D3D] shrink-0',
              headerClassName
            )}
          >
            <div className="flex items-center gap-3 min-w-0 pr-4">
              {icon && (
                <div className="w-9 h-9 rounded-xl bg-[#00BFA6]/15 text-[#00BFA6] flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-base sm:text-lg font-bold text-[#1F2D3D] dark:text-white truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-xl text-[#8CA6B7] hover:text-[#1F2D3D] dark:hover:text-white hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className={cn('p-6 overflow-y-auto flex-1 leading-relaxed', bodyClassName)}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            className={cn(
              'px-6 py-4 border-t border-[#D8E4EA] dark:border-[#1F2D3D] bg-[#F6FAFC] dark:bg-[#0A1A27]/60 flex items-center justify-end gap-3 shrink-0',
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </ModalPortal>
  );
};
