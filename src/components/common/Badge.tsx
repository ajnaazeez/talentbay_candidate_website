import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export type BadgeVariant =
  | 'default'
  | 'brand'
  | 'indigo'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple'
  | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  isAi?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-brand-50 text-brand-700 border-brand-200/60 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60',
  brand: 'bg-brand-600 text-white border-transparent shadow-xs',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  info: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  outline: 'bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-brand-500',
  brand: 'bg-white',
  indigo: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  purple: 'bg-purple-500',
  neutral: 'bg-slate-400',
  outline: 'bg-slate-400',
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
