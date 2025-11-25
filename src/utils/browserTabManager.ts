/**
 * Browser Tab Manager
 * Manages browser tabs to prevent excessive RAM usage by:
 * - Limiting the number of open tabs
 * - Closing tabs immediately after use
 * - Tracking tab lifecycle
 * 
 * Import configuration:
 * import { getBrowserTabConfig } from './browserTabConfig';
 */

import { getBrowserTabConfig, type BrowserTabConfig } from './browserTabConfig';

interface TabInfo {
  id: string;
  url: string;
  createdAt: number;
  lastUsed: number;
  inUse: boolean;
}

class BrowserTabManager {
  private maxTabs: number = 3; // Maximum number of tabs to keep open
  private tabs: Map<string, TabInfo> = new Map();
  private tabQueue: string[] = []; // Queue of tab IDs in order of creation
  private autoCloseDelay: number = 5000; // Auto-close tabs after 5 seconds of inactivity

  constructor(maxTabs: number = 3, autoCloseDelay: number = 5000) {
    this.maxTabs = maxTabs;
    this.autoCloseDelay = autoCloseDelay;
  }

  /**
   * Register a new tab or update existing tab
   */
  registerTab(url: string, tabId?: string): string {
    const id = tabId || this.generateTabId(url);
    const now = Date.now();

    if (this.tabs.has(id)) {
      // Update existing tab
      const tab = this.tabs.get(id)!;
      tab.lastUsed = now;
      tab.inUse = true;
      return id;
    }

    // Check if we need to close old tabs
    this.enforceMaxTabs();

    // Create new tab
    const tab: TabInfo = {
      id,
      url,
      createdAt: now,
      lastUsed: now,
      inUse: true,
    };

    this.tabs.set(id, tab);
    this.tabQueue.push(id);

    return id;
  }

  /**
   * Mark a tab as no longer in use
   */
  releaseTab(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.inUse = false;
      tab.lastUsed = Date.now();
      
      // Schedule auto-close if not in use
      setTimeout(() => {
        this.closeTabIfInactive(tabId);
      }, this.autoCloseDelay);
    }
  }

  /**
   * Immediately close a tab
   */
  closeTab(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      this.tabs.delete(tabId);
      const index = this.tabQueue.indexOf(tabId);
      if (index > -1) {
        this.tabQueue.splice(index, 1);
      }
    }
  }

  /**
   * Close tab if it's inactive
   */
  private closeTabIfInactive(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab && !tab.inUse) {
      const timeSinceLastUse = Date.now() - tab.lastUsed;
      if (timeSinceLastUse >= this.autoCloseDelay) {
        this.closeTab(tabId);
      }
    }
  }

  /**
   * Enforce maximum tab limit by closing oldest unused tabs
   */
  enforceMaxTabs(): void {
    while (this.tabs.size >= this.maxTabs) {
      // Find oldest unused tab
      let oldestUnusedTab: string | null = null;
      let oldestTime = Infinity;

      for (const [id, tab] of this.tabs.entries()) {
        if (!tab.inUse && tab.lastUsed < oldestTime) {
          oldestTime = tab.lastUsed;
          oldestUnusedTab = id;
        }
      }

      // If no unused tabs, close oldest tab
      if (oldestUnusedTab) {
        this.closeTab(oldestUnusedTab);
      } else if (this.tabQueue.length > 0) {
        // Close oldest tab in queue
        const oldestId = this.tabQueue[0];
        this.closeTab(oldestId);
      } else {
        break;
      }
    }
  }

  /**
   * Close all tabs
   */
  closeAllTabs(): void {
    const tabIds = Array.from(this.tabs.keys());
    tabIds.forEach(id => this.closeTab(id));
  }

  /**
   * Get current tab count
   */
  getTabCount(): number {
    return this.tabs.size;
  }

  /**
   * Get all open tabs
   */
  getOpenTabs(): TabInfo[] {
    return Array.from(this.tabs.values());
  }

  /**
   * Generate a unique tab ID from URL
   */
  private generateTabId(url: string): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up inactive tabs
   */
  cleanup(): void {
    const now = Date.now();
    const tabsToClose: string[] = [];

    for (const [id, tab] of this.tabs.entries()) {
      if (!tab.inUse) {
        const timeSinceLastUse = now - tab.lastUsed;
        if (timeSinceLastUse >= this.autoCloseDelay) {
          tabsToClose.push(id);
        }
      }
    }

    tabsToClose.forEach(id => this.closeTab(id));
  }

  /**
   * Update configuration
   */
  setMaxTabs(maxTabs: number): void {
    this.maxTabs = maxTabs;
    this.enforceMaxTabs();
  }

  setAutoCloseDelay(delay: number): void {
    this.autoCloseDelay = delay;
  }

  /**
   * Get maximum tabs setting
   */
  getMaxTabs(): number {
    return this.maxTabs;
  }
}

// Singleton instance
let tabManagerInstance: BrowserTabManager | null = null;

/**
 * Get or create the global tab manager instance
 * Uses configuration from browserTabConfig if no parameters provided
 */
export function getTabManager(maxTabs?: number, autoCloseDelay?: number): BrowserTabManager {
  if (!tabManagerInstance) {
    if (maxTabs === undefined || autoCloseDelay === undefined) {
      const config = getBrowserTabConfig();
      tabManagerInstance = new BrowserTabManager(config.maxTabs, config.autoCloseDelay);
    } else {
      tabManagerInstance = new BrowserTabManager(maxTabs, autoCloseDelay);
    }
  }
  return tabManagerInstance;
}

/**
 * Browser tool wrapper with automatic tab management
 */
export class ManagedBrowserTool {
  private tabManager: BrowserTabManager;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxTabs?: number, autoCloseDelay?: number) {
    this.tabManager = getTabManager(maxTabs, autoCloseDelay);
    
    const config = getBrowserTabConfig();
    // Cleanup inactive tabs periodically
    this.cleanupInterval = setInterval(() => {
      this.tabManager.cleanup();
    }, config.cleanupInterval);
  }

  /**
   * Cleanup and stop the managed browser tool
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.tabManager.closeAllTabs();
  }

  /**
   * Navigate to a URL with automatic tab management
   */
  async navigate(url: string): Promise<string> {
    const tabId = this.tabManager.registerTab(url);
    this.tabManager.enforceMaxTabs();
    return tabId;
  }

  /**
   * Mark navigation as complete and release tab
   */
  releaseNavigation(tabId: string): void {
    this.tabManager.releaseTab(tabId);
  }

  /**
   * Close a specific tab
   */
  closeTab(tabId: string): void {
    this.tabManager.closeTab(tabId);
  }

  /**
   * Get current tab statistics
   */
  getStats() {
    return {
      openTabs: this.tabManager.getTabCount(),
      maxTabs: this.tabManager.getMaxTabs(),
      tabs: this.tabManager.getOpenTabs(),
    };
  }
}

// Export default instance
export default getTabManager();

