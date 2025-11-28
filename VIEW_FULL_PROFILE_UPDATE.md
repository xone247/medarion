# View Full Profile Button Update ✅

## Changes Made

### Updated Logic
- **Before**: "View Full Profile" button showed for all companies with data (`hasProfile`)
- **After**: "View Full Profile" button only shows for companies that have an account on the platform

### Implementation Details

1. **User Account Check**:
   - Fetches all users from `/admin/users` API
   - Creates a Set of company names that have user accounts (from `users.company_name`)
   - Checks if each company's name matches a user's `company_name`

2. **Company Data Transformation**:
   - Changed `hasProfile` to `hasAccount`
   - `hasAccount` is `true` only if there's a user with matching `company_name`
   - Removed the old logic that checked for data existence

3. **Popup Actions**:
   - "View Full Profile" button only renders if `showCompanyDetails.hasAccount === true`
   - Removed the button completely for companies without accounts

## Result

- ✅ "View More" button shows for ALL companies (opens popup)
- ✅ "View Full Profile" button only shows in popup for companies with platform accounts
- ✅ Companies without accounts can still view details in popup, but won't see "View Full Profile" button

## Files Modified

- `src/pages/CompaniesPage.tsx`:
  - Added user fetching to check for company accounts
  - Changed `hasProfile` to `hasAccount`
  - Updated popup to conditionally show "View Full Profile" button

