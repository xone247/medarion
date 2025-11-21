import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DashboardProvider } from './contexts/DashboardContext';
import Sidebar from './components/Sidebar';
import ModularDashboard from './components/ModularDashboard';
import CompanyProfile from './pages/CompanyProfile';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import BlogPage from './pages/BlogPage';
import DocumentationPage from './pages/DocumentationPage';
import PrivacyPage from './pages/PrivacyPage';
import AIChatWidget from './components/ai/AIChatWidget';
import BlogDetailPage from './pages/BlogDetailPage';
import PricingPage from './pages/PricingPage';

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [currentStaticPage, setCurrentStaticPage] = useState<string | null>(null);
  const [currentBlogId, setCurrentBlogId] = useState<number | null>(null);

  // Global navigation hooks for buttons in various pages
  useEffect(() => {
    const toAuth = () => { setShowAuth(true); setShowLanding(false); setCurrentStaticPage(null); };
    const toStatic = (e: any) => { const page = e?.detail?.page; if (page) { setCurrentStaticPage(page); setShowAuth(false); setShowLanding(false); setCurrentBlogId(null); } };
    window.addEventListener('medarion:navigate:auth', toAuth as any);
    window.addEventListener('medarion:navigate:static', toStatic as any);
    return () => {
      window.removeEventListener('medarion:navigate:auth', toAuth as any);
      window.removeEventListener('medarion:navigate:static', toStatic as any);
    };
  }, []);

  // Keep app starting on Landing (Home). Do not auto-hide landing when authenticated.
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not logged in: always show Landing by default
      setShowLanding(true);
      setShowAuth(false);
      setSelectedCompany(null);
      setCurrentStaticPage(null);
      setCurrentBlogId(null);
    } else {
      // Logged in: do not force dashboard; keep whatever the user was viewing
      setShowAuth(false);
    }
  }, [user, loading]);

  const handleGetStarted = () => {
    if (user) {
      // If logged in and user clicks Get Started, go to dashboard
      setShowLanding(false);
      setCurrentStaticPage(null);
    } else {
      setShowAuth(true);
      setShowLanding(false);
      setCurrentStaticPage(null);
    }
  };

  const handleShowAuth = () => {
    setShowAuth(true);
    setShowLanding(false);
    setCurrentStaticPage(null);
  };

  const handleBackToLanding = () => {
    setShowAuth(false);
    setShowLanding(true);
    setCurrentStaticPage(null);
    setCurrentBlogId(null);
  };

  const handleNavigateToPage = (page: string) => {
    setCurrentStaticPage(page);
    setShowLanding(false);
    setShowAuth(false);
    setCurrentBlogId(null);
  };

  const handleBackFromStaticPage = () => {
    setCurrentStaticPage(null);
    setShowLanding(true);
  };

  const handleViewCompany = (companyName: string) => {
    setSelectedCompany(companyName);
  };

  const handleBackToOverview = () => {
    setSelectedCompany(null);
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

  // Blog detail page takes precedence when set
  if (currentBlogId != null) {
    return (
      <>
        <BlogDetailPage postId={currentBlogId} onBack={() => { setCurrentBlogId(null); setCurrentStaticPage('blog'); setShowLanding(false); }} />
        <AIChatWidget />
      </>
    );
  }

  // Show static pages
  if (currentStaticPage) {
    switch (currentStaticPage) {
      case 'about':
        return <AboutPage onBack={handleBackFromStaticPage} />;
      case 'contact':
        return <ContactPage onBack={handleBackFromStaticPage} />;
      case 'blog':
        return <BlogPage onBack={handleBackFromStaticPage} onRead={(id)=> setCurrentBlogId(id)} />;
      case 'pricing':
        return <PricingPage onBack={handleBackFromStaticPage} />;
      case 'documentation':
        return <DocumentationPage onBack={handleBackFromStaticPage} />;
      case 'privacy':
        return <PrivacyPage onBack={handleBackFromStaticPage} />;
      default:
        return (
          <>
            <LandingPage onGetStarted={handleGetStarted} onShowAuth={handleShowAuth} onNavigate={handleNavigateToPage} />
            <AIChatWidget />
          </>
        );
    }
  }

  if (!user && showAuth) {
    return <AuthPage onBack={handleBackToLanding} />;
  }

  if (showLanding) {
    return (
      <>
        <LandingPage onGetStarted={handleGetStarted} onShowAuth={handleShowAuth} onNavigate={handleNavigateToPage} />
        <AIChatWidget />
      </>
    );
  }

  // Show company profile if selected
  if (selectedCompany) {
    return (
      <>
        <CompanyProfile companyName={selectedCompany} onBack={handleBackToOverview} />
        <AIChatWidget />
      </>
    );
  }

  // Main dashboard with modular system
  return (
    <DashboardProvider>
      <div className="flex flex-col lg:flex-row h-screen bg-background">
        <Sidebar userType={profile?.user_type ?? 'startup'} />
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 transition-all duration-300 border-l border-[var(--color-divider-gray)]">
          <div className="page-container py-4 md:py-6">
            <ModularDashboard onViewCompany={handleViewCompany} />
          </div>
        </main>
        <AIChatWidget />
      </div>
    </DashboardProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;