/**
 * Centralized Form & Authentication Input Validators
 */

export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const trimmed = String(email).trim().toLowerCase();
  if (!trimmed || trimmed.length < 5 || trimmed.length > 254) return false;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) return false;

  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) return false;

  if (!domainPart.includes('.')) return false;
  if (domainPart.startsWith('.') || domainPart.endsWith('.') || domainPart.includes('..')) return false;

  const domainSegments = domainPart.split('.');
  const tld = domainSegments[domainSegments.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

  return true;
}

export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits || digits.length < 10 || digits.length > 15) return false;
  return true;
}
