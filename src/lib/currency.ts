/**
 * Centralized currency utility functions
 */

// Currency symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  MYR: 'RM',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CNY: '¥',
  THB: '฿',
  IDR: 'Rp',
};

/**
 * Get currency symbol from currency code
 * @param currencyCode - ISO currency code (e.g., 'MYR', 'USD')
 * @returns Currency symbol (e.g., 'RM', '$')
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
};

/**
 * Format amount with currency symbol
 * @param amount - Numeric amount to format
 * @param currencyCode - ISO currency code (defaults to 'MYR')
 * @param options - Additional formatting options
 * @returns Formatted currency string (e.g., 'RM10.50')
 */
export const formatCurrency = (
  amount: number, 
  currencyCode: string = 'MYR',
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  } = {}
): string => {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true
  } = options;

  // Use Malaysian locale for proper number formatting
  const formattedNumber = new Intl.NumberFormat('ms-MY', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  if (!showSymbol) {
    return formattedNumber;
  }

  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${formattedNumber}`;
};

/**
 * Parse currency string to number
 * @param currencyString - String like 'RM10.50' or '10.50'
 * @returns Numeric value
 */
export const parseCurrency = (currencyString: string): number => {
  // Remove currency symbols and parse as float
  const numericString = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(numericString) || 0;
};

/**
 * Format currency for display in tables/compact views
 * @param amount - Numeric amount
 * @param currencyCode - ISO currency code
 * @returns Compact formatted currency
 */
export const formatCurrencyCompact = (amount: number, currencyCode: string = 'MYR'): string => {
  if (amount >= 1000000) {
    return formatCurrency(amount / 1000000, currencyCode, { maximumFractionDigits: 1 }) + 'M';
  }
  if (amount >= 1000) {
    return formatCurrency(amount / 1000, currencyCode, { maximumFractionDigits: 1 }) + 'K';
  }
  return formatCurrency(amount, currencyCode);
};