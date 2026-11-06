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
    'bg-[#00BFA6] text-white hover:bg-[#00A892] active:bg-[#008C79] shadow-xs hover:shadow transition-all duration-150 disabled:opacity-40',
  secondary:
    'bg-[#E8F1F5] dark:bg-[#132B3E] text-[#1F2D3D] dark:text-[#F6FAFC] hover:bg-[#D8E4EA] dark:hover:bg-[#1F2D3D] active:bg-[#D5E5ED] disabled:opacity-50 transition-all duration-150',
  outline:
    'bg-white dark:bg-[#0E2233] text-[#1F2D3D] dark:text-[#F6FAFC] border border-[#D8E4EA] dark:border-[#1F2D3D] hover:bg-[#F6FAFC] dark:hover:bg-[#163248] hover:border-[#00BFA6]/40 dark:hover:border-[#00BFA6]/40 shadow-xs disabled:opacity-50 transition-all duration-150',
  ghost:
    'bg-transparent text-[#1F2D3D] dark:text-[#BACDD8] hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] hover:text-[#0E2233] dark:hover:text-white transition-all duration-150 disabled:opacity-40',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs hover:shadow transition-all duration-150 disabled:bg-rose-300',
  success:
    'bg-[#00BFA6] text-white hover:bg-[#00A892] active:bg-[#008C79] shadow-xs hover:shadow transition-all duration-150 disabled:opacity-40',
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
          'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/25 focus:ring-offset-1 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]',
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
