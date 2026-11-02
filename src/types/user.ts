export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: string | Date;
  updatedAt?: string | Date;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  isEmailVerified?: boolean;
}
