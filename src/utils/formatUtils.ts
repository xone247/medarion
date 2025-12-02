/**
 * Utility functions for formatting data in the frontend
 * Handles null/undefined values gracefully
 */

/**
 * Safely parse JSON string, returning fallback if parsing fails
 */
export const safeJsonParse = <T = any>(json: string | null | undefined, fallback: T): T => {
  if (!json || typeof json !== 'string') {
    return fallback;
  }
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn('Failed to parse JSON:', json, error);
    return fallback;
  }
};

/**
 * Safely parse a date string, returning null if invalid
 */
export const safeDateParse = (date: string | null | undefined): Date | null => {
  if (!date) return null;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Format a date safely, returning fallback if date is invalid
 */
export const formatDate = (
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' },
  fallback: string = 'N/A'
): string => {
  const parsed = typeof date === 'string' ? safeDateParse(date) : (date instanceof Date && !isNaN(date.getTime()) ? date : null);
  if (!parsed) return fallback;
  try {
    return parsed.toLocaleDateString('en-US', options);
  } catch (error) {
    console.warn('Failed to format date:', date, error);
    return fallback;
  }
};

/**
 * Format currency amount in millions, handling zero/null values
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  options: {
    showZero?: boolean;
    fallback?: string;
    decimals?: number;
  } = {}
): string => {
  const { showZero = true, fallback = 'N/A', decimals = 1 } = options;
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  
  if (isNaN(num)) return fallback;
  if (num === 0 && !showZero) return fallback;
  
  return `$${(num / 1000000).toFixed(decimals)}M`;
};

/**
 * Format a number with locale string
 */
export const formatNumber = (
  num: number | string | null | undefined,
  fallback: string = '0'
): string => {
  const parsed = typeof num === 'string' ? parseFloat(num) : (num || 0);
  if (isNaN(parsed)) return fallback;
  return parsed.toLocaleString('en-US');
};

/**
 * Safely get a value from an object with fallback
 */
export const safeGet = <T>(
  obj: any,
  path: string,
  fallback: T
): T => {
  try {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value == null) return fallback;
      value = value[key];
    }
    return value != null ? value : fallback;
  } catch (error) {
    return fallback;
  }
};

