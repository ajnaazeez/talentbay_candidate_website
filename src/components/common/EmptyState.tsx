import React, { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-10 text-center bg-white dark:bg-[#0E2233] rounded-2xl border border-dashed border-[#D8E4EA] dark:border-[#1F2D3D] shadow-sm my-4',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#E8F1F5] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] flex items-center justify-center text-[#8CA6B7] mb-4 shadow-sm">
        {icon || <Inbox className="h-7 w-7 text-[#8CA6B7]" />}
      </div>
      <h3 className="text-base font-semibold text-[#0E2233] dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-[#6B8699] dark:text-[#8CA6B7] max-w-sm mb-6">{description}</p>
      {action || actions ? (
        action || actions
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0E2233] hover:bg-[#163248] border border-[#00BFA6]/40 hover:border-[#00BFA6] rounded-xl transition shadow-xs cursor-pointer"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};
