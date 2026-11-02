import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/utils/constants';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-sm">
        <Compass className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">404</h1>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Page Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
          The page you are looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
      </div>
      <NavLink to={ROUTES.DASHBOARD}>
        <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </NavLink>
    </div>
  );
};
