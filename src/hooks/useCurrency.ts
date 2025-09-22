import { useClinicSettings } from './useClinicSettings';
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol, formatCurrencyCompact } from '@/lib/currency';

/**
 * Global currency hook that reads from clinic settings
 * Provides standardized currency formatting throughout the app
 */
export const useCurrency = () => {
  const { getSettingValue } = useClinicSettings();
  
  // Get default currency from clinic settings (defaults to MYR)
  const defaultCurrency = getSettingValue('payment', 'default_currency', 'MYR');
  
  /**
   * Format currency using global currency setting
   * @param amount - Numeric amount to format
   * @param options - Optional formatting options
   * @returns Formatted currency string
   */
  const formatCurrency = (
    amount: number,
    options?: {
      currencyCode?: string;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      showSymbol?: boolean;
    }
  ): string => {
    const currencyCode = options?.currencyCode || defaultCurrency;
    return formatCurrencyUtil(amount, currencyCode, options);
  };

  /**
   * Format currency in compact form (with K/M suffixes)
   * @param amount - Numeric amount to format
   * @param currencyCode - Optional currency override
   * @returns Compact formatted currency
   */
  const formatCurrencyCompact = (amount: number, currencyCode?: string): string => {
    return formatCurrencyCompact(amount, currencyCode || defaultCurrency);
  };

  /**
   * Get currency symbol for the default currency
   * @param currencyCode - Optional currency override
   * @returns Currency symbol
   */
  const getCurrency = (currencyCode?: string): string => {
    return getCurrencySymbol(currencyCode || defaultCurrency);
  };

  return {
    formatCurrency,
    formatCurrencyCompact,
    getCurrency,
    defaultCurrency,
    currencySymbol: getCurrencySymbol(defaultCurrency)
  };
};