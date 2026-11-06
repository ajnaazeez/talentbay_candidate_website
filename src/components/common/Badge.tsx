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
  default: 'bg-[#F5F1EA] text-[#29272A] border-[#E6DFD8] dark:bg-[#383439] dark:text-[#F5F1EA] dark:border-[#494448]',
  brand: 'bg-[#B87355] text-white border-transparent shadow-xs',
  bronze: 'bg-[#B87355]/15 text-[#B87355] border-[#B87355]/30 dark:bg-[#B87355]/20 dark:text-[#D7A38C] dark:border-[#B87355]/40',
  indigo: 'bg-[#F5F1EA] text-[#29272A] border-[#E6DFD8] dark:bg-[#383439] dark:text-[#F5F1EA] dark:border-[#494448]',
  champagne: 'bg-[#B87355]/15 text-[#B87355] border-[#B87355]/30 dark:bg-[#B87355]/20 dark:text-[#D7A38C] dark:border-[#B87355]/40',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  warning: 'bg-[#B87355]/15 text-[#B87355] border-[#B87355]/30 dark:bg-[#B87355]/20 dark:text-[#D7A38C] dark:border-[#B87355]/40',
  danger: 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  info: 'bg-[#F5F1EA] text-[#494448] border-[#E6DFD8] dark:bg-[#383439] dark:text-[#D4CDC7] dark:border-[#494448]',
  purple: 'bg-[#F5F1EA] text-[#29272A] border-[#E6DFD8] dark:bg-[#383439] dark:text-[#F5F1EA] dark:border-[#494448]',
  neutral: 'bg-[#F5F1EA] text-[#494448] border-[#E6DFD8] dark:bg-[#383439] dark:text-[#D4CDC7] dark:border-[#494448]',
  outline: 'bg-transparent text-[#29272A] border-[#E6DFD8] dark:text-[#F5F1EA] dark:border-[#494448]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[#736B70]',
  brand: 'bg-white',
  bronze: 'bg-[#B87355]',
  indigo: 'bg-[#736B70]',
  champagne: 'bg-[#B87355]',
  success: 'bg-emerald-500',
  warning: 'bg-[#B87355]',
  danger: 'bg-rose-500',
  info: 'bg-[#494448]',
  purple: 'bg-[#736B70]',
  neutral: 'bg-[#A49D9E]',
  outline: 'bg-[#A49D9E]',
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
