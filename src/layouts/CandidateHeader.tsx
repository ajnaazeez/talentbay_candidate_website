import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  MessageSquare,
  LogOut,
  User,
  FileText,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  Briefcase,
} from 'lucide-react';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';

interface CandidateHeaderProps {
  onOpenSidebar: () => void;
  unreadNotificationsCount?: number;
  unreadChatsCount?: number;
}

export const CandidateHeader: React.FC<CandidateHeaderProps> = ({
  onOpenSidebar,
  unreadNotificationsCount = 0,
  unreadChatsCount = 0,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, candidateProfile, signOut } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.LOGIN);
  };

  const candidateName = candidateProfile?.firstName
    ? `${candidateProfile.firstName} ${candidateProfile.lastName || ''}`.trim()
    : user?.displayName || user?.email?.split('@')[0] || 'Candidate';
  const candidateEmail = candidateProfile?.email || user?.email || '';
  const candidatePhotoUrl = candidateProfile?.photoUrl || user?.photoURL || undefined;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(ROUTES.SEARCH);
    }
  };

  // Derive current section name from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith(ROUTES.RESUME_BUILDER)) return 'AI Resume Builder';
    if (path.startsWith(ROUTES.PROFILE_EDIT)) return 'Edit Profile';
    if (path.startsWith(ROUTES.PROFILE)) return 'My Profile';
    if (path.startsWith(ROUTES.SAVED_JOBS)) return 'Saved Jobs & Wishlist';
    if (path.startsWith(ROUTES.APPLICATIONS)) return 'Job Applications';
    if (path.startsWith(ROUTES.CAREER_READINESS)) return 'Career Readiness';
    if (path.startsWith(ROUTES.ASSESSMENTS)) return 'Skill Assessments';
    if (path.startsWith(ROUTES.COMPANIES)) return 'Explore Companies';
    if (path.startsWith(ROUTES.SEARCH)) return 'Search Jobs';
    if (path.startsWith(ROUTES.JOBS)) return 'Find Jobs';
    if (path.startsWith(ROUTES.CHAT)) return 'Messages & Chat';
    if (path.startsWith(ROUTES.NOTIFICATIONS)) return 'Notifications';
    if (path.startsWith(ROUTES.SUBSCRIPTION)) return 'Premium Plans';
    if (path.startsWith(ROUTES.SETTINGS)) return 'Account Settings';
    if (path.startsWith(ROUTES.SUPPORT)) return 'Help & Support';
    if (path.startsWith(ROUTES.ABOUT)) return 'About TalentBay';
    return 'Candidate Hub';
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0E2233]/95 backdrop-blur-md border-b border-[#D8E4EA] dark:border-[#1F2D3D] px-4 sm:px-6 transition-colors">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Left section: mobile toggle and page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenSidebar}
              className="lg:hidden p-2 rounded-xl text-[#1F2D3D] dark:text-[#BACDD8] hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] transition"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#1F2D3D] dark:text-[#F6FAFC] truncate tracking-tight">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          {/* Middle: search input */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8CA6B7]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, skills, companies..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F6FAFC] dark:bg-[#0A1A27] text-[#1F2D3D] dark:text-[#F6FAFC] placeholder:text-[#8CA6B7] rounded-xl border border-[#D8E4EA] dark:border-[#1F2D3D] focus:border-[#00BFA6] dark:focus:border-[#00BFA6] focus:bg-white dark:focus:bg-[#0E2233] focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/20 transition-all shadow-xs"
              />
            </form>
          </div>

          {/* Right section: theme toggle, action buttons, notifications, profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Find Jobs CTA */}
            <NavLink
              to={ROUTES.JOBS}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#00BFA6] text-white hover:bg-[#00A892] transition shadow-xs"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Browse Jobs</span>
            </NavLink>

            {/* AI CV Quick Link */}
            <NavLink
              to={ROUTES.RESUME_BUILDER}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#00BFA6]/10 text-[#008C79] dark:text-[#00BFA6] border border-[#00BFA6]/30 hover:bg-[#00BFA6]/20 transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00BFA6]" />
              <span>AI Resume</span>
            </NavLink>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[#1F2D3D] dark:text-[#BACDD8] hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] transition"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-[#00BFA6]" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-[#1F2D3D]" />
              )}
            </button>

            {/* Messages Icon */}
            <NavLink
              to={ROUTES.CHAT}
              className="relative p-2 rounded-xl text-[#1F2D3D] dark:text-[#BACDD8] hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] transition"
              title="Messages"
            >
              <MessageSquare className="w-4.5 h-4.5" />
              {unreadChatsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#00BFA6] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
                </span>
              )}
            </NavLink>

            {/* Notifications Icon */}
            <NavLink
              to={ROUTES.NOTIFICATIONS}
              className="relative p-2 rounded-xl text-[#1F2D3D] dark:text-[#BACDD8] hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] transition"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#00BFA6] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </NavLink>

            {/* Candidate User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] transition border border-transparent hover:border-[#D8E4EA] dark:hover:border-[#1F2D3D]"
              >
                {candidatePhotoUrl ? (
                  <img
                    src={candidatePhotoUrl}
                    alt={candidateName}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#D8E4EA] dark:ring-[#1F2D3D]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#E8F1F5] dark:bg-[#132B3E] text-[#1F2D3D] dark:text-[#F6FAFC] font-bold text-xs flex items-center justify-center">
                    {candidateName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline-block text-xs font-semibold text-[#1F2D3D] dark:text-[#F6FAFC] max-w-[120px] truncate">
                  {candidateName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8CA6B7]" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-dropdown py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-[#D8E4EA] dark:border-[#1F2D3D]">
                      <p className="font-bold text-[#1F2D3D] dark:text-[#F6FAFC] truncate">{candidateName}</p>
                      {candidateEmail && (
                        <p className="text-[11px] text-[#6B8699] dark:text-[#8CA6B7] truncate">{candidateEmail}</p>
                      )}
                      <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00BFA6]/15 text-[#008C79] dark:text-[#00BFA6] border border-[#00BFA6]/30">
                        Candidate Account
                      </span>
                    </div>

                    <div className="py-1">
                      <NavLink
                        to={ROUTES.PROFILE}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#1F2D3D] dark:text-[#BACDD8] hover:bg-[#E8F1F5] dark:hover:bg-[#163248] transition"
                      >
                        <User className="w-4 h-4 text-[#8CA6B7]" />
                        <span>My Profile</span>
                      </NavLink>
                      <NavLink
                        to={ROUTES.RESUME_BUILDER}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#1F2D3D] dark:text-[#BACDD8] hover:bg-[#E8F1F5] dark:hover:bg-[#163248] transition"
                      >
                        <FileText className="w-4 h-4 text-[#8CA6B7]" />
                        <span>AI Resume Builder</span>
                      </NavLink>
                      <NavLink
                        to={ROUTES.SUBSCRIPTION}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#1F2D3D] dark:text-[#BACDD8] hover:bg-[#E8F1F5] dark:hover:bg-[#163248] transition"
                      >
                        <Sparkles className="w-4 h-4 text-[#00BFA6]" />
                        <span>Premium Plans</span>
                      </NavLink>
                    </div>

                    <div className="pt-1 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
