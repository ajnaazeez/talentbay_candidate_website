export interface MessageModel {
  id: string;
  senderId: string;
  content: string; // Stored encrypted in Firestore
  timestamp: string | Date | any;
  isRead: boolean;
  isEdited?: boolean;
  decryptedContent?: string;
}

export interface ChatModel {
  id: string;
  jobId: string;
  candidateId: string;
  recruiterId: string;
  lastMessage: string; // Stored encrypted in Firestore
  lastMessageTime: string | Date | any;
  participantIds: string[];
  unreadCountCandidate?: number;
  unreadCountRecruiter?: number;
  unreadCount?: number;
  decryptedLastMessage?: string;
  recruiterName?: string;
  recruiterPhotoUrl?: string;
  recruiterDesignation?: string;
  companyId?: string;
  companyName?: string;
  companyLogoUrl?: string;
  jobRole?: string;
  jobLocation?: string;
}
