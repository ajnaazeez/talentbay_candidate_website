const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
  SAR: 'SAR ',
  CAD: 'CA$',
  AUD: 'A$',
  SGD: 'SG$',
  MYR: 'RM ',
  QAR: 'QAR ',
  JPY: '¥',
};

export function getCurrencySymbol(currency: string = 'INR'): string {
  const code = (currency || 'INR').toUpperCase().trim();
  return CURRENCY_SYMBOLS[code] || `${code} `;
}

/**
 * Formats a salary range with currency and frequency.
 */
export function formatSalary(
  min?: number,
  max?: number,
  currency: string = 'INR',
  type: string = 'CTC'
): string {
  const code = (currency || 'INR').toUpperCase().trim();
  const symbol = getCurrencySymbol(code);

  const formatNumber = (num: number) => {
    if (code === 'INR') {
      if (num >= 10000000) {
        return `${(num / 10000000).toFixed(1)} Cr`;
      }
      if (num >= 100000) {
        return `${(num / 100000).toFixed(num % 100000 === 0 ? 0 : 1)} LPA`;
      }
    } else {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      }
      if (num >= 1000) {
        return `${(num / 1000).toFixed(0)}k`;
      }
    }
    return num.toLocaleString();
  };

  if (min !== undefined && max !== undefined) {
    if (min === max) return `${symbol}${formatNumber(min)} / ${type}`;
    return `${symbol}${formatNumber(min)} - ${formatNumber(max)} / ${type}`;
  }
  if (min !== undefined) return `${symbol}${formatNumber(min)}+ / ${type}`;
  if (max !== undefined) return `Up to ${symbol}${formatNumber(max)} / ${type}`;
  return 'Undisclosed';
}

/**
 * Formats date into a human readable "X time ago" string.
 */
export function formatTimeAgo(dateInput: any): string {
  if (!dateInput) return 'Recently';

  let date: Date;
  if (dateInput?.toDate && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return 'Recently';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}
