/**
 * Example usage of Browser Tab Manager
 * 
 * This file demonstrates how to use the browser tab manager
 * to prevent excessive RAM usage when using browser automation tools.
 */

import { getTabManager, ManagedBrowserTool } from './browserTabManager';
import { getBrowserTabConfig, conservativeBrowserTabConfig } from './browserTabConfig';

/**
 * Example 1: Basic usage with manual tab management
 */
export async function exampleBasicUsage() {
  const tabManager = getTabManager();

  // Register a tab before navigating
  const tabId = tabManager.registerTab('https://example.com');
  
  // Perform browser operations here
  // await browser.navigate('https://example.com');
  // await browser.snapshot();
  // ... other operations ...
  
  // Release tab immediately after use
  tabManager.releaseTab(tabId);
  // Tab will auto-close after configured delay (default 5 seconds)
}

/**
 * Example 2: Using ManagedBrowserTool wrapper
 */
export async function exampleManagedBrowser() {
  const browser = new ManagedBrowserTool();
  
  // Navigate to URL (automatically manages tabs)
  const tabId = await browser.navigate('https://example.com');
  
  // Perform operations
  // await performBrowserActions();
  
  // Release when done
  browser.releaseNavigation(tabId);
  
  // Get statistics
  const stats = browser.getStats();
  console.log(`Managing ${stats.openTabs} tabs`);
  
  // Clean up when done
  browser.destroy();
}

/**
 * Example 3: Multiple tabs with automatic cleanup
 */
export async function exampleMultipleTabs() {
  const tabManager = getTabManager(3, 5000); // Max 3 tabs, 5 second delay
  
  const urls = [
    'https://example.com/page1',
    'https://example.com/page2',
    'https://example.com/page3',
    'https://example.com/page4', // This will trigger cleanup of oldest tab
  ];
  
  for (const url of urls) {
    const tabId = tabManager.registerTab(url);
    
    // Perform operations
    // await processUrl(url);
    
    // Release immediately
    tabManager.releaseTab(tabId);
  }
  
  // Manual cleanup if needed
  tabManager.cleanup();
}

/**
 * Example 4: Conservative configuration for low RAM
 */
export async function exampleConservativeConfig() {
  // Use conservative config (max 2 tabs, 3 second delay)
  const tabManager = getTabManager(
    conservativeBrowserTabConfig.maxTabs,
    conservativeBrowserTabConfig.autoCloseDelay
  );
  
  const tabId = tabManager.registerTab('https://example.com');
  
  // Quick operation
  // await quickOperation();
  
  // Release immediately - will close in 3 seconds
  tabManager.releaseTab(tabId);
}

/**
 * Example 5: Pattern for browser automation tools
 * 
 * This pattern should be used when calling browser tools:
 * 1. Register tab before navigation
 * 2. Perform all operations
 * 3. Release tab immediately
 */
export async function exampleBrowserToolPattern() {
  const tabManager = getTabManager();
  
  try {
    // Step 1: Register tab
    const url = 'https://example.com';
    const tabId = tabManager.registerTab(url);
    
    // Step 2: Navigate and perform operations
    // await mcp_cursor-ide-browser_browser_navigate({ url });
    // await mcp_cursor-ide-browser_browser_snapshot();
    // await mcp_cursor-ide-browser_browser_click({ ... });
    // ... perform all needed operations ...
    
    // Step 3: Release tab immediately after use
    tabManager.releaseTab(tabId);
    
  } catch (error) {
    // Always release tab even on error
    // tabManager.closeTab(tabId); // if you have tabId in scope
    throw error;
  }
}

/**
 * Example 6: Monitoring tab usage
 */
export function exampleMonitoring() {
  const tabManager = getTabManager();
  
  // Check current tab count
  const count = tabManager.getTabCount();
  console.log(`Currently managing ${count} tabs`);
  
  // Get all open tabs
  const tabs = tabManager.getOpenTabs();
  tabs.forEach(tab => {
    console.log(`Tab: ${tab.url} (created: ${new Date(tab.createdAt).toISOString()})`);
  });
  
  // Check if we're at limit
  const config = getBrowserTabConfig();
  if (count >= config.maxTabs) {
    console.warn('Tab limit reached! Oldest tabs will be closed on next navigation.');
  }
}

