import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notificationService';
import { chatService } from '@/services/chatService';
import { NotificationContext } from './NotificationContext';
import type { NotificationModel } from '@/types/notification';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      setUnreadChatsCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Subscribe to realtime notifications
    const unsubNotifs = notificationService.subscribeToCandidateNotifications(
      user.uid,
      (list) => {
        setNotifications(list);
        const unread = list.filter((n) => !n.isRead).length;
        setUnreadNotificationsCount(unread);
        setLoading(false);
      },
      (err) => {
        console.warn('[NotificationProvider] Notifs listener error:', err);
        setLoading(false);
      }
    );

    // 2. Subscribe to realtime chats to aggregate unread chats count
    const unsubChats = chatService.subscribeToCandidateChats(
      user.uid,
      (chats) => {
        const totalUnreadChats = chats.reduce(
          (acc, c) => acc + (c.unreadCountCandidate || c.unreadCount || 0),
          0
        );
        setUnreadChatsCount(totalUnreadChats);
      },
      (err) => {
        console.warn('[NotificationProvider] Chats listener error:', err);
      }
    );

    return () => {
      unsubNotifs();
      unsubChats();
    };
  }, [user?.uid]);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, status: 'Read' } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationProvider] markAsRead error:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    try {
      await notificationService.markAllAsRead(user.uid);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, status: 'Read' }))
      );
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error('[NotificationProvider] markAllAsRead error:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadNotificationsCount((prev) =>
        notifications.find((n) => n.id === id && !n.isRead) ? Math.max(0, prev - 1) : prev
      );
    } catch (err) {
      console.error('[NotificationProvider] deleteNotification error:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadNotificationsCount,
        unreadChatsCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
