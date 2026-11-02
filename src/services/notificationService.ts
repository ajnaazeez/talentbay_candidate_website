import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';
import type { NotificationModel, NotificationType } from '@/types/notification';
import { cryptoUtils } from '@/utils/cryptoUtils';

const parseTimestamp = (ts: unknown): string => {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts).toISOString();
  return new Date().toISOString();
};

export const notificationService = {
  /**
   * Realtime subscription to notifications for candidate from /notifications collection.
   * Matches Flutter NotificationRepository.getUserNotifications.
   */
  subscribeToCandidateNotifications(
    candidateId: string,
    onUpdate: (notifications: NotificationModel[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!candidateId) return () => {};

    const notifsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      notifsRef,
      where('userId', '==', candidateId)
    );

    return onSnapshot(
      q,
      async (snapshot) => {
        try {
          const notificationPromises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const rawMessage = data.message || data.body || data.content || '';
            const decryptedMessage = await cryptoUtils.decrypt(rawMessage);

            const status = String(data.status || 'Unread');
            const isRead = status.toLowerCase() === 'read' || data.isRead === true;

            const notif: NotificationModel = {
              id: docSnap.id,
              userId: data.userId || candidateId,
              title: data.title || 'TalentBay Update',
              message: decryptedMessage || rawMessage,
              jobId: data.jobId,
              status: isRead ? 'Read' : 'Unread',
              isRead,
              actionStatus: data.action_status || data.actionStatus || 'Pending',
              type: (data.type || 'general') as NotificationType,
              chatId: data.chatId || '',
              companyLogoUrl: data.companyLogoUrl || data.logoUrl || '',
              companyName: data.companyName,
              jobTitle: data.jobTitle,
              createdAt: parseTimestamp(data.createdAt || data.timestamp),
              metadata: data.metadata || {},
            };
            return notif;
          });

          const notifications = await Promise.all(notificationPromises);

          // Sort latest notifications first
          notifications.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          onUpdate(notifications);
        } catch (err: any) {
          console.error('[notificationService] subscribeToCandidateNotifications mapping error:', err);
          if (onError) onError(err);
        }
      },
      (error) => {
        console.error('[notificationService] subscribeToCandidateNotifications listener error:', error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Marks a single notification as read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!notificationId) return;
    try {
      const notifRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notifRef, {
        status: 'Read',
        isRead: true,
      });
    } catch (err) {
      console.error('[notificationService] markAsRead error:', err);
      throw err;
    }
  },

  /**
   * Marks all unread notifications for a candidate as read.
   */
  async markAllAsRead(candidateId: string): Promise<void> {
    if (!candidateId) return;
    try {
      const notifsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      const q = query(
        notifsRef,
        where('userId', '==', candidateId),
        where('status', '==', 'Unread')
      );

      const snap = await getDocs(q);
      if (snap.empty) return;

      const batch = writeBatch(db);
      snap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          status: 'Read',
          isRead: true,
        });
      });
      await batch.commit();
    } catch (err) {
      console.error('[notificationService] markAllAsRead error:', err);
      throw err;
    }
  },

  /**
   * Deletes a notification from Firestore.
   */
  async deleteNotification(notificationId: string): Promise<void> {
    if (!notificationId) return;
    try {
      const notifRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await deleteDoc(notifRef);
    } catch (err) {
      console.error('[notificationService] deleteNotification error:', err);
      throw err;
    }
  },
};
