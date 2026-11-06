import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 pb-2 border-b border-[#D8E4EA] dark:border-[#1F2D3D]',
        className
      )}
    >
      <div className="space-y-0.5 min-w-0">
        <h2 className="text-sm sm:text-base font-bold text-[#1F2D3D] dark:text-white tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] leading-snug">{description}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

