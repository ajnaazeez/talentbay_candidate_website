import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/utils/constants';

export const PublicRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, initialLoading } = useAuth();
  const location = useLocation();

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6FAFC] dark:bg-[#08141F]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.DASHBOARD;
    return <Navigate to={from} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
