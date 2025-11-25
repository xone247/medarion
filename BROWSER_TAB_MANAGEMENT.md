# Browser Tab Management Rules

This document outlines the rules and configuration for managing browser tabs to prevent excessive RAM usage.

## Rules

1. **Maximum Tabs**: Only keep a maximum of 3 tabs open at any time (configurable)
2. **Auto-Close**: Tabs are automatically closed after 5 seconds of inactivity (configurable)
3. **Immediate Cleanup**: Tabs are closed immediately after use when possible
4. **Oldest First**: When the tab limit is reached, the oldest unused tab is closed first

## Configuration

Default settings:
- **Max Tabs**: 3
- **Auto-Close Delay**: 5000ms (5 seconds)

You can customize these values when initializing the tab manager:

```typescript
import { getTabManager } from './src/utils/browserTabManager';

// Custom configuration
const tabManager = getTabManager(3, 5000); // maxTabs, autoCloseDelay
```

## Usage

### Basic Usage

```typescript
import { getTabManager } from './src/utils/browserTabManager';

const tabManager = getTabManager();

// Register a new tab
const tabId = tabManager.registerTab('https://example.com');

// Use the tab (perform operations)
// ... browser operations ...

// Release the tab when done
tabManager.releaseTab(tabId);
// Tab will auto-close after 5 seconds
```

### With Managed Browser Tool

```typescript
import { ManagedBrowserTool } from './src/utils/browserTabManager';

const browser = new ManagedBrowserTool(3, 5000);

// Navigate to a URL
const tabId = await browser.navigate('https://example.com');

// Perform operations
// ... browser operations ...

// Release navigation
browser.releaseNavigation(tabId);

// Get statistics
const stats = browser.getStats();
console.log(`Open tabs: ${stats.openTabs}/${stats.maxTabs}`);
```

### Manual Tab Management

```typescript
import { getTabManager } from './src/utils/browserTabManager';

const tabManager = getTabManager();

// Register tab
const tabId = tabManager.registerTab('https://example.com');

// Immediately close a tab
tabManager.closeTab(tabId);

// Close all tabs
tabManager.closeAllTabs();

// Get current tab count
const count = tabManager.getTabCount();

// Get all open tabs
const tabs = tabManager.getOpenTabs();
```

## Best Practices

1. **Always release tabs after use**: Call `releaseTab()` immediately after completing browser operations
2. **Monitor tab count**: Use `getTabCount()` to check how many tabs are open
3. **Clean up periodically**: The manager automatically cleans up, but you can call `cleanup()` manually
4. **Adjust limits based on RAM**: If you have limited RAM, reduce `maxTabs` to 2 or even 1

## Integration with Browser Tools

When using browser automation tools (like Puppeteer, Playwright, or MCP browser tools), follow this pattern:

```typescript
// 1. Register tab before navigation
const tabId = tabManager.registerTab(url);

// 2. Perform browser operations
await browser.navigate(url);
// ... perform actions ...

// 3. Release tab immediately after use
tabManager.releaseTab(tabId);
// Tab will auto-close after 5 seconds
```

## Memory Management

The tab manager helps prevent RAM issues by:
- Limiting concurrent tabs
- Automatically closing unused tabs
- Prioritizing oldest tabs for closure
- Tracking tab lifecycle to prevent leaks

## Troubleshooting

If you're still experiencing high RAM usage:
1. Reduce `maxTabs` to 2 or 1
2. Reduce `autoCloseDelay` to 2000ms (2 seconds)
3. Manually close tabs with `closeTab()` immediately after use
4. Call `cleanup()` more frequently

