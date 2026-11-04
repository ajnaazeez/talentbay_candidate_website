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
      <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#1f293d] px-4 sm:px-6 transition-colors">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Left section: mobile toggle and page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          {/* Middle: search input */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, skills, companies..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-100/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl border border-transparent focus:border-brand-500/50 focus:bg-white dark:focus:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-xs"
              />
            </form>
          </div>

          {/* Right section: theme toggle, action buttons, notifications, profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Find Jobs CTA */}
            <NavLink
              to={ROUTES.JOBS}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/60 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition shadow-xs"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Browse Jobs</span>
            </NavLink>

            {/* AI CV Quick Link */}
            <NavLink
              to={ROUTES.RESUME_BUILDER}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>AI Resume</span>
            </NavLink>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5" />
              )}
            </button>

            {/* Messages Icon */}
            <NavLink
              to={ROUTES.CHAT}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Messages"
            >
              <MessageSquare className="w-4.5 h-4.5" />
              {unreadChatsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
                </span>
              )}
            </NavLink>

            {/* Notifications Icon */}
            <NavLink
              to={ROUTES.NOTIFICATIONS}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </NavLink>

            {/* Candidate User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                {candidatePhotoUrl ? (
                  <img
                    src={candidatePhotoUrl}
                    alt={candidateName}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center">
                    {candidateName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                  {candidateName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] shadow-dropdown py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-[#1f293d]">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{candidateName}</p>
                      {candidateEmail && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{candidateEmail}</p>
                      )}
                      <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
                        Candidate Account
                      </span>
                    </div>

                    <div className="py-1">
                      <NavLink
                        to={ROUTES.PROFILE}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Profile</span>
                      </NavLink>
                      <NavLink
                        to={ROUTES.RESUME_BUILDER}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>AI Resume Builder</span>
                      </NavLink>
                      <NavLink
                        to={ROUTES.SUBSCRIPTION}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Premium Plans</span>
                      </NavLink>
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-[#1f293d]">
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
