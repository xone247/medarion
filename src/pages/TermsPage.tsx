import React from 'react';

interface TermsPageProps {
  onBack: () => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[var(--color-background-default)] text-[var(--color-text-primary)]">
      {/* Hero Section */}
      <div className="page-hero">
        <div aria-hidden className="page-hero-bg">
          <img
            src={(import.meta as any).env?.VITE_TERMS_HERO_URL || (import.meta as any).env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
            alt=""
          />
          <div className="page-hero-overlay" />
          <div className="page-hero-gradient" />
        </div>
        
        <div className="page-hero-content">
          <div className="page-hero-content-inner">
            <h1 className="page-hero-heading">
              Terms of Service
            </h1>
            <p className="page-hero-subtext">
              The rules that govern your use of Medarion.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <section className="bg-[var(--color-background-surface)] rounded-xl border border-[var(--color-divider-gray)] p-6">
          <h2 className="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="text-[var(--color-text-secondary)]">
            By accessing or using Medarion, you agree to these Terms of Service and our Privacy Policy. If you do not agree,
            please do not use the platform.
          </p>
        </section>
        <section className="bg-[var(--color-background-surface)] rounded-xl border border-[var(--color-divider-gray)] p-6">
          <h2 className="text-2xl font-semibold mb-2">2. Accounts and Access</h2>
          <ul className="list-disc pl-6 text-[var(--color-text-secondary)] space-y-2">
            <li>You are responsible for keeping your account credentials secure.</li>
            <li>Admins may enable role-based access and tiered features.</li>
            <li>We may suspend or terminate access for violations of these terms.</li>
          </ul>
        </section>
        <section className="bg-[var(--color-background-surface)] rounded-xl border border-[var(--color-divider-gray)] p-6">
          <h2 className="text-2xl font-semibold mb-2">3. Data and Content</h2>
          <ul className="list-disc pl-6 text-[var(--color-text-secondary)] space-y-2">
            <li>Use Medarion data responsibly; do not misrepresent or resell without permission.</li>
            <li>External sources may be used for enrichment and are subject to their own licenses.</li>
            <li>We do not guarantee completeness or absolute accuracy of market information.</li>
          </ul>
        </section>
        <section className="bg-[var(--color-background-surface)] rounded-xl border border-[var(--color-divider-gray)] p-6">
          <h2 className="text-2xl font-semibold mb-2">4. Payments and Subscriptions</h2>
          <p className="text-[var(--color-text-secondary)]">
            Paid tiers are billed in advance and subject to our refund and cancellation policies as communicated at checkout.
          </p>
        </section>
        <section className="bg-[var(--color-background-surface)] rounded-xl border border-[var(--color-divider-gray)] p-6">
          <h2 className="text-2xl font-semibold mb-2">5. Limitation of Liability</h2>
          <p className="text-[var(--color-text-secondary)]">
            Medarion is provided “as is.” We are not liable for indirect or consequential losses arising from use of the platform.
          </p>
        </section>
        <section className="bg-[var(--color-background-surface)] rounded-xl border border-[var(--color-divider-gray)] p-6">
          <h2 className="text-2xl font-semibold mb-2">6. Contact</h2>
          <p className="text-[var(--color-text-secondary)]">Questions? Contact us at support@medarion.com.</p>
        </section>
        <div className="text-sm text-[var(--color-text-secondary)]">Last updated: {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}

export default TermsPage;




