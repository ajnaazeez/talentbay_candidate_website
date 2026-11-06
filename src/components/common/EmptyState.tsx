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
        'flex flex-col items-center justify-center p-10 text-center bg-white dark:bg-[#202A27] rounded-2xl border border-dashed border-[#E8E5DC] dark:border-[#2e3b37] shadow-sm my-4',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#F7F4EC] dark:bg-[#141a18] border border-[#E8E5DC] dark:border-[#2e3b37] flex items-center justify-center text-[#777D78] mb-4 shadow-sm">
        {icon || <Inbox className="h-7 w-7 text-[#777D78]" />}
      </div>
      <h3 className="text-base font-semibold text-[#252923] dark:text-[#F7F4EC] mb-1">{title}</h3>
      <p className="text-sm text-[#777D78] dark:text-[#9ea5a1] max-w-sm mb-6">{description}</p>
      {action || actions ? (
        action || actions
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition shadow-sm hover:shadow"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};
