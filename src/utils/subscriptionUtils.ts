import type { CandidateModel } from '@/types/candidate';

/**
 * Returns true if the candidate holds an active, verified PAID Premium subscription.
 * Matches Flutter candidate_model.dart lines 84-93:
 *
 * bool get hasActivePaidPremium {
 *   if (!isPremium) return false;
 *   if (subscriptionStatus == 'trial') return false;
 *   if (subscriptionStatus == 'expired' || subscriptionStatus == 'none') return false;
 *   if (subscriptionExpiryDate != null && subscriptionExpiryDate!.isBefore(DateTime.now())) {
 *     return false;
 *   }
 *   return true;
 * }
 *
 * Free accounts, 7-day free trials, and expired subscriptions return false.
 */
export function hasActivePaidPremium(candidate: CandidateModel | null | undefined): boolean {
  if (!candidate || !candidate.isPremium) return false;
  if (candidate.subscriptionStatus === 'trial') return false;
  if (candidate.subscriptionStatus === 'expired' || candidate.subscriptionStatus === 'none') return false;

  if (candidate.subscriptionExpiryDate) {
    const expiry = new Date(candidate.subscriptionExpiryDate);
    if (!isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return false;
    }
  }

  return true;
}

/**
 * Returns true if candidate has access to Skill Assessments & Career Readiness.
 * In Flutter & Firebase Cloud Functions (entitlement.ts):
 * Both Paid Premium subscribers and active 7-day trial users are entitled.
 */
export function hasAssessmentAccess(candidate: CandidateModel | null | undefined): boolean {
  if (!candidate) return false;
  if (!candidate.isPremium) return false;
  if (candidate.subscriptionStatus === 'expired' || candidate.subscriptionStatus === 'none') return false;

  if (candidate.subscriptionStatus === 'trial' && candidate.trialExpiryDate) {
    const expiry = new Date(candidate.trialExpiryDate);
    if (!isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return false;
    }
  }

  if (candidate.subscriptionExpiryDate) {
    const expiry = new Date(candidate.subscriptionExpiryDate);
    if (!isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates remaining trial days for trial candidates.
 */
export function getTrialDaysRemaining(candidate: CandidateModel | null | undefined): number {
  if (!candidate || candidate.subscriptionStatus !== 'trial' || !candidate.trialExpiryDate) {
    return 0;
  }
  const expiry = new Date(candidate.trialExpiryDate);
  if (isNaN(expiry.getTime())) return 0;
  const diffMs = expiry.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

