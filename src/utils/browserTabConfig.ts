/**
 * Browser Tab Management Configuration
 * 
 * Configure the maximum number of tabs and auto-close delay
 * to prevent excessive RAM usage.
 */

export interface BrowserTabConfig {
  maxTabs: number;
  autoCloseDelay: number; // in milliseconds
  cleanupInterval: number; // in milliseconds
}

/**
 * Default configuration
 * - Max 3 tabs open at once
 * - Auto-close after 5 seconds of inactivity
 * - Cleanup check every 10 seconds
 */
export const defaultBrowserTabConfig: BrowserTabConfig = {
  maxTabs: 3,
  autoCloseDelay: 5000,
  cleanupInterval: 10000,
};

/**
 * Conservative configuration for low RAM systems
 * - Max 2 tabs open at once
 * - Auto-close after 3 seconds of inactivity
 * - Cleanup check every 5 seconds
 */
export const conservativeBrowserTabConfig: BrowserTabConfig = {
  maxTabs: 2,
  autoCloseDelay: 3000,
  cleanupInterval: 5000,
};

/**
 * Aggressive configuration for very low RAM systems
 * - Max 1 tab open at once
 * - Auto-close after 2 seconds of inactivity
 * - Cleanup check every 3 seconds
 */
export const aggressiveBrowserTabConfig: BrowserTabConfig = {
  maxTabs: 1,
  autoCloseDelay: 2000,
  cleanupInterval: 3000,
};

/**
 * Get configuration based on environment or preference
 */
export function getBrowserTabConfig(): BrowserTabConfig {
  // Check for environment variable or localStorage preference
  if (typeof window !== 'undefined') {
    const savedConfig = localStorage.getItem('browserTabConfig');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch {
        // Fall back to default if parsing fails
      }
    }
  }

  // Default to conservative for better RAM management
  return conservativeBrowserTabConfig;
}

/**
 * Save configuration preference
 */
export function saveBrowserTabConfig(config: BrowserTabConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('browserTabConfig', JSON.stringify(config));
  }
}

