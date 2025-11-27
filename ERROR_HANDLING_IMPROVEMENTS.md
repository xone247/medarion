# Error Handling Improvements

## Issues Fixed

### 1. Token Storage Priority ✅ FIXED

**Problem:**
- `apiService.ts` was only checking `auth_token`, `token`, and `authToken`
- Not checking `medarionAuthToken` or `medarionSessionToken` (which are used by admin dashboard)
- Using `test-token` as fallback could cause authentication issues

**Fix:**
- Updated `updateAuthToken()` to check ALL possible token keys in priority order:
  1. `medarionAuthToken` (used by admin dashboard)
  2. `medarionSessionToken` (used by auth flow)
  3. `auth_token` (used by AuthContext)
  4. `token` (generic fallback)
  5. `authToken` (alternative format)
- Removed `test-token` fallback - now uses `null` if no token found
- Only adds `Authorization` header if token exists

### 2. Global Error Handling ✅ ADDED

**Problem:**
- No global error handlers for unhandled errors
- Unhandled promise rejections could fail silently
- Browser console errors might not be captured

**Fix:**
- Added `window.addEventListener('error')` to catch JavaScript errors
- Added `window.addEventListener('unhandledrejection')` to catch unhandled promise rejections
- Both handlers log errors to console for debugging

## Files Modified

1. **`src/services/apiService.ts`**
   - Updated `updateAuthToken()` to check all token keys
   - Removed `test-token` fallback
   - Updated `getHeaders()` to only add Authorization if token exists

2. **`src/main.tsx`**
   - Added global error event listener
   - Added unhandled promise rejection listener

## Testing

After these fixes:
1. ✅ API service will correctly find tokens from any storage key
2. ✅ No more `test-token` being sent to API (prevents auth failures)
3. ✅ Global errors will be logged to console
4. ✅ Unhandled promise rejections will be caught and logged

## Next Steps

1. Test login flow to verify token is found correctly
2. Test admin dashboard to verify authentication works
3. Monitor browser console for any new errors
4. Verify no `test-token` is being sent in production

