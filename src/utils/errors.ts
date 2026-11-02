/**
 * Standardized User-Facing Authentication & Firebase Error Handler
 */

export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  let msg = '';
  let code = '';

  if (typeof error === 'string') {
    msg = error;
  } else if (error instanceof Error) {
    msg = error.message || '';
    code = (error as { code?: string }).code || '';
  } else if (typeof error === 'object' && error !== null) {
    msg = (error as { message?: string }).message || '';
    code = (error as { code?: string }).code || '';
  }

  const combined = `${code} ${msg}`.toLowerCase();

  // 1. Account collisions (Email)
  if (
    combined.includes('auth/email-already-in-use') ||
    combined.includes('auth/email-already-exists') ||
    combined.includes('email-already-in-use')
  ) {
    return 'An account already exists with this email address. Please sign in instead.';
  }

  // 2. Account collisions (Phone)
  if (
    combined.includes('auth/phone-number-already-exists') ||
    combined.includes('auth/phone-number-already-in-use') ||
    combined.includes('phone-number-already-exists') ||
    combined.includes('phone-number-already-in-use') ||
    combined.includes('auth/credential-already-in-use')
  ) {
    return 'An account already exists with this phone number. Please sign in instead.';
  }

  // 3. User Not Found & Invalid Credentials
  if (
    combined.includes('auth/user-not-found') ||
    combined.includes('user-not-found') ||
    combined.includes('auth/wrong-password') ||
    combined.includes('wrong-password') ||
    combined.includes('auth/invalid-credential') ||
    combined.includes('invalid-credential')
  ) {
    return 'Invalid email or password. Please verify your details and try again.';
  }

  // 4. Role Authorization Failures
  if (
    combined.includes('wrong-role') ||
    combined.includes('not-authorized-candidate') ||
    combined.includes('registered as a recruiter') ||
    combined.includes('user is invalid in this application')
  ) {
    return 'This account is registered as a Recruiter. Please log in through the TalentBay Recruiter Portal.';
  }

  // 5. Account Disabled
  if (combined.includes('auth/user-disabled') || combined.includes('user-disabled')) {
    return 'This account has been disabled. Please contact TalentBay support.';
  }

  // 6. Weak Password
  if (combined.includes('auth/weak-password') || combined.includes('weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }

  // 7. Invalid Email
  if (combined.includes('auth/invalid-email') || combined.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }

  // 8. Phone Number & OTP Verification
  if (combined.includes('auth/invalid-phone-number') || combined.includes('invalid-phone-number')) {
    return 'Please enter a valid 10-digit mobile number with country code.';
  }

  if (
    combined.includes('auth/invalid-verification-code') ||
    combined.includes('invalid-verification-code') ||
    combined.includes('auth/invalid-otp') ||
    combined.includes('invalid-otp')
  ) {
    return 'The OTP is incorrect. Please check the code and try again.';
  }

  if (
    combined.includes('auth/code-expired') ||
    combined.includes('code-expired') ||
    combined.includes('auth/session-expired') ||
    combined.includes('session-expired')
  ) {
    return 'This OTP has expired. Please request a new OTP.';
  }

  if (combined.includes('auth/captcha-check-failed') || combined.includes('captcha-check-failed')) {
    return 'reCAPTCHA verification failed. Please try again.';
  }

  // 9. Rate Limiting & Too Many Requests
  if (combined.includes('auth/too-many-requests') || combined.includes('too-many-requests')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }

  // 10. Network Failure
  if (
    combined.includes('auth/network-request-failed') ||
    combined.includes('network-request-failed') ||
    combined.includes('failed to fetch')
  ) {
    return 'Network error occurred. Please check your internet connection and try again.';
  }

  // 11. Clean default message
  if (msg && !msg.startsWith('Firebase:') && !msg.startsWith('auth/') && !msg.includes('Error (auth/')) {
    const cleaned = msg.replace(/^Error:\s*/i, '').trim();
    if (cleaned) return cleaned;
  }

  return 'An unexpected error occurred. Please try again.';
}
