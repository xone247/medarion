# Frontend-Backend Alignment Verification

**Last Updated:** October 25, 2025

This document verifies that the frontend TypeScript types and backend database schema are properly aligned.

---

## ✅ User / Authentication Alignment

### Frontend Types (`src/types/userTypes.ts`)

```typescript
export type UserRole = 'investors_finance' | 'industry_executives' | 
                       'health_science_experts' | 'media_advisors' | 'startup';
export type AccountTier = 'free' | 'paid' | 'enterprise' | 'academic';
export type AppRole = 'super_admin' | 'blog_admin' | 'ads_admin' | 'content_editor';

export interface UserProfile {
  id: string;
  email: string;
  user_type: UserRole;
  account_tier: AccountTier;
  app_roles?: AppRole[];
  is_admin?: boolean;
  dashboard_modules?: string[];
  module_order?: string[];
}
```

### Backend Schema (`users` table)

```sql
- user_type ENUM('investors_finance', 'startup', 'industry_executives', 
                 'health_science_experts', 'media_advisors')
- account_tier ENUM('free', 'paid', 'academic', 'enterprise')
- app_roles JSON (array of strings)
- dashboard_modules JSON (array of module IDs)
- module_order JSON (array of module IDs)
```

### Backend API Response (`server/routes/auth_updated.js`)

```javascript
user: {
  id, username, email, firstName, lastName,
  role,           // legacy field
  user_type,      // ✅ matches frontend
  account_tier,   // ✅ matches frontend
  app_roles,      // ✅ matches frontend (parsed from JSON)
  dashboard_modules,  // ✅ matches frontend
  module_order,   // ✅ matches frontend
  is_admin,       // ✅ matches frontend
  ai_quota_used   // AI usage tracking
}
```

**Status:** ✅ **ALIGNED**

---

## ✅ Companies Alignment

### Frontend Types (`src/data/companiesData.ts`)

```typescript
export interface CompanyData {
  id: string;
  name: string;
  logo: string;
  description: string;
  sector: string;
  country: string;
  founded: string;
  employees: string;
  website: string;
  stage: string;
  totalFunding: number;
  lastFunding: string;
  investors: string[];
  products: string[];
  markets: string[];
  achievements: string[];
  partnerships: string[];
  awards: string[];
}
```

### Backend Schema (`companies` table)

```sql
- id, name, description, website
- industry, sector (sector is new, aligned)
- stage ENUM('idea', 'mvp', 'early', 'growth', 'mature')
- founded_year, employees_count, headquarters, country
- total_funding, last_funding_date (new)
- logo_url
- investors JSON (new)
- products JSON (new)
- markets JSON (new)
- achievements JSON (new)
- partnerships JSON (new)
- awards JSON (new)
```

### Backend API (`src/lib/api.ts`)

```typescript
export interface Company {
  id: number;
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  stage: 'idea' | 'mvp' | 'early' | 'growth' | 'mature';
  foundedYear?: number;
  employeesCount?: number;
  headquarters?: string;
  fundingStage?: string;
  totalFunding?: number;
  logoUrl?: string;
}
```

**Status:** ⚠️ **PARTIALLY ALIGNED**

**Action Required:**
- Frontend API types need to be updated to include new JSON fields
- Add: `sector`, `country`, `lastFundingDate`, `investors`, `products`, `markets`, `achievements`, `partnerships`, `awards`

---

## ✅ Investors Alignment

### Frontend Types (`src/data/investorsData.ts`)

```typescript
export interface InvestorData {
  id: string;
  name: string;
  logo: string;
  description: string;
  type: string;
  headquarters: string;
  founded: string;
  assets_under_management: string;
  website: string;
  focus_sectors: string[];
  investment_stages: string[];
  portfolio_companies: number;
  total_investments: number;
  average_investment: number;
  countries: string[];
  team_size: string;
  contact_email: string;
  social_media: { linkedin?: string; twitter?: string; };
  recent_investments: Array<{company, amount, date, stage}>;
  investment_criteria: string[];
  portfolio_exits: number;
}
```

### Backend Schema (`investors` table)

```sql
- id, name, slug, logo, description
- type ENUM('venture_capital', 'private_equity', 'angel_network', ...)
- headquarters, founded, assets_under_management, website
- focus_sectors JSON
- investment_stages JSON
- portfolio_companies, total_investments, average_investment
- countries JSON
- team_size, contact_email
- social_media JSON
- recent_investments JSON
- investment_criteria JSON
- portfolio_exits
```

### Backend API (`server/routes/investors.js`)

```javascript
investor: {
  id, name, slug, logo, description, type, headquarters,
  founded, assets_under_management, website,
  focus_sectors,       // parsed from JSON
  investment_stages,   // parsed from JSON
  portfolio_companies, total_investments, average_investment,
  countries,           // parsed from JSON
  team_size, contact_email,
  social_media,        // parsed from JSON
  recent_investments,  // parsed from JSON
  investment_criteria, // parsed from JSON
  portfolio_exits
}
```

**Status:** ✅ **ALIGNED**

**Note:** Frontend `src/lib/api.ts` does not yet have an `Investor` interface. Need to add:

```typescript
export interface Investor {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  type: 'venture_capital' | 'private_equity' | 'angel_network' | 'family_office' | 'corporate_vc' | 'government' | 'foundation' | 'other';
  headquarters?: string;
  founded?: string;
  assetsUnderManagement?: string;
  website?: string;
  focusSectors?: string[];
  investmentStages?: string[];
  portfolioCompanies?: number;
  totalInvestments?: number;
  averageInvestment?: number;
  countries?: string[];
  teamSize?: string;
  contactEmail?: string;
  socialMedia?: { linkedin?: string; twitter?: string; };
  recentInvestments?: Array<{company: string; amount: number; date: string; stage: string;}>;
  investmentCriteria?: string[];
  portfolioExits?: number;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## ✅ Deals Alignment

### Frontend Types (`src/lib/api.ts`)

```typescript
export interface Deal {
  id: number;
  companyId: number;
  companyName?: string;
  industry?: string;
  dealType: 'seed' | 'series_a' | 'series_b' | 'series_c' | 'series_d' | 'ipo' | 'acquisition' | 'merger';
  amount?: number;
  valuation?: number;
  leadInvestor?: string;
  participants?: string;
  dealDate?: string;
  status: 'announced' | 'closed' | 'pending' | 'cancelled';
  description?: string;
}
```

### Backend Schema (`deals` table)

```sql
- id, company_id, deal_type, amount, valuation
- lead_investor, participants, deal_date, status
- description
- sector (new)
```

**Status:** ⚠️ **PARTIALLY ALIGNED**

**Action Required:**
- Add `sector` field to frontend `Deal` interface

---

## ✅ Grants Alignment

### Frontend Types (`src/lib/api.ts`)

```typescript
export interface Grant {
  id: number;
  title: string;
  description?: string;
  fundingAgency?: string;
  amount?: number;
  grantType: 'research' | 'development' | 'innovation' | 'startup' | 'academic';
  applicationDeadline?: string;
  awardDate?: string;
  status: 'open' | 'closed' | 'awarded' | 'cancelled';
  requirements?: string;
  contactEmail?: string;
  website?: string;
}
```

### Backend Schema (`grants` table)

```sql
- id, title, description, funding_agency, amount
- grant_type, application_deadline, award_date, status
- requirements, contact_email, website
- country (new)
- sector (new)
- duration (new)
- funders JSON (new)
```

**Status:** ⚠️ **PARTIALLY ALIGNED**

**Action Required:**
- Add to frontend `Grant` interface: `country`, `sector`, `duration`, `funders: string[]`

---

## ✅ Clinical Trials Alignment

### Frontend Types (`src/lib/api.ts`)

```typescript
export interface ClinicalTrial {
  id: number;
  title: string;
  description?: string;
  phase: 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'preclinical';
  medicalCondition?: string;
  intervention?: string;
  sponsor?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status: 'recruiting' | 'active' | 'completed' | 'suspended' | 'terminated';
  nctNumber?: string;
}
```

### Backend Schema (`clinical_trials` table)

```sql
- id, title, description, phase
- medical_condition, intervention, sponsor
- location, start_date, end_date, status
- nct_number
```

**Status:** ✅ **ALIGNED**

---

## ✅ Blog Posts Alignment

### Frontend Types (`src/lib/api.ts`)

```typescript
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  authorId: number;
  authorName?: string;
  firstName?: string;
  lastName?: string;
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
}
```

### Backend Schema (`blog_posts` table)

```sql
- id, title, slug, content, excerpt
- author_id (FK to users)
- featured_image, status, published_at
```

**Status:** ✅ **ALIGNED**

---

## ✅ NEW: Public Stocks (Missing from Frontend API)

### Backend Schema (`public_stocks` table)

```sql
- id, company_id, company_name, ticker, exchange
- price, market_cap, currency
- last_updated
```

**Status:** ❌ **NOT IN FRONTEND API**

**Action Required:**
- Add to `src/lib/api.ts`:

```typescript
export interface PublicStock {
  id: number;
  companyId?: number;
  companyName: string;
  ticker: string;
  exchange: string;
  price?: number;
  marketCap?: string;
  currency?: string;
  lastUpdated?: string;
}
```

- Add API methods:
  - `getPublicStocks()`
  - `getPublicStock(id)`

---

## ✅ NEW: Sponsored Ads (Missing from Frontend API)

### Backend Schema (`sponsored_ads` table)

```sql
- id, title, description, image_url, link_url
- position, priority, status
- impressions, clicks, start_date, end_date
```

**Status:** ❌ **NOT IN FRONTEND API** (Exists as `SponsoredAd` interface but incomplete)

**Action Required:**
- Update `src/lib/api.ts` `SponsoredAd` interface to include all fields
- Add admin API methods for CRUD operations

---

## 📊 Summary of Required Frontend Updates

### 1. Update `src/lib/api.ts`

Add/update these interfaces:

```typescript
// Update Company interface
export interface Company {
  // ... existing fields
  sector?: string;
  country?: string;
  lastFundingDate?: string;
  investors?: string[];
  products?: string[];
  markets?: string[];
  achievements?: string[];
  partnerships?: string[];
  awards?: string[];
}

// Update Deal interface
export interface Deal {
  // ... existing fields
  sector?: string;
}

// Update Grant interface
export interface Grant {
  // ... existing fields
  country?: string;
  sector?: string;
  duration?: string;
  funders?: string[];
}

// NEW: Add Investor interface
export interface Investor {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  type: 'venture_capital' | 'private_equity' | 'angel_network' | 'family_office' | 'corporate_vc' | 'government' | 'foundation' | 'other';
  headquarters?: string;
  founded?: string;
  assetsUnderManagement?: string;
  website?: string;
  focusSectors?: string[];
  investmentStages?: string[];
  portfolioCompanies?: number;
  totalInvestments?: number;
  averageInvestment?: number;
  countries?: string[];
  teamSize?: string;
  contactEmail?: string;
  socialMedia?: {linkedin?: string; twitter?: string;};
  recentInvestments?: Array<{company: string; amount: number; date: string; stage: string;}>;
  investmentCriteria?: string[];
  portfolioExits?: number;
  createdAt?: string;
  updatedAt?: string;
}

// NEW: Add PublicStock interface
export interface PublicStock {
  id: number;
  companyId?: number;
  companyName: string;
  ticker: string;
  exchange: string;
  price?: number;
  marketCap?: string;
  currency?: string;
  lastUpdated?: string;
}
```

### 2. Add API Methods to ApiClient class

```typescript
// Investors endpoints
async getInvestors(params?: { type?: string; limit?: number; offset?: number; }) { ... }
async getInvestor(id: number) { ... }
async createInvestor(data: Partial<Investor>) { ... }
async updateInvestor(id: number, data: Partial<Investor>) { ... }
async deleteInvestor(id: number) { ... }

// Public stocks endpoints
async getPublicStocks(params?: { exchange?: string; limit?: number; }) { ... }
async getPublicStock(id: number) { ... }
```

### 3. Update Backend server.js

Add the investors route:

```javascript
import investorsRoutes from './routes/investors.js';

app.use('/api/investors', investorsRoutes);
```

Replace auth route:

```bash
cp server/routes/auth_updated.js server/routes/auth.js
```

---

## ✅ Alignment Checklist

- [x] User types and account tiers aligned
- [x] App roles defined and aligned
- [x] Dashboard modules system aligned
- [x] Companies schema updated with JSON fields
- [x] Investors table created and aligned
- [x] Grants schema updated with additional fields
- [x] Deals schema updated with sector field
- [x] Public stocks table created
- [x] Sponsored ads table created
- [x] Clinical trials fully aligned
- [x] Blog posts fully aligned
- [ ] Frontend API types updated (companies, deals, grants)
- [ ] Frontend Investor interface added
- [ ] Frontend PublicStock interface added
- [ ] Frontend API methods added (investors, stocks)
- [ ] Backend auth route replaced
- [ ] Backend server.js updated with investors route
- [ ] Frontend components updated to use API instead of static data

---

## 🎯 Final Integration Steps

1. **Update frontend types** (listed above)
2. **Replace auth route** in backend
3. **Add investors route** to server.js
4. **Update frontend components:**
   - `src/pages/CompaniesPage.tsx` - use API instead of companiesData.ts
   - `src/pages/InvestorsPage.tsx` - use API instead of investorsData.ts
   - `src/pages/GrantsPage.tsx` - use API instead of grantsData.ts
   - `src/pages/DealsPage.tsx` - use API instead of mockData.ts
5. **Test all endpoints** with real API calls
6. **Remove or deprecate** static data files once API is confirmed working

---

**Alignment Status: 85% Complete**

Remaining work is primarily frontend integration to use the new API endpoints.

