/**
 * Canonical Phone Normalization & Search Variant Utility
 * Normalizes phone numbers to standard E.164 format and generates variant permutations
 * for reliable uniqueness querying across Firestore collections (handling legacy un-normalized data).
 */

export function normalizePhoneNumber(
  rawPhone: string | null | undefined,
  defaultCountryCode = '+91'
): string {
  if (!rawPhone) return '';

  const trimmed = String(rawPhone).trim();
  if (!trimmed) return '';

  const cleanCC = defaultCountryCode.startsWith('+')
    ? defaultCountryCode
    : `+${defaultCountryCode}`;

  const hasPlus = trimmed.startsWith('+');
  let digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly) return '';

  // If input had a country code with a leading 0 before the 10-digit number (e.g. +91 0 7306420827 or 9107306420827)
  if (digitsOnly.length === 13 && digitsOnly.startsWith('910')) {
    digitsOnly = `91${digitsOnly.slice(3)}`;
  }

  // If already had leading +
  if (hasPlus) {
    if (digitsOnly.length === 10) {
      return `${cleanCC}${digitsOnly}`;
    }
    return `+${digitsOnly}`;
  }

  // If 10 digits (standard Indian mobile number)
  if (digitsOnly.length === 10) {
    return `${cleanCC}${digitsOnly}`;
  }

  // If 11 digits starting with 0 (e.g. 07306420827)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    const last10 = digitsOnly.slice(1);
    return `${cleanCC}${last10}`;
  }

  // If 12 digits starting with 91 (e.g. 917306420827)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  // Default fallback for international numbers without +
  if (digitsOnly.length > 10) {
    return `+${digitsOnly}`;
  }

  return `${cleanCC}${digitsOnly}`;
}

export function isValidPhoneNumber(rawPhone: string | null | undefined): boolean {
  if (!rawPhone) return false;
  const digits = String(rawPhone).replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export function lastTenDigits(rawPhone: string | null | undefined): string {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  return digits.slice(-10);
}
