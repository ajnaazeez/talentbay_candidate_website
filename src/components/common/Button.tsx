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
    'bg-[#16B8A6] text-white hover:bg-[#0D9488] active:bg-[#0F766E] shadow-xs hover:shadow transition-all duration-150 disabled:opacity-40',
  secondary:
    'bg-[#E7EFF3] dark:bg-[#1A374B] text-[#243746] dark:text-[#F5F8FA] hover:bg-[#DCE5EB] dark:hover:bg-[#243746] active:bg-[#D5E3EB] disabled:opacity-50 transition-all duration-150',
  outline:
    'bg-white dark:bg-[#142B3B] text-[#243746] dark:text-[#F5F8FA] border border-[#DCE5EB] dark:border-[#243746] hover:bg-[#F5F8FA] dark:hover:bg-[#1B364A] hover:border-[#16B8A6]/40 dark:hover:border-[#16B8A6]/40 shadow-xs disabled:opacity-50 transition-all duration-150',
  ghost:
    'bg-transparent text-[#243746] dark:text-[#BACDD8] hover:bg-[#E7EFF3] dark:hover:bg-[#1A374B] hover:text-[#142B3B] dark:hover:text-white transition-all duration-150 disabled:opacity-40',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs hover:shadow transition-all duration-150 disabled:bg-rose-300',
  success:
    'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-xs hover:shadow transition-all duration-150 disabled:bg-teal-300',
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
          'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-[#16B8A6]/25 focus:ring-offset-1 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]',
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
