import { createContext, useContext } from 'react';
import type { NotificationModel } from '@/types/notification';

export interface NotificationContextType {
  notifications: NotificationModel[];
  unreadNotificationsCount: number;
  unreadChatsCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
