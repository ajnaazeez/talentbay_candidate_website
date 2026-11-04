import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellOff,
  MessageSquare,
  Mail,
  Briefcase,
  CheckCheck,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/utils/constants';
import type { NotificationModel, NotificationFilter } from '@/types/notification';

const FILTERS: NotificationFilter[] = ['All', 'Unread', 'Read'];

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [selectedFilter, setSelectedFilter] = useState<NotificationFilter>('All');

  // Filter notifications (matching Flutter lines 82-87)
  const filteredNotifications = notifications.filter((notif) => {
    if (selectedFilter === 'Unread') return !notif.isRead;
    if (selectedFilter === 'Read') return notif.isRead;
    return true;
  });

  // Short time format matching timeago en_short (e.g. 2m, 1h, 3d)
  const formatShortTime = (ts: string | Date | any): string => {
    if (!ts) return 'just now';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return 'just now';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return `${Math.floor(diff / 604800)}w`;
  };

  const handleTileClick = async (notif: NotificationModel) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }

    if (notif.type === 'chat_message' || notif.chatId) {
      navigate(ROUTES.CHAT, { state: { activeChatId: notif.chatId } });
      return;
    }

    if (notif.type === 'job_invitation' || notif.title.toLowerCase().includes('invitation')) {
      navigate(ROUTES.INVITATIONS);
      return;
    }

    if (notif.jobId) {
      navigate(`/jobs/${notif.jobId}`);
      return;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-white font-futura">
          NOTIFICATIONS
        </h1>

        {notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition uppercase tracking-wider cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Chips (Matching Flutter _buildMinimalFilterChip) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((filter) => {
          const isSelected = selectedFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`px-5 py-2 text-xs font-bold tracking-wider uppercase border transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
              }`}
            >
              {filter.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" label="Loading notifications..." />
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* Empty State (Matching Flutter _buildEmptyState) */
        <div className="py-24 text-center space-y-4">
          <BellOff className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700" />
          <div className="text-base font-bold text-slate-800 dark:text-slate-200">
            No notifications yet
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you get matched or invited, they will show up here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.isRead;
            return (
              <div
                key={notif.id}
                onClick={() => handleTileClick(notif)}
                className={`py-4 px-3 flex items-start gap-4 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  isUnread ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''
                }`}
              >
                {/* 48x48 Circular Avatar / Icon */}
                <div
                  className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border ${
                    isUnread
                      ? 'border-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-slate-900'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  {notif.metadata?.companyLogoUrl ? (
                    <img
                      src={notif.metadata.companyLogoUrl}
                      alt="Company"
                      className="w-full h-full object-cover"
                    />
                  ) : notif.type === 'chat_message' ? (
                    <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  ) : notif.title.toLowerCase().includes('invitation') ? (
                    <Mail className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  ) : (
                    <Briefcase className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-sm truncate ${
                        isUnread
                          ? 'font-black text-slate-900 dark:text-white'
                          : 'font-semibold text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {notif.title}
                    </span>
                    <span
                      className={`text-xs whitespace-nowrap ${
                        isUnread
                          ? 'font-bold text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {formatShortTime(notif.createdAt)}
                    </span>
                  </div>

                  <p
                    className={`text-xs line-clamp-2 leading-relaxed ${
                      isUnread
                        ? 'text-slate-800 dark:text-slate-200 font-medium'
                        : 'text-slate-500 dark:text-slate-400 font-normal'
                    }`}
                  >
                    {notif.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
