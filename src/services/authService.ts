import {
  type User,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  updateProfile,
  type Unsubscribe,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';
import { normalizePhoneNumber, lastTenDigits } from '@/utils/phone';
import { isValidEmail } from '@/utils/validators';
import type { CandidateModel, UserProfile } from '@/types';

export interface SignUpCandidateParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export const authService = {
  /**
   * Set up reCAPTCHA verifier for phone authentication.
   */
  setUpRecaptcha(containerId: string): RecaptchaVerifier {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('[authService] reCAPTCHA expired.');
      },
    });
  },

  /**
   * Subscribe to Firebase Auth state changes.
   */
  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
    return firebaseOnAuthStateChanged(auth, callback);
  },

  /**
   * Sign in with Email and Password. Verifies that user is a candidate.
   */
  async signInWithEmail(email: string, password: string): Promise<User> {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      const err = new Error('Please enter a valid email address.');
      (err as { code?: string }).code = 'auth/invalid-email';
      throw err;
    }

    const userCredential = await firebaseSignIn(auth, cleanEmail, password);
    const user = userCredential.user;

    await this.verifyCandidateRole(user);
    return user;
  },

  /**
   * Sign up candidate with Email and Password.
   * Creates records in /users/{uid} and /candidates/{uid} without altering protected fields.
   */
  async signUpWithEmail(params: SignUpCandidateParams): Promise<User> {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanFirstName = params.firstName.trim();
    const cleanLastName = params.lastName.trim();

    if (!isValidEmail(cleanEmail)) {
      const err = new Error('Please enter a valid email address.');
      (err as { code?: string }).code = 'auth/invalid-email';
      throw err;
    }

    if (params.password.length < 6) {
      const err = new Error('Password must be at least 6 characters.');
      (err as { code?: string }).code = 'auth/weak-password';
      throw err;
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      params.password
    );
    const user = userCredential.user;

    const fullName = `${cleanFirstName} ${cleanLastName}`.trim();
    if (fullName) {
      await updateProfile(user, { displayName: fullName }).catch(() => null);
    }

    const normalizedPhone = params.phoneNumber
      ? normalizePhoneNumber(params.phoneNumber)
      : undefined;

    const nowIso = new Date().toISOString();

    // 1. Initialize candidate profile in Firestore matching CandidateModel schema
    const candidateData: Partial<CandidateModel> = {
      uid: user.uid,
      email: cleanEmail,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phoneNumber: normalizedPhone,
      createdAt: nowIso,
      lastUpdated: nowIso,
      isPremium: false,
      subscriptionStatus: 'none',
      hasUsedTrial: false,
      skills: [],
      workExperience: [],
      education: [],
      projects: [],
      certifications: [],
      savedJobIds: [],
      isProfilePublic: true,
      accountStatus: 'Active',
      profileCompletionPercentage: 0.2, // Base initial info
    };

    await setDoc(doc(db, COLLECTIONS.CANDIDATES, user.uid), candidateData);

    // 2. Initialize user document with role: 'candidate'
    const userData: Record<string, any> = {
      role: 'candidate',
      email: cleanEmail,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      createdAt: serverTimestamp(),
    };

    if (normalizedPhone) {
      userData.phoneNumber = normalizedPhone;
      userData.phoneDigits = lastTenDigits(normalizedPhone);
    }

    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userData, { merge: true });

    // 3. Atomically trigger free trial initialization via Cloud Function
    try {
      const startTrialCallable = httpsCallable(functions, 'startCandidateFreeTrial');
      await startTrialCallable();
    } catch (trialErr) {
      console.warn('[authService] Notice: trial auto-trigger completed with fallback:', trialErr);
    }

    return user;
  },

  /**
   * Request Phone OTP verification.
   */
  async sendPhoneOtp(
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> {
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized) {
      const err = new Error('Please enter a valid phone number with country code.');
      (err as { code?: string }).code = 'auth/invalid-phone-number';
      throw err;
    }
    return signInWithPhoneNumber(auth, normalized, recaptchaVerifier);
  },

  /**
   * Verify Phone OTP and ensure candidate records exist in Firestore.
   */
  async verifyPhoneOtp(
    confirmationResult: ConfirmationResult,
    otp: string
  ): Promise<User> {
    const userCredential = await confirmationResult.confirm(otp);
    const user = userCredential.user;

    const [userDocSnap, candDocSnap] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.USERS, user.uid)),
      getDoc(doc(db, COLLECTIONS.CANDIDATES, user.uid)),
    ]);

    // Check if account already exists with a different role
    if (userDocSnap.exists()) {
      const role = userDocSnap.data()?.role;
      if (role && role !== 'candidate') {
        await auth.signOut();
        const err = new Error('This account is registered as a Recruiter.');
        (err as { code?: string }).code = 'wrong-role';
        throw err;
      }
    }

    const nowIso = new Date().toISOString();

    // If new phone user, ensure candidate documents are created
    if (!candDocSnap.exists()) {
      const candidateData: Partial<CandidateModel> = {
        uid: user.uid,
        email: user.email || '',
        phoneNumber: user.phoneNumber || undefined,
        createdAt: nowIso,
        lastUpdated: nowIso,
        isPremium: false,
        subscriptionStatus: 'none',
        hasUsedTrial: false,
        skills: [],
        workExperience: [],
        education: [],
        savedJobIds: [],
        isProfilePublic: true,
        accountStatus: 'Active',
      };
      await setDoc(doc(db, COLLECTIONS.CANDIDATES, user.uid), candidateData, { merge: true });
    }

    if (!userDocSnap.exists()) {
      const userData: Record<string, any> = {
        role: 'candidate',
        email: user.email || '',
        createdAt: serverTimestamp(),
      };
      if (user.phoneNumber) {
        userData.phoneNumber = user.phoneNumber;
        userData.phoneDigits = lastTenDigits(user.phoneNumber);
      }
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userData, { merge: true });

      // Trigger trial initialization
      try {
        const startTrialCallable = httpsCallable(functions, 'startCandidateFreeTrial');
        await startTrialCallable();
      } catch (trialErr) {
        console.warn('[authService] Trial callable notice:', trialErr);
      }
    }

    return user;
  },

  /**
   * Send Password Reset Email.
   */
  async sendPasswordReset(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      const err = new Error('Please enter a valid email address.');
      (err as { code?: string }).code = 'auth/invalid-email';
      throw err;
    }
    await firebaseSendPasswordReset(auth, cleanEmail);
  },

  /**
   * Send Email OTP via Cloud Function `sendEmailOtp`.
   */
  async sendEmailOtp(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    const callable = httpsCallable(functions, 'sendEmailOtp');
    await callable({ email: cleanEmail });
  },

  /**
   * Verify Email OTP via Cloud Function `verifyEmailOtp`.
   */
  async verifyEmailOtp(email: string, otp: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    const callable = httpsCallable(functions, 'verifyEmailOtp');
    const result = await callable({ email: cleanEmail, otp: otp.trim() });
    const data = result.data as { verified?: boolean };
    return data?.verified === true;
  },

  /**
   * Verify that the authenticated user has the 'candidate' role.
   * If user has 'recruiter' role, signs out immediately and throws role error.
   */
  async verifyCandidateRole(user: User): Promise<void> {
    const [userDocSnap, recruiterDocSnap] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.USERS, user.uid)),
      getDoc(doc(db, COLLECTIONS.RECRUITERS, user.uid)).catch(() => null),
    ]);

    if (recruiterDocSnap && recruiterDocSnap.exists()) {
      await auth.signOut();
      const err = new Error('This account is registered as a Recruiter. Please log in through the Recruiter Portal.');
      (err as { code?: string }).code = 'wrong-role';
      throw err;
    }

    if (userDocSnap.exists()) {
      const role = userDocSnap.data()?.role;
      if (role && role !== 'candidate') {
        await auth.signOut();
        const err = new Error('This account is registered as a Recruiter. Please log in through the Recruiter Portal.');
        (err as { code?: string }).code = 'wrong-role';
        throw err;
      }
    }
  },

  /**
   * Fetch candidate profile from /candidates/{uid}.
   */
  async getCandidateProfile(uid: string): Promise<CandidateModel | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.CANDIDATES, uid));
      if (snap.exists()) {
        return snap.data() as CandidateModel;
      }
      return null;
    } catch (err) {
      console.warn('[authService] Error fetching candidate profile:', err);
      return null;
    }
  },

  /**
   * Fetch user account data from /users/{uid}.
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      if (snap.exists()) {
        const data = snap.data();
        return {
          uid,
          email: data.email || '',
          role: data.role || 'candidate',
          createdAt: data.createdAt,
          displayName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          phoneNumber: data.phoneNumber,
        };
      }
      return null;
    } catch (err) {
      console.warn('[authService] Error fetching user profile:', err);
      return null;
    }
  },

  /**
   * Sign out current user.
   */
  async signOut(): Promise<void> {
    await auth.signOut();
  },
};
