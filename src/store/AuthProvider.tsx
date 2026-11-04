import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';
import { authService, type SignUpCandidateParams } from '@/services/authService';
import type { CandidateModel, UserProfile } from '@/types';
import { getFriendlyErrorMessage } from '@/utils/errors';
import { AuthContext } from './AuthContext';

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateModel | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async (uid: string) => {
    try {
      const [cand, usr] = await Promise.all([
        authService.getCandidateProfile(uid),
        authService.getUserProfile(uid),
      ]);
      setCandidateProfile(cand);
      setUserProfile(usr);
    } catch (err) {
      console.error('[AuthProvider] Error fetching profiles:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      await fetchProfiles(user.uid);
    }
  }, [user, fetchProfiles]);

  useEffect(() => {
    let unsubscribeCandidateSnapshot: (() => void) | null = null;

    const unsubscribeAuth = authService.onAuthStateChanged(async (firebaseUser) => {
      if (unsubscribeCandidateSnapshot) {
        unsubscribeCandidateSnapshot();
        unsubscribeCandidateSnapshot = null;
      }

      if (firebaseUser) {
        try {
          // Verify role is candidate
          await authService.verifyCandidateRole(firebaseUser);

          setUser(firebaseUser);
          await fetchProfiles(firebaseUser.uid);

          // Real-time listener for candidate document changes (profile updates, trial status, subscriptions)
          const candRef = doc(db, COLLECTIONS.CANDIDATES, firebaseUser.uid);
          unsubscribeCandidateSnapshot = onSnapshot(candRef, (snap) => {
            if (snap.exists()) {
              setCandidateProfile(snap.data() as CandidateModel);
            }
          });

          setError(null);
        } catch (roleErr) {
          console.warn('[AuthProvider] Role verification failed:', roleErr);
          setError(getFriendlyErrorMessage(roleErr));
          setUser(null);
          setCandidateProfile(null);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setCandidateProfile(null);
        setUserProfile(null);
      }

      setLoading(false);
      setInitialLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeCandidateSnapshot) {
        unsubscribeCandidateSnapshot();
      }
    };
  }, [fetchProfiles]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const signedInUser = await authService.signInWithEmail(email, password);
      setUser(signedInUser);
      await fetchProfiles(signedInUser.uid);
      return signedInUser;
    } catch (err) {
      const friendly = getFriendlyErrorMessage(err);
      setError(friendly);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProfiles]);

  const signUpWithEmail = useCallback(async (params: SignUpCandidateParams) => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await authService.signUpWithEmail(params);
      setUser(newUser);
      await fetchProfiles(newUser.uid);
      return newUser;
    } catch (err) {
      const friendly = getFriendlyErrorMessage(err);
      setError(friendly);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProfiles]);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await authService.sendPasswordReset(email);
    } catch (err) {
      const friendly = getFriendlyErrorMessage(err);
      setError(friendly);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setCandidateProfile(null);
      setUserProfile(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setLoading(true);
    try {
      await authService.deleteUserAccount();
      setUser(null);
      setCandidateProfile(null);
      setUserProfile(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const isCandidate = useMemo(() => {
    if (!user) return false;
    if (userProfile && userProfile.role !== 'candidate') return false;
    return true;
  }, [user, userProfile]);

  const contextValue = useMemo(() => ({
    user,
    candidateProfile,
    candidate: candidateProfile,
    userProfile,
    loading,
    initialLoading,
    error,
    isCandidate,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    signOut,
    deleteAccount,
    refreshProfile,
    refreshCandidate: refreshProfile,
  }), [
    user,
    candidateProfile,
    userProfile,
    loading,
    initialLoading,
    error,
    isCandidate,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    signOut,
    deleteAccount,
    refreshProfile,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
