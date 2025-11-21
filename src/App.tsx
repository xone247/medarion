import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { NavigationProvider, NavigationContext } from './contexts/NavigationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import SPANavigation from './components/SPANavigation';
import Sidebar from './components/Sidebar';
import GlobalHeader from './components/GlobalHeader';
import ModularDashboard from './components/ModularDashboard';
import AIChatWidget from './components/ai/AIChatWidget';
import CompanyProfile from './pages/CompanyProfile';
// Removed old LandingPage in favor of CluelyLanding
import AuthPage from './pages/AuthPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import BlogPage from './pages/BlogPage';
import DocumentationPage from './pages/DocumentationPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import MIndexPage from './pages/MIndexPage';
import BlogDetailPage from './pages/BlogDetailPage';
import PricingPage from './pages/PricingPage';
import CompaniesPage from './pages/CompaniesPage';
import DealsPage from './pages/DealsPage';
import GrantsPage from './pages/GrantsPage';
import ClinicalTrialsPage from './pages/ClinicalTrialsPage';
import NationPulsePage from './pages/NationPulsePage';
import GlossaryPage from './pages/GlossaryPage';
import CluelyLanding from './pages/CluelyLanding';
import { parsePathToPage, makePathForPage, getProfileSlugFromRole, legacyPageForProfile } from './lib/routes';
import Layout from './components/layout/Layout';
import SiteFooter from './components/layout/SiteFooter';
import InvestorsPage from './pages/InvestorsPage';
import PublicMarkets from './pages/PublicMarkets';
import RegulatoryPage from './pages/RegulatoryPage';
import RegulatoryEcosystemPage from './pages/RegulatoryEcosystemPage';
import ClinicalCentersPage from './pages/ClinicalCentersPage';
import InvestigatorsPage from './pages/InvestigatorsPage';
import FundraisingCRMPage from './pages/FundraisingCRMPage';
import StartupAnalyticsPage from './pages/StartupAnalyticsPage';
import StartupDashboard from './pages/StartupDashboard';
import InvestorDashboard from './pages/InvestorDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import ResearcherDashboard from './pages/ResearcherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UsersManagerDashboard from './pages/UsersManagerDashboard';
import AdsManagerDashboard from './pages/AdsManagerDashboard';
import AIToolsPage from './pages/AIToolsPage';
import ExecutiveProfile from './pages/ExecutiveProfile';
import ResearcherProfile from './pages/ResearcherProfile';
import RegulatorProfile from './pages/RegulatorProfile';
import StartupProfile from './pages/StartupProfile';
import InvestorProfile from './pages/InvestorProfile';
import AdminProfile from './pages/AdminProfile';
import RegulatorDashboard from './pages/RegulatorDashboard';
import AuthNotification from './components/AuthNotification';

  const AppContent = () => {
    const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
    const [showAuthNotification, setShowAuthNotification] = useState(false);

  // Reset scroll position on route change
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Handle protected routes
    useEffect(() => {
    const protectedRoutes = [
      '/companies', '/deals', '/grants', '/clinical-trials', '/nationpulse', 
      '/glossary', '/investors', '/public-markets', '/regulatory', 
      '/regulatory-ecosystem', '/clinical-centers', '/investigators',
      '/fundraising-crm', '/startup-analytics', 
      '/startup-dashboard', '/investor-dashboard', '/executive-dashboard',
      '/researcher-dashboard', '/admin-dashboard', '/ads-manager-dashboard',
      '/users-manager-dashboard', '/ai-tools', 
      '/executive-profile', '/researcher-profile', '/regulator-profile',
      '/startup-profile', '/investor-profile', '/admin-profile',
      '/regulator-dashboard'
    ];

    const isProtectedRoute = protectedRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (!user && isProtectedRoute) {
          setShowAuthNotification(true);
      } else {
      setShowAuthNotification(false);
    }
  }, [user, location.pathname]);

    const handleGetStarted = () => {
      if (user) {
        // If logged in and user clicks Get Started, go to dashboard
      const role = (profile as any)?.role || (profile as any)?.user_type || 'startup';
      const map: Record<string, string> = {
        admin: '/admin-dashboard',
        investors_finance: '/investor-dashboard',
        investor: '/investor-dashboard',
        startup: '/startup-dashboard',
        health_science_experts: '/researcher-dashboard',
        researcher: '/researcher-dashboard',
        industry_executives: '/executive-dashboard',
        executive: '/executive-dashboard',
        regulators: '/regulator-dashboard',
        regulator: '/regulator-dashboard',
      };
      const target = map[role] || '/startup-dashboard';
      navigate(target);
      } else {
      navigate('/auth');
      }
    };

    const handleShowAuth = () => {
    navigate('/auth');
    };

    const handleShowAuthNotification = () => {
      setShowAuthNotification(true);
    };

    const handleCloseAuthNotification = () => {
      setShowAuthNotification(false);
    };

    const handleAuthNotificationLogin = () => {
      setShowAuthNotification(false);
    navigate('/auth');
    };

    const handleAuthNotificationSignup = () => {
      setShowAuthNotification(false);
    navigate('/auth');
    };

    const handleNavigateToPage = (page: string) => {
    navigate(`/${page}`);
    };

    const handleBackFromStaticPage = () => {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      if (user) {
        const role = (profile as any)?.role || (profile as any)?.user_type || 'startup';
      const map: Record<string, string> = {
        admin: '/admin-dashboard',
        investors_finance: '/investor-dashboard',
        investor: '/investor-dashboard',
        startup: '/startup-dashboard',
        health_science_experts: '/researcher-dashboard',
        researcher: '/researcher-dashboard',
        industry_executives: '/executive-dashboard',
        executive: '/executive-dashboard',
        regulators: '/regulator-dashboard',
        regulator: '/regulator-dashboard',
        };
      const target = map[role] || '/startup-dashboard';
      navigate(target);
      } else {
      navigate('/');
      }
    };

    const handleViewCompany = (companyName: string) => {
    navigate(`/company/${companyName}`);
    };

    const handleBackToOverview = () => {
    navigate('/companies');
    };

    const renderAppShell = (child: React.ReactNode) => {
      return (
              <div className="flex flex-col lg:flex-row h-screen w-full bg-[var(--color-background-default)] relative">
                {/* Background gradient overlay like landing page */}
                <div className="fixed inset-0 -z-20" aria-hidden>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
                </div>
                <Sidebar userType={(profile as any)?.user_type ?? (profile as any)?.role ?? 'startup'} />
                <main className="flex-1 overflow-y-auto pt-0 pb-16 transition-all duration-300 border-l border-[var(--color-divider-gray)]">
                  <GlobalHeader />
                  <div className="page-container w-full px-4 py-4">
                    <SPANavigation>
                      {child}
                    </SPANavigation>
                  </div>
                </main>
              </div>
      );
    };

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

      return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <Layout currentPage="home">
            <CluelyLanding 
              onGetStarted={handleGetStarted} 
              onShowAuth={handleShowAuth} 
              onNavigate={handleNavigateToPage} 
              currentPage="home"
              withHeader={false}
              withFooter={false}
            />
          </Layout>
        } />
        <Route path="/about" element={
          <Layout currentPage="about">
            <AboutPage onBack={handleBackFromStaticPage} />
          </Layout>
        } />
        <Route path="/contact" element={
          <Layout currentPage="contact">
            <ContactPage onBack={handleBackFromStaticPage} />
          </Layout>
        } />
        <Route path="/arion" element={
          <Layout currentPage="arion">
            <BlogPage onBack={handleBackFromStaticPage} />
          </Layout>
        } />
        <Route path="/arion/:id" element={
          <Layout currentPage="blog-detail">
            <BlogDetailPage />
          </Layout>
        } />
        {/* Backward-compat for /blog routes */}
        <Route path="/blog" element={
          <Layout currentPage="arion">
            <BlogPage onBack={handleBackFromStaticPage} />
          </Layout>
        } />
        <Route path="/blog/:id" element={
          <Layout currentPage="blog-detail">
            <BlogDetailPage />
          </Layout>
        } />
        <Route path="/pricing" element={
          <Layout currentPage="pricing">
            <PricingPage onBack={handleBackFromStaticPage} />
          </Layout>
        } />
        <Route path="/documentation" element={
          <Layout currentPage="documentation">
            <DocumentationPage onBack={handleBackFromStaticPage} />
          </Layout>
        } />
        <Route path="/privacy" element={
          <Layout currentPage="privacy">
            <PrivacyPage onBack={handleBackFromStaticPage} />
          </Layout>
        } />
        <Route path="/terms" element={
          <Layout currentPage="terms">
            <TermsPage onBack={handleBackFromStaticPage} />
          </Layout>
        } />
        <Route path="/m-index" element={
          <Layout currentPage="m-index">
            <MIndexPage onBack={handleBackFromStaticPage} />
          </Layout>
        } />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth" element={
          <Layout currentPage="auth">
            <AuthPage onBack={() => navigate('/')} />
          </Layout>
        } />

        {/* Protected Routes */}
        <Route path="/companies" element={renderAppShell(<CompaniesPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/deals" element={renderAppShell(<DealsPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/grants" element={renderAppShell(<GrantsPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/clinical-trials" element={renderAppShell(<ClinicalTrialsPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/nationpulse" element={renderAppShell(<NationPulsePage onBack={handleBackFromStaticPage} />)} />
        {/* Back-compat redirects */}
        <Route path="/glossary" element={<Navigate to="/m-index" replace />} />
        <Route path="/investors" element={renderAppShell(<InvestorsPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/public-markets" element={renderAppShell(<PublicMarkets onBack={handleBackFromStaticPage} />)} />
        <Route path="/regulatory" element={renderAppShell(<RegulatoryPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/regulatory-ecosystem" element={renderAppShell(<RegulatoryEcosystemPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/clinical-centers" element={renderAppShell(<ClinicalCentersPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/investigators" element={renderAppShell(<InvestigatorsPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/fundraising-crm" element={renderAppShell(<FundraisingCRMPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/startup-analytics" element={renderAppShell(<StartupAnalyticsPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/startup-dashboard" element={renderAppShell(<StartupDashboard onBack={handleBackFromStaticPage} />)} />
        <Route path="/investor-dashboard" element={renderAppShell(<InvestorDashboard onBack={handleBackFromStaticPage} />)} />
        <Route path="/executive-dashboard" element={renderAppShell(<ExecutiveDashboard onBack={handleBackFromStaticPage} />)} />
        <Route path="/researcher-dashboard" element={renderAppShell(<ResearcherDashboard onBack={handleBackFromStaticPage} />)} />
        <Route path="/admin" element={renderAppShell(<AdminDashboard onBack={handleBackFromStaticPage} />)} />
        <Route path="/admin-dashboard" element={renderAppShell(<AdminDashboard onBack={handleBackFromStaticPage} />)} />
        <Route path="/ads-manager-dashboard" element={renderAppShell(<AdsManagerDashboard onBack={handleBackFromStaticPage} />)} />
        <Route path="/users-manager-dashboard" element={renderAppShell(<UsersManagerDashboard onBack={handleBackFromStaticPage} />)} />
        <Route path="/ai-tools" element={renderAppShell(<AIToolsPage onBack={handleBackFromStaticPage} />)} />
        <Route path="/startup-profile" element={renderAppShell(<StartupProfile onBack={handleBackFromStaticPage} />)} />
        <Route path="/investor-profile" element={renderAppShell(<InvestorProfile onBack={handleBackFromStaticPage} />)} />
        <Route path="/admin-profile" element={renderAppShell(<AdminProfile onBack={handleBackFromStaticPage} />)} />
        <Route path="/executive-profile" element={renderAppShell(<ExecutiveProfile onBack={handleBackFromStaticPage} />)} />
        <Route path="/researcher-profile" element={renderAppShell(<ResearcherProfile onBack={handleBackFromStaticPage} />)} />
        <Route path="/regulator-profile" element={renderAppShell(<RegulatorProfile onBack={handleBackFromStaticPage} />)} />
        <Route path="/regulator-dashboard" element={renderAppShell(<RegulatorDashboard onBack={handleBackFromStaticPage} />)} />
        
        {/* Catch-all route for module IDs that don't have explicit routes */}
        <Route path="/module/:moduleId" element={renderAppShell(<ModularDashboard onViewCompany={handleViewCompany} />)} />
        
        <Route path="/company/:companyName" element={
          <CompanyProfile 
            companyName={location.pathname.split('/')[2]} 
            onBack={handleBackToOverview} 
          />
        } />
      </Routes>
      
          <AuthNotification
            isOpen={showAuthNotification}
            onClose={handleCloseAuthNotification}
            onLogin={handleAuthNotificationLogin}
            onSignup={handleAuthNotificationSignup}
          />
          {user && (
            (profile as any)?.is_admin ||
            ['paid','enterprise'].includes((((profile as any)?.account_tier) || '').toString()) ||
            (typeof ((profile as any)?.role) === 'string' && ((profile as any)?.role).toLowerCase().includes('admin')) ||
            (typeof ((profile as any)?.user_type) === 'string' && ((profile as any)?.user_type).toLowerCase().includes('admin'))
          ) ? <AIChatWidget /> : null}
        </>
      );
};

function App() {
  return (
    <Router>
    <ThemeProvider>
      <AuthProvider>
          <DashboardProvider>
            <NavigationProvider>
              <NotificationProvider>
        <AppContent />
              </NotificationProvider>
            </NavigationProvider>
          </DashboardProvider>
      </AuthProvider>
    </ThemeProvider>
    </Router>
  );
}

export default App;