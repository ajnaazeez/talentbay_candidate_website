import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import type { CandidateModel, UserProfile } from '@/types';
import type { SignUpCandidateParams } from '@/services/authService';

export interface AuthContextType {
  user: User | null;
  candidateProfile: CandidateModel | null;
  candidate: CandidateModel | null; // Convenient alias
  userProfile: UserProfile | null;
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  isCandidate: boolean;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (params: SignUpCandidateParams) => Promise<User>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshCandidate: () => Promise<void>; // Convenient alias
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
