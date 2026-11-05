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
  default: 'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-[#1c1f2b] dark:text-zinc-100 dark:border-[#20232e]',
  brand: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-xs',
  bronze: 'bg-amber-50 text-amber-900 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  indigo: 'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-[#1c1f2b] dark:text-zinc-100 dark:border-[#20232e]',
  champagne: 'bg-amber-50/80 text-amber-900 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  danger: 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  info: 'bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
  purple: 'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-[#1c1f2b] dark:text-zinc-100 dark:border-[#20232e]',
  neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-[#1c1f2b] dark:text-zinc-300 dark:border-[#20232e]',
  outline: 'bg-transparent text-zinc-700 border-zinc-300 dark:text-zinc-300 dark:border-[#20232e]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-zinc-500',
  brand: 'bg-white dark:bg-zinc-900',
  bronze: 'bg-amber-600',
  indigo: 'bg-zinc-500',
  champagne: 'bg-amber-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  purple: 'bg-zinc-500',
  neutral: 'bg-zinc-400',
  outline: 'bg-zinc-400',
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
