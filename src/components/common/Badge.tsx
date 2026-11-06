import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export type BadgeVariant =
  | 'default'
  | 'brand'
  | 'bronze'
  | 'indigo'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple'
  | 'champagne'
  | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  isAi?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#F7F4EC] text-[#252923] border-[#E8E5DC] dark:bg-[#202A27] dark:text-[#F7F4EC] dark:border-[#2e3b37]',
  brand: 'bg-[#123C35] text-white dark:bg-[#C5A46D] dark:text-[#202A27] border-transparent shadow-xs',
  bronze: 'bg-[#C5A46D]/15 text-[#8b6d3d] border-[#C5A46D]/30 dark:bg-[#C5A46D]/20 dark:text-[#dec49c] dark:border-[#C5A46D]/40',
  indigo: 'bg-[#F7F4EC] text-[#252923] border-[#E8E5DC] dark:bg-[#202A27] dark:text-[#F7F4EC] dark:border-[#2e3b37]',
  champagne: 'bg-[#C5A46D]/15 text-[#8b6d3d] border-[#C5A46D]/30 dark:bg-[#C5A46D]/20 dark:text-[#dec49c] dark:border-[#C5A46D]/40',
  success: 'bg-[#123C35]/10 text-[#123C35] border-[#123C35]/25 dark:bg-[#123C35]/30 dark:text-[#83bdb0] dark:border-[#123C35]/50',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  danger: 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  info: 'bg-[#123C35]/10 text-[#123C35] border-[#123C35]/20 dark:bg-[#123C35]/30 dark:text-[#b3d7cd] dark:border-[#123C35]/40',
  purple: 'bg-[#F7F4EC] text-[#252923] border-[#E8E5DC] dark:bg-[#202A27] dark:text-[#F7F4EC] dark:border-[#2e3b37]',
  neutral: 'bg-[#F7F4EC] text-[#777D78] border-[#E8E5DC] dark:bg-[#202A27] dark:text-[#9ea5a1] dark:border-[#2e3b37]',
  outline: 'bg-transparent text-[#777D78] border-[#E8E5DC] dark:text-[#9ea5a1] dark:border-[#2e3b37]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[#777D78]',
  brand: 'bg-[#C5A46D]',
  bronze: 'bg-[#C5A46D]',
  indigo: 'bg-[#123C35]',
  champagne: 'bg-[#C5A46D]',
  success: 'bg-[#123C35]',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-[#123C35]',
  purple: 'bg-[#123C35]',
  neutral: 'bg-[#777D78]',
  outline: 'bg-[#777D78]',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  isAi = false,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border transition-colors select-none',
        size === 'sm' && 'px-2 py-0.5 text-[11px]',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {isAi && <Sparkles className="w-3 h-3 text-current shrink-0 animate-pulse" />}
      {dot && !isAi && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      <span>{children}</span>
    </span>
  );
};
