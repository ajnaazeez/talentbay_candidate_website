import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  MessageSquare,
  FileCheck2,
  Calendar,
  Sparkles,
  GraduationCap,
  Target,
  Check,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ROUTES } from '@/utils/constants';
import type { NotificationModel, NotificationFilter, NotificationType } from '@/types/notification';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadNotificationsCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'chat':
        return {
          icon: <MessageSquare className="w-5 h-5" />,
          color: 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border-brand-200/60 dark:border-brand-800/40',
        };
      case 'application':
        return {
          icon: <FileCheck2 className="w-5 h-5" />,
          color: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/40',
        };
      case 'interview':
        return {
          icon: <Calendar className="w-5 h-5" />,
          color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40',
        };
      case 'assessment':
        return {
          icon: <GraduationCap className="w-5 h-5" />,
          color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/40',
        };
      case 'subscription':
        return {
          icon: <Sparkles className="w-5 h-5" />,
          color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
        };
      case 'job_match':
        return {
          icon: <Target className="w-5 h-5" />,
          color: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/40',
        };
      default:
        return {
          icon: <Bell className="w-5 h-5" />,
          color: 'bg-slate-100 dark:bg-[#1f293d] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#253248]',
        };
    }
  };

  const formatTimestamp = (ts: string | Date | any) => {
    if (!ts) return 'Recently';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return 'Recently';
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleNotificationClick = async (notif: NotificationModel) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }

    if (notif.chatId) {
      navigate(ROUTES.CHAT_ROOM.replace(':chatId', notif.chatId));
    } else if (notif.jobId) {
      navigate(ROUTES.JOB_DETAILS.replace(':jobId', notif.jobId));
    } else if (notif.type === 'assessment') {
      navigate(ROUTES.ASSESSMENTS);
    } else if (notif.type === 'subscription') {
      navigate(ROUTES.SUBSCRIPTION);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      await deleteNotification(id);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      await markAsRead(id);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter list
  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'Unread' && item.isRead) return false;
    if (activeFilter === 'Read' && !item.isRead) return false;
    if (selectedCategory !== 'all' && item.type !== selectedCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading Notifications..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-[#1f293d] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/40 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
            <Bell className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Notifications Center
              </h1>
              {unreadNotificationsCount > 0 && (
                <Badge variant="danger" size="sm">
                  {unreadNotificationsCount} Unread
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Live updates on recruiter messages, application reviews, interviews, and assessments.
            </p>
          </div>
        </div>

        {unreadNotificationsCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
            leftIcon={<CheckCheck className="w-4 h-4 text-brand-600" />}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs & Category Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1f293d]">
          <div className="flex">
            {(['All', 'Unread', 'Read'] as NotificationFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                  activeFilter === tab
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab}
                {tab === 'Unread' && unreadNotificationsCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            {filteredNotifications.length} notifications
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'chat', label: 'Messages' },
            { id: 'application', label: 'Applications' },
            { id: 'interview', label: 'Interviews' },
            { id: 'assessment', label: 'Assessments' },
            { id: 'subscription', label: 'Subscription' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#1f293d] hover:bg-slate-50 dark:hover:bg-[#1a2333]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-10 h-10 text-slate-400" />}
          title={
            activeFilter === 'Unread'
              ? 'All caught up!'
              : 'No notifications in this view'
          }
          description={
            activeFilter === 'Unread'
              ? 'You have no unread notifications. Check back later for updates from hiring leads.'
              : 'Notifications from recruiter direct messages, job applications, and tests will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const iconConfig = getNotificationIcon(notif.type);
            const isActing = actionLoadingId === notif.id;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group flex items-start gap-4 ${
                  notif.isRead
                    ? 'bg-white dark:bg-[#111827] border-slate-200/90 dark:border-[#1f293d] hover:border-slate-300 dark:hover:border-slate-700'
                    : 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900/60 shadow-xs'
                }`}
              >
                {/* Category Icon Badge */}
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconConfig.color}`}
                >
                  {iconConfig.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold truncate ${
                          notif.isRead
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">
                      {formatTimestamp(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Context chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400 font-medium">
                    <span className="capitalize">{notif.type}</span>
                    {notif.jobTitle && (
                      <>
                        <span>•</span>
                        <span className="text-slate-600 dark:text-slate-300 truncate max-w-xs font-semibold">
                          {notif.jobTitle}
                        </span>
                      </>
                    )}
                    {notif.actionStatus && notif.actionStatus !== 'Pending' && (
                      <>
                        <span>•</span>
                        <Badge variant="neutral" size="sm">
                          {notif.actionStatus}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkRead(e, notif.id)}
                      disabled={isActing}
                      className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f293d] transition"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, notif.id)}
                    disabled={isActing}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f293d] transition"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
