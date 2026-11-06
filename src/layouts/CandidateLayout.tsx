import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { CandidateSidebar } from './CandidateSidebar';
import { CandidateHeader } from './CandidateHeader';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { jobService } from '@/services/jobService';
import { cn } from '@/lib/utils';

export const CandidateLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { unreadNotificationsCount, unreadChatsCount } = useNotifications();
  const { candidate } = useAuth();
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  useEffect(() => {
    if (!candidate?.uid) {
      setPendingInvitesCount(0);
      return;
    }

    const unsub = jobService.subscribeToInvites(
      candidate.uid,
      (invites) => {
        setPendingInvitesCount(invites.length);
      },
      () => setPendingInvitesCount(0)
    );

    return () => unsub();
  }, [candidate?.uid]);

  return (
    <div className="min-h-screen w-full bg-[#F6FAFC] dark:bg-[#08141F] text-[#1F2D3D] dark:text-[#F6FAFC] flex flex-col overflow-x-hidden transition-colors">
      {/* Sidebar Navigation */}
      <CandidateSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadChatsCount={unreadChatsCount}
        pendingInvitesCount={pendingInvitesCount}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        )}
      >
        <CandidateHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadChatsCount={unreadChatsCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
