import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';
import type { ChatModel, MessageModel } from '@/types/chat';
import { cryptoUtils } from '@/utils/cryptoUtils';

// In-memory caches to prevent redundant Firestore lookups
const recruiterCache = new Map<string, { name: string; photoUrl?: string; designation?: string; companyId?: string }>();
const companyCache = new Map<string, { name: string; logoUrl?: string }>();
const jobCache = new Map<string, { roleName: string; location?: string; companyId?: string }>();

async function getRecruiterDetails(recruiterId: string) {
  if (!recruiterId) return null;
  if (recruiterCache.has(recruiterId)) {
    return recruiterCache.get(recruiterId)!;
  }
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.RECRUITERS, recruiterId));
    if (snap.exists()) {
      const data = snap.data();
      const details = {
        name: data.fullName || data.name || data.displayName || 'Recruiter',
        photoUrl: data.profileImageUrl || data.photoURL || data.avatarUrl,
        designation: data.designation || 'Hiring Manager',
        companyId: data.companyId || data.company_id,
      };
      recruiterCache.set(recruiterId, details);
      return details;
    }
  } catch (err) {
    console.warn(`[chatService] Could not fetch recruiter ${recruiterId}:`, err);
  }
  return null;
}

async function getCompanyDetails(companyId: string) {
  if (!companyId) return null;
  if (companyCache.has(companyId)) {
    return companyCache.get(companyId)!;
  }
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.COMPANIES, companyId));
    if (snap.exists()) {
      const data = snap.data();
      const profile = data.profile || {};
      const details = {
        name: profile.companyName || data.companyName || 'TalentBay Partner',
        logoUrl: profile.logoUrl || data.logoUrl || data.companyLogoUrl,
      };
      companyCache.set(companyId, details);
      return details;
    }
  } catch (err) {
    console.warn(`[chatService] Could not fetch company ${companyId}:`, err);
  }
  return null;
}

async function getJobDetails(jobId: string) {
  if (!jobId) return null;
  if (jobCache.has(jobId)) {
    return jobCache.get(jobId)!;
  }
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.JOBS, jobId));
    if (snap.exists()) {
      const data = snap.data();
      const details = {
        roleName: data.roleName || data.title || data.jobTitle || 'Role Opening',
        location: data.jobLocation?.city ? `${data.jobLocation.city}, ${data.jobLocation.state}` : data.location,
        companyId: data.companyId,
      };
      jobCache.set(jobId, details);
      return details;
    }
  } catch (err) {
    console.warn(`[chatService] Could not fetch job ${jobId}:`, err);
  }
  return null;
}

const parseTimestamp = (ts: unknown): string => {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts).toISOString();
  return new Date().toISOString();
};

export const chatService = {
  /**
   * Realtime subscription to conversations where candidate is a participant.
   * Decrypts lastMessage and enriches recruiter/company metadata.
   */
  subscribeToCandidateChats(
    candidateId: string,
    onUpdate: (chats: ChatModel[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!candidateId) return () => {};

    const chatsRef = collection(db, COLLECTIONS.CHATS);
    const q = query(
      chatsRef,
      where('participantIds', 'array-contains', candidateId)
    );

    return onSnapshot(
      q,
      async (snapshot) => {
        try {
          const chatPromises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const recruiterId = data.recruiterId || (data.participantIds || []).find((id: string) => id !== candidateId) || '';
            const jobId = data.jobId || '';

            // Decrypt last message
            let decryptedLastMessage = '';
            if (data.lastMessage) {
              decryptedLastMessage = await cryptoUtils.decrypt(data.lastMessage);
            }

            // Enrich recruiter and job/company info
            const [recruiter, job] = await Promise.all([
              getRecruiterDetails(recruiterId),
              getJobDetails(jobId),
            ]);

            const companyId = job?.companyId || recruiter?.companyId || '';
            const company = companyId ? await getCompanyDetails(companyId) : null;

            const unreadCount = typeof data.unreadCountCandidate === 'number'
              ? data.unreadCountCandidate
              : (typeof data.unreadCount === 'number' ? data.unreadCount : 0);

            const chatItem: ChatModel = {
              id: docSnap.id,
              jobId,
              candidateId: data.candidateId || candidateId,
              recruiterId,
              lastMessage: data.lastMessage || '',
              lastMessageTime: parseTimestamp(data.lastMessageTime),
              participantIds: Array.isArray(data.participantIds) ? data.participantIds : [candidateId, recruiterId],
              unreadCountCandidate: unreadCount,
              unreadCount,
              decryptedLastMessage,
              recruiterName: recruiter?.name || 'Hiring Lead',
              recruiterPhotoUrl: recruiter?.photoUrl,
              recruiterDesignation: recruiter?.designation,
              companyId,
              companyName: company?.name || 'TalentBay Partner',
              companyLogoUrl: company?.logoUrl,
              jobRole: job?.roleName,
              jobLocation: job?.location,
            };

            return chatItem;
          });

          const chats = await Promise.all(chatPromises);

          // Sort latest conversation first
          chats.sort(
            (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
          );

          onUpdate(chats);
        } catch (err: any) {
          console.error('[chatService] subscribeToCandidateChats mapping error:', err);
          if (onError) onError(err);
        }
      },
      (error) => {
        console.error('[chatService] subscribeToCandidateChats listener error:', error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Realtime subscription to messages within a conversation.
   * Interoperable with AES-CTR (PKCS7 padded) encryption.
   */
  subscribeToMessages(
    chatId: string,
    onUpdate: (messages: MessageModel[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!chatId) return () => {};

    const messagesRef = collection(db, COLLECTIONS.CHATS, chatId, COLLECTIONS.MESSAGES);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(
      q,
      async (snapshot) => {
        try {
          const messagePromises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const rawContent = data.content || '';
            const decryptedContent = await cryptoUtils.decrypt(rawContent);

            const msg: MessageModel = {
              id: docSnap.id,
              senderId: data.senderId,
              content: rawContent,
              decryptedContent: decryptedContent || rawContent,
              timestamp: parseTimestamp(data.timestamp),
              isRead: Boolean(data.isRead),
              isEdited: Boolean(data.isEdited),
            };
            return msg;
          });

          const messages = await Promise.all(messagePromises);
          onUpdate(messages);
        } catch (err: any) {
          console.error('[chatService] subscribeToMessages mapping error:', err);
          if (onError) onError(err);
        }
      },
      (error) => {
        console.error('[chatService] subscribeToMessages listener error:', error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Encrypts and sends a message to the conversation subcollection.
   */
  async sendMessage(params: {
    chatId: string;
    senderId: string;
    content: string;
  }): Promise<void> {
    const { chatId, senderId, content } = params;
    const trimmed = content.trim();
    if (!trimmed || !chatId || !senderId) return;

    // Encrypt message content with AES-CTR
    const encryptedContent = await cryptoUtils.encrypt(trimmed);

    // 1. Add message to /chats/{chatId}/messages
    const messagesRef = collection(db, COLLECTIONS.CHATS, chatId, COLLECTIONS.MESSAGES);
    await addDoc(messagesRef, {
      senderId,
      content: encryptedContent,
      timestamp: serverTimestamp(),
      isRead: false,
    });

    // 2. Update /chats/{chatId} lastMessage preview & increment recruiter unread count
    const chatDocRef = doc(db, COLLECTIONS.CHATS, chatId);
    await updateDoc(chatDocRef, {
      lastMessage: encryptedContent,
      lastMessageTime: serverTimestamp(),
      unreadCountRecruiter: increment(1),
    });
  },

  /**
   * Marks unread messages in a conversation as read.
   */
  async markAsRead(chatId: string, candidateId: string): Promise<void> {
    if (!chatId || !candidateId) return;

    try {
      const messagesRef = collection(db, COLLECTIONS.CHATS, chatId, COLLECTIONS.MESSAGES);
      const snap = await getDocs(
        query(messagesRef, where('isRead', '==', false))
      );

      if (!snap.empty) {
        const batch = writeBatch(db);
        let count = 0;
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.senderId !== candidateId) {
            batch.update(docSnap.ref, { isRead: true });
            count++;
          }
        });
        if (count > 0) {
          await batch.commit();
        }
      }

      // Reset candidate's unread counter on the chat document
      const chatDocRef = doc(db, COLLECTIONS.CHATS, chatId);
      await updateDoc(chatDocRef, {
        unreadCountCandidate: 0,
        unreadCount: 0,
      }).catch(() => null);
    } catch (err) {
      console.warn('[chatService] markAsRead error:', err);
    }
  },

  /**
   * Retrieves or creates a chat conversation between candidate and recruiter.
   */
  async getOrCreateChat(params: {
    jobId: string;
    candidateId: string;
    recruiterId: string;
  }): Promise<string> {
    const { jobId, candidateId, recruiterId } = params;
    const chatsRef = collection(db, COLLECTIONS.CHATS);

    const q = query(
      chatsRef,
      where('jobId', '==', jobId),
      where('candidateId', '==', candidateId),
      where('recruiterId', '==', recruiterId)
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].id;
    }

    const docRef = await addDoc(chatsRef, {
      jobId,
      candidateId,
      recruiterId,
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      participantIds: [candidateId, recruiterId],
      unreadCountCandidate: 0,
      unreadCountRecruiter: 0,
    });

    return docRef.id;
  },

  /**
   * Edit a message sent by the user, encrypting the new text and marking isEdited: true.
   */
  async editMessage(chatId: string, messageId: string, newContent: string): Promise<void> {
    const trimmed = newContent.trim();
    if (!trimmed || !chatId || !messageId) return;

    const encryptedContent = await cryptoUtils.encrypt(trimmed);
    const msgRef = doc(db, COLLECTIONS.CHATS, chatId, COLLECTIONS.MESSAGES, messageId);
    await updateDoc(msgRef, {
      content: encryptedContent,
      isEdited: true,
    });
  },

  /**
   * Delete a message from the conversation subcollection.
   */
  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    if (!chatId || !messageId) return;
    const msgRef = doc(db, COLLECTIONS.CHATS, chatId, COLLECTIONS.MESSAGES, messageId);
    await deleteDoc(msgRef);
  },
};
