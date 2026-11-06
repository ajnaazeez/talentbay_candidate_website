import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  iconBgColor?: string;
  iconColor?: string;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  iconBgColor = 'bg-[#123C35]/10 dark:bg-[#123C35]/30',
  iconColor = 'text-[#123C35] dark:text-[#C5A46D]',
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-5 rounded-2xl bg-white dark:bg-[#202A27] border border-[#E8E5DC] dark:border-[#2e3b37] shadow-card transition-all duration-200 flex flex-col justify-between',
        onClick && 'cursor-pointer hover:border-[#C5A46D]/60 dark:hover:border-[#C5A46D]/50 hover:shadow-card-hover group',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-[#777D78] dark:text-[#9ea5a1] uppercase tracking-wider">
          {title}
        </span>
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105',
            iconBgColor,
            iconColor
          )}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <span className="text-2xl sm:text-3xl font-bold text-[#252923] dark:text-[#F7F4EC] tracking-tight">
          {value}
        </span>

        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
              trend.isPositive !== false
                ? 'text-[#123C35] bg-[#123C35]/10 border border-[#123C35]/20 dark:bg-[#123C35]/30 dark:text-[#83bdb0] dark:border-[#123C35]/40'
                : 'text-rose-700 bg-rose-50 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60'
            )}
          >
            {trend.isPositive !== false ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {(subtitle || trend?.label) && (
        <p className="text-xs text-[#777D78] dark:text-[#9ea5a1] mt-2 font-medium">
          {subtitle || trend?.label}
        </p>
      )}
    </div>
  );
};
