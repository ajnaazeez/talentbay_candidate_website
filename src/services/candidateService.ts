import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';
import type { CandidateModel } from '@/types';
import { calculateProfileCompletion } from '@/utils/profileCompletion';
import { lastTenDigits } from '@/utils/phone';

export const candidateService = {
  /**
   * Fetches candidate profile from /candidates/{uid}.
   */
  async getCandidate(uid: string): Promise<CandidateModel | null> {
    if (!uid) return null;
    const snap = await getDoc(doc(db, COLLECTIONS.CANDIDATES, uid));
    if (snap.exists()) {
      return snap.data() as CandidateModel;
    }
    return null;
  },

  /**
   * Updates candidate profile with strict preservation of server-managed billing fields.
   */
  async updateCandidate(
    candidateOrUid: CandidateModel | string,
    partialUpdate?: Partial<CandidateModel>
  ): Promise<CandidateModel | Partial<CandidateModel>> {
    let uid: string;
    let dataToMerge: Record<string, any>;

    if (typeof candidateOrUid === 'string') {
      uid = candidateOrUid;
      dataToMerge = { ...(partialUpdate || {}) };
    } else {
      uid = candidateOrUid.uid;
      const completion = calculateProfileCompletion(candidateOrUid);
      dataToMerge = {
        ...candidateOrUid,
        profileCompletionPercentage: completion.percentage,
      };
    }

    if (!uid) throw new Error('Missing candidate UID');

    dataToMerge.lastUpdated = new Date().toISOString();

    // Prepare payload - Strip server-only billing and subscription attributes
    delete dataToMerge.isPremium;
    delete dataToMerge.subscriptionExpiryDate;
    delete dataToMerge.subscriptionStatus;
    delete dataToMerge.hasUsedTrial;
    delete dataToMerge.trialStartDate;
    delete dataToMerge.trialExpiryDate;
    delete dataToMerge.subscriptionPlanId;
    delete dataToMerge.appleSubscriptionId;
    delete dataToMerge.razorpaySubscriptionId;
    delete dataToMerge.razorpayPaymentId;
    delete dataToMerge.razorpayOrderId;

    // 3. Update candidate document in Firestore
    await setDoc(doc(db, COLLECTIONS.CANDIDATES, uid), dataToMerge, { merge: true });

    // 4. Mirror fundamental identity fields to /users/{uid}
    const userUpdate: Record<string, any> = {};
    if (dataToMerge.firstName !== undefined) userUpdate.firstName = dataToMerge.firstName;
    if (dataToMerge.lastName !== undefined) userUpdate.lastName = dataToMerge.lastName;
    if (dataToMerge.photoUrl !== undefined) userUpdate.photoURL = dataToMerge.photoUrl;
    if (dataToMerge.phoneNumber) {
      userUpdate.phoneNumber = dataToMerge.phoneNumber;
      userUpdate.phoneDigits = lastTenDigits(dataToMerge.phoneNumber);
    }

    if (Object.keys(userUpdate).length > 0) {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), userUpdate).catch(() => null);
    }

    return dataToMerge as any;
  },

  /**
   * Uploads candidate resume (PDF, DOC, DOCX) to Firebase Storage under `resumes/{candidateId}/{fileName}`.
   */
  async uploadResume(candidateId: string, file: File): Promise<string> {
    if (!candidateId || !file) throw new Error('Invalid upload parameters');

    // Clean file name
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `resumes/${candidateId}/${timestamp}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);

    // Upload with content type metadata
    await uploadBytes(storageRef, file, {
      contentType: file.type || 'application/pdf',
    });

    const downloadUrl = await getDownloadURL(storageRef);

    // Update candidate profile with new resumeUrl
    await updateDoc(doc(db, COLLECTIONS.CANDIDATES, candidateId), {
      resumeUrl: downloadUrl,
      lastUpdated: new Date().toISOString(),
    });

    return downloadUrl;
  },

  /**
   * Removes current resume from candidate profile and optionally deletes from Storage.
   */
  async deleteResume(candidateId: string, resumeUrl?: string): Promise<void> {
    if (!candidateId) return;

    await updateDoc(doc(db, COLLECTIONS.CANDIDATES, candidateId), {
      resumeUrl: null,
      lastUpdated: new Date().toISOString(),
    });

    if (resumeUrl) {
      try {
        const storageRef = ref(storage, resumeUrl);
        await deleteObject(storageRef);
      } catch (err) {
        console.warn('[candidateService] Storage cleanup notice:', err);
      }
    }
  },

  /**
   * Uploads candidate profile photo to Firebase Storage.
   */
  async uploadProfilePhoto(candidateId: string, file: File): Promise<string> {
    if (!candidateId || !file) throw new Error('Invalid image upload parameters');

    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const storagePath = `profile_photos/${candidateId}/${timestamp}.${ext}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    });

    const downloadUrl = await getDownloadURL(storageRef);

    // Update candidate and user profile
    await updateDoc(doc(db, COLLECTIONS.CANDIDATES, candidateId), {
      photoUrl: downloadUrl,
      lastUpdated: new Date().toISOString(),
    });

    await updateDoc(doc(db, COLLECTIONS.USERS, candidateId), {
      photoURL: downloadUrl,
    }).catch(() => null);

    return downloadUrl;
  },

  /**
   * Removes candidate profile photo
   */
  async removeProfilePhoto(candidateId: string): Promise<void> {
    if (!candidateId) return;
    await updateDoc(doc(db, COLLECTIONS.CANDIDATES, candidateId), {
      photoUrl: null,
      lastUpdated: new Date().toISOString(),
    });
    await updateDoc(doc(db, COLLECTIONS.USERS, candidateId), {
      photoURL: null,
    }).catch(() => null);
  },
};

export const {
  getCandidate,
  updateCandidate,
  uploadResume,
  deleteResume,
  uploadProfilePhoto,
  removeProfilePhoto,
} = candidateService;
