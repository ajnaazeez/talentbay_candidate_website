import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-xs hover:shadow-md transition-all duration-150 disabled:bg-brand-300 dark:disabled:bg-brand-900/40',
  secondary:
    'bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#283548] active:bg-slate-300 disabled:opacity-50 transition-all duration-150',
  outline:
    'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1f293d] hover:bg-slate-50 dark:hover:bg-[#1e293b] hover:border-slate-300 dark:hover:border-slate-700 shadow-xs disabled:opacity-50 transition-all duration-150',
  ghost:
    'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-[#1e293b]/70 hover:text-slate-900 dark:hover:text-white transition-all duration-150 disabled:opacity-40',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs hover:shadow transition-all duration-150 disabled:bg-rose-300',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs hover:shadow transition-all duration-150 disabled:bg-emerald-300',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5 font-semibold',
  md: 'px-4 py-2 text-sm rounded-xl gap-2 font-semibold',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5 font-semibold',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-1 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
