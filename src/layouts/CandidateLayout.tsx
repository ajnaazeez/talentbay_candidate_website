import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CandidateSidebar } from './CandidateSidebar';
import { CandidateHeader } from './CandidateHeader';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

export const CandidateLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { unreadNotificationsCount, unreadChatsCount } = useNotifications();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Sidebar Navigation */}
      <CandidateSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadChatsCount={unreadChatsCount}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        )}
      >
        <CandidateHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadChatsCount={unreadChatsCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
