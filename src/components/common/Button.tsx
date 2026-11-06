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
    'bg-[#123C35] text-white hover:bg-[#0e2f29] active:bg-[#0a221e] dark:bg-[#C5A46D] dark:text-[#202A27] dark:hover:bg-[#d2ad77] dark:active:bg-[#aa8950] shadow-xs hover:shadow transition-all duration-150 disabled:opacity-40',
  secondary:
    'bg-[#F7F4EC] dark:bg-[#26322f] text-[#252923] dark:text-[#F7F4EC] hover:bg-[#ede8dc] dark:hover:bg-[#2e3b37] active:bg-[#ded5bf] disabled:opacity-50 transition-all duration-150 border border-[#E8E5DC] dark:border-[#2e3b37]',
  outline:
    'bg-white dark:bg-[#202A27] text-[#252923] dark:text-[#F7F4EC] border border-[#E8E5DC] dark:border-[#2e3b37] hover:bg-[#F7F4EC] dark:hover:bg-[#26322f] hover:border-[#C5A46D]/50 dark:hover:border-[#C5A46D]/50 shadow-xs disabled:opacity-50 transition-all duration-150',
  ghost:
    'bg-transparent text-[#777D78] dark:text-[#9ea5a1] hover:bg-[#F7F4EC] dark:hover:bg-[#26322f] hover:text-[#252923] dark:hover:text-white transition-all duration-150 disabled:opacity-40',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs hover:shadow transition-all duration-150 disabled:bg-rose-300',
  success:
    'bg-[#123C35] text-white hover:bg-[#0e2f29] active:bg-[#0a221e] shadow-xs hover:shadow transition-all duration-150 disabled:opacity-40',
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
