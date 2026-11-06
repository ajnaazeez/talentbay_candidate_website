import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  FileCheck2,
  FileText,
  GraduationCap,
  Target,
  Building2,
  MessageSquare,
  Bell,
  CreditCard,
  User,
  Settings,
  HelpCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/utils/constants';

interface CandidateSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  unreadNotificationsCount?: number;
  unreadChatsCount?: number;
  pendingInvitesCount?: number;
}

interface NavItem {
  title: string;
  to: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const CandidateSidebar: React.FC<CandidateSidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  unreadNotificationsCount = 0,
  unreadChatsCount = 0,
  pendingInvitesCount = 0,
}) => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { title: 'Overview', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
        { title: 'Browse Jobs', to: ROUTES.JOBS, icon: Briefcase },
        { title: 'Applications', to: ROUTES.APPLICATIONS, icon: FileCheck2 },
        {
          title: 'Invitations',
          to: ROUTES.INVITATIONS,
          icon: Mail,
          badge: pendingInvitesCount > 0 ? pendingInvitesCount : undefined,
        },
        { title: 'Saved Jobs', to: ROUTES.SAVED_JOBS, icon: Bookmark },
      ],
    },
    {
      title: 'Career & Skills',
      items: [
        { title: 'Assessments', to: ROUTES.ASSESSMENTS, icon: GraduationCap },
        { title: 'Career Readiness', to: ROUTES.CAREER_READINESS, icon: Target },
        { title: 'AI Resume Builder', to: ROUTES.RESUME_BUILDER, icon: FileText },
        { title: 'Top Companies', to: ROUTES.COMPANIES, icon: Building2 },
      ],
    },
    {
      title: 'Communication',
      items: [
        {
          title: 'Messages',
          to: ROUTES.CHAT,
          icon: MessageSquare,
          badge: unreadChatsCount > 0 ? unreadChatsCount : undefined,
        },
        {
          title: 'Notifications',
          to: ROUTES.NOTIFICATIONS,
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        { title: 'My Profile', to: ROUTES.PROFILE, icon: User },
        { title: 'Subscription', to: ROUTES.SUBSCRIPTION, icon: CreditCard },
        { title: 'Settings', to: ROUTES.SETTINGS, icon: Settings },
      ],
    },
    {
      title: 'Support & Info',
      items: [
        { title: 'Support', to: ROUTES.SUPPORT, icon: HelpCircle },
        { title: 'About', to: ROUTES.ABOUT, icon: Info },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container - Deep Navy Background & Slate Grey Border */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-[#0E2233] border-r border-[#1F2D3D] transition-all duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64 w-64'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#1F2D3D] bg-[#0E2233]">
          <NavLink
            to={ROUTES.DASHBOARD}
            className={cn(
              'flex items-center gap-3 group overflow-hidden',
              isCollapsed && 'justify-center w-full'
            )}
          >
            <img
              src="/candidate_logo.png"
              alt="TalentBay Candidate"
              className="w-8 h-8 rounded-lg object-contain shrink-0 shadow-xs group-hover:scale-105 transition-transform"
            />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                  TalentBay
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#00BFA6]/20 text-[#00BFA6] border border-[#00BFA6]/40">
                    Candidate
                  </span>
                </span>
                <span className="text-[10px] text-[#8CA6B7] font-medium">Career Workspace</span>
              </div>
            )}
          </NavLink>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-[#8CA6B7] hover:text-white p-1 rounded-lg hover:bg-[#132B3E] transition"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation items list */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5 scrollbar-thin scrollbar-thumb-[#1F2D3D]">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && !isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#7A95A8] mb-1.5">
                  {section.title}
                </p>
              )}
              {isCollapsed && section.title && (
                <div className="w-6 h-px bg-[#1F2D3D] mx-auto my-2" />
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isJobRelated =
                  item.to === ROUTES.JOBS &&
                  (location.pathname === ROUTES.SEARCH ||
                    location.pathname.startsWith(`${ROUTES.SEARCH}/`));
                const isActive =
                  location.pathname === item.to ||
                  (item.to !== ROUTES.DASHBOARD && location.pathname.startsWith(`${item.to}/`)) ||
                  isJobRelated;

                return (
                  <div
                    key={item.to}
                    className="relative"
                    onMouseEnter={() => isCollapsed && setHoveredItem(item.to)}
                    onMouseLeave={() => isCollapsed && setHoveredItem(null)}
                  >
                    <NavLink
                      to={item.to}
                      onClick={() => onClose?.()}
                      className={({ isActive: matchActive }) =>
                        cn(
                          'flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative',
                          isCollapsed ? 'justify-center px-2' : 'justify-between',
                          matchActive || isActive
                            ? 'bg-[#00BFA6]/15 text-white font-semibold border border-[#00BFA6]/40 shadow-xs'
                            : 'text-[#BACDD8] hover:text-white hover:bg-white/5'
                        )
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            isActive ? 'text-[#00BFA6]' : 'text-[#8CA6B7] group-hover:text-white'
                          )}
                        />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </div>

                      {!isCollapsed && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.badge !== undefined && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#132B3E] text-[#E8F1F5] border border-[#1F2D3D]">
                              {item.badge}
                            </span>
                          )}
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00BFA6] shadow-xs shadow-[#00BFA6]/60" />
                          )}
                        </div>
                      )}
                    </NavLink>

                    {/* Tooltip for collapsed sidebar */}
                    {isCollapsed && hoveredItem === item.to && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg bg-[#0E2233] border border-[#1F2D3D] text-[#F6FAFC] text-xs font-semibold whitespace-nowrap shadow-xl z-50">
                        {item.title}
                        {item.badge !== undefined && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded-full bg-[#132B3E] text-white font-bold border border-[#1F2D3D]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Collapse Toggle Button on Desktop */}
        {onToggleCollapse && (
          <div className="hidden lg:flex items-center justify-between p-3 border-t border-[#1F2D3D] bg-[#0E2233]">
            {!isCollapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[#00BFA6] animate-pulse" />
                <span className="text-xs text-[#8CA6B7] font-medium truncate">Candidate Hub</span>
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              className={cn(
                'p-1.5 rounded-lg text-[#8CA6B7] hover:text-white hover:bg-[#132B3E] transition flex items-center justify-center',
                isCollapsed && 'w-full'
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
