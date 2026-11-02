export type NotificationType =
  | 'application'
  | 'chat'
  | 'interview'
  | 'subscription'
  | 'assessment'
  | 'general'
  | 'job_match';

export type NotificationFilter = 'All' | 'Unread' | 'Read';

export interface NotificationModel {
  id: string;
  userId: string;
  title: string;
  message: string;
  jobId?: string;
  status: 'Unread' | 'Read' | string;
  isRead: boolean;
  actionStatus?: string;
  type: NotificationType;
  chatId?: string;
  companyLogoUrl?: string;
  companyName?: string;
  jobTitle?: string;
  createdAt: string | Date | any;
  metadata?: Record<string, any>;
}
