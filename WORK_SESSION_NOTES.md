# Work Session Notes - Medarion Application

**Date:** 2024-12-19  
**Focus Areas:** Website Pages, Account Pages, Dashboard Pages

---

## 📋 Application Structure

### Public Pages (Website)
- **Landing Page** (`/`) - CluelyLanding component
- **About** (`/about`) - AboutPage
- **Contact** (`/contact`) - ContactPage
- **Pricing** (`/pricing`) - PricingPage
- **Blog/Arion** (`/arion`, `/blog`) - BlogPage, BlogDetailPage
- **Documentation** (`/documentation`) - DocumentationPage
- **Privacy** (`/privacy`) - PrivacyPage
- **Terms** (`/terms`) - TermsPage
- **M-Index/Glossary** (`/m-index`) - MIndexPage
- **Auth** (`/auth`) - AuthPage (Login/Signup)
- **Forgot Password** (`/forgot-password`) - ForgotPasswordPage
- **Reset Password** (`/reset-password`) - ResetPasswordPage
- **Verify Email** (`/verify-email`) - VerifyEmailPage

### Account Pages (User Profiles)
- **Startup Profile** (`/startup-profile`) - StartupProfile
- **Investor Profile** (`/investor-profile`) - InvestorProfile
- **Executive Profile** (`/executive-profile`) - ExecutiveProfile
- **Researcher Profile** (`/researcher-profile`) - ResearcherProfile
- **Admin Profile** (`/admin-profile`) - AdminProfile
- **Regulator Profile** (`/regulator-profile`) - RegulatorProfile

### Dashboard Pages
- **Startup Dashboard** (`/startup-dashboard`) - StartupDashboard
- **Investor Dashboard** (`/investor-dashboard`) - InvestorDashboard
- **Executive Dashboard** (`/executive-dashboard`) - ExecutiveDashboard
- **Researcher Dashboard** (`/researcher-dashboard`) - ResearcherDashboard
- **Admin Dashboard** (`/admin-dashboard`) - AdminDashboard
- **Regulator Dashboard** (`/regulator-dashboard`) - RegulatorDashboard
- **Users Manager Dashboard** (`/users-manager-dashboard`) - UsersManagerDashboard
- **Ads Manager Dashboard** (`/ads-manager-dashboard`) - AdsManagerDashboard

### Data Pages (Protected)
- **Companies** (`/companies`) - CompaniesPage
- **Deals** (`/deals`) - DealsPage
- **Grants** (`/grants`) - GrantsPage
- **Clinical Trials** (`/clinical-trials`) - ClinicalTrialsPage
- **Nation Pulse** (`/nationpulse`) - NationPulsePage
- **Investors** (`/investors`) - InvestorsPage
- **Public Markets** (`/public-markets`) - PublicMarkets
- **Regulatory** (`/regulatory`) - RegulatoryPage
- **Regulatory Ecosystem** (`/regulatory-ecosystem`) - RegulatoryEcosystemPage
- **Clinical Centers** (`/clinical-centers`) - ClinicalCentersPage
- **Investigators** (`/investigators`) - InvestigatorsPage
- **Fundraising CRM** (`/fundraising-crm`) - FundraisingCRMPage
- **Startup Analytics** (`/startup-analytics`) - StartupAnalyticsPage
- **AI Tools** (`/ai-tools`) - AIToolsPage

### Special Pages
- **Company Profile** (`/company/:companyName`) - CompanyProfile

---

## 🎯 Work Focus Areas

### 1. Website Pages (Public)
- Landing page improvements
- About page content/design
- Contact page functionality
- Pricing page updates
- Blog/Arion page enhancements
- Documentation improvements

### 2. Account Pages (Profiles)
- Profile page layouts
- User information display
- Edit profile functionality
- Account settings
- Profile customization

### 3. Dashboard Pages
- Dashboard layouts and widgets
- Data visualization
- Navigation improvements
- Module customization
- User experience enhancements

---

## 🔧 Technical Stack

- **Frontend:** React + TypeScript + Vite
- **Routing:** React Router v6
- **State Management:** React Context (Auth, Theme, Dashboard, Navigation, Notification)
- **Styling:** Tailwind CSS with custom CSS variables
- **Components:** Modular component architecture

---

## 📝 Notes

- All protected routes require authentication
- User roles determine dashboard access
- Modular dashboard system allows customization
- Theme support (light/dark mode)
- Notification system integrated

---

## 🚀 Quick Navigation Commands

```powershell
# Navigate to specific pages in browser
# Use browser navigation tools to test pages
```

---

**Status:** Ready for development work

