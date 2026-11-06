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
    'bg-[#B87355] text-white hover:bg-[#A46347] active:bg-[#8D5239] shadow-xs hover:shadow transition-all duration-150 disabled:opacity-40',
  secondary:
    'bg-[#F5F1EA] dark:bg-[#383439] text-[#29272A] dark:text-[#F5F1EA] hover:bg-[#E6DFD8] dark:hover:bg-[#494448] active:bg-[#D7CDC4] disabled:opacity-50 transition-all duration-150',
  outline:
    'bg-white dark:bg-[#222023] text-[#29272A] dark:text-[#F5F1EA] border border-[#E6DFD8] dark:border-[#494448] hover:bg-[#F5F1EA] dark:hover:bg-[#2E2B30] hover:border-[#B87355]/40 dark:hover:border-[#B87355]/40 shadow-xs disabled:opacity-50 transition-all duration-150',
  ghost:
    'bg-transparent text-[#494448] dark:text-[#D4CDC7] hover:bg-[#F5F1EA] dark:hover:bg-[#383439] hover:text-[#29272A] dark:hover:text-white transition-all duration-150 disabled:opacity-40',
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
          'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-[#B87355]/25 focus:ring-offset-1 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]',
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
