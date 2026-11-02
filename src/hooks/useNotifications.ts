import { useNotificationContext } from '@/store/NotificationContext';

export function useNotifications() {
  return useNotificationContext();
}
