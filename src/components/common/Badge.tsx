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
  default: 'bg-[#E7EFF3] text-[#243746] border-[#DCE5EB] dark:bg-[#1A374B] dark:text-[#F5F8FA] dark:border-[#243746]',
  brand: 'bg-[#16B8A6] text-white border-transparent shadow-xs',
  bronze: 'bg-[#16B8A6]/15 text-[#0F766E] border-[#16B8A6]/30 dark:bg-[#16B8A6]/20 dark:text-[#5EEAD4] dark:border-[#16B8A6]/40',
  indigo: 'bg-[#E7EFF3] text-[#243746] border-[#DCE5EB] dark:bg-[#1A374B] dark:text-[#F5F8FA] dark:border-[#243746]',
  champagne: 'bg-[#16B8A6]/15 text-[#0F766E] border-[#16B8A6]/30 dark:bg-[#16B8A6]/20 dark:text-[#5EEAD4] dark:border-[#16B8A6]/40',
  success: 'bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  danger: 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  info: 'bg-[#E7EFF3] text-[#243746] border-[#DCE5EB] dark:bg-[#1A374B] dark:text-[#BACDD8] dark:border-[#243746]',
  purple: 'bg-[#E7EFF3] text-[#243746] border-[#DCE5EB] dark:bg-[#1A374B] dark:text-[#F5F8FA] dark:border-[#243746]',
  neutral: 'bg-[#E7EFF3] text-[#243746] border-[#DCE5EB] dark:bg-[#1A374B] dark:text-[#BACDD8] dark:border-[#243746]',
  outline: 'bg-transparent text-[#243746] border-[#DCE5EB] dark:text-[#F5F8FA] dark:border-[#243746]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[#8CA6B7]',
  brand: 'bg-white',
  bronze: 'bg-[#16B8A6]',
  indigo: 'bg-[#8CA6B7]',
  champagne: 'bg-[#16B8A6]',
  success: 'bg-teal-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-[#8CA6B7]',
  purple: 'bg-[#8CA6B7]',
  neutral: 'bg-[#8CA6B7]',
  outline: 'bg-[#8CA6B7]',
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
