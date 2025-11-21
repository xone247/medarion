import React from 'react';
import { Globe, Shield, Eye, Lock, ArrowLeft, Database, Users } from 'lucide-react';

interface PrivacyPageProps {
  onBack: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation removed to use global SiteHeader */}

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]" style={{ 
        marginTop: '-100px',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        left: '50%',
        right: '50%',
        width: '100vw',
        paddingTop: '120px',
        paddingBottom: '48px',
        position: 'relative',
      }}>
        <div aria-hidden className="absolute inset-0 z-0">
          <img
            src={(import.meta as any).env?.VITE_PRIVACY_HERO_URL || (import.meta as any).env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
            alt=""
            className="w-full h-full object-cover blur-[2px] scale-105 opacity-90"
            style={{ filter: 'brightness(0.4) saturate(1.1)' }}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 opacity-10 mix-blend-multiply" style={{ background: 'linear-gradient(90deg, var(--color-primary-teal) 0%, var(--color-accent-sky) 100%)' }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mx-auto w-16 h-1 rounded-full bg-[var(--color-primary-teal)] mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-2 max-w-2xl mx-auto drop-shadow-md">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-white/70 text-sm">Last updated: December 20, 2024</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">

        {/* Quick Overview */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 p-8 rounded-lg border border-primary-200 dark:border-primary-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Privacy at a Glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-primary-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Data Protection</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">We use industry-standard encryption and security measures</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Eye className="h-6 w-6 text-primary-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Transparency</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Clear information about what data we collect and why</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-6 w-6 text-primary-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Your Control</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">You can access, update, or delete your data anytime</p>
              </div>
            </div>
          </div>
        </div>

        {/* Information We Collect */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="h-6 w-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Information We Collect</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Account Information</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Name, email address, and company information when you create an account</li>
                <li>Profile information including your role, industry focus, and professional background</li>
                <li>Billing information for paid subscriptions (processed securely through third-party providers)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Usage Data</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>How you interact with our platform, including pages visited and features used</li>
                <li>Search queries and filters applied to healthcare data</li>
                <li>API usage patterns and frequency for enterprise customers</li>
                <li>Device information, IP address, and browser type for security and optimization</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Communication Data</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Messages sent through our platform's communication features</li>
                <li>Support tickets and correspondence with our team</li>
                <li>Feedback and survey responses</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How We Use Information */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <Lock className="h-6 w-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How We Use Your Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Platform Services</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Provide access to healthcare investment data and analytics</li>
                <li>Personalize your experience and recommendations</li>
                <li>Enable communication between users (investors and startups)</li>
                <li>Process payments and manage subscriptions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Improvement & Security</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Improve our platform's functionality and user experience</li>
                <li>Detect and prevent fraud, abuse, and security threats</li>
                <li>Analyze usage patterns to enhance our data offerings</li>
                <li>Provide customer support and respond to inquiries</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Sharing */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="h-6 w-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Sharing and Disclosure</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">We Do Not Sell Your Data</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We never sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Limited Sharing</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                We may share your information only in these specific circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li><strong>Service Providers:</strong> Trusted third parties who help us operate our platform (hosting, analytics, payment processing)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share specific information</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Security */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Data Security</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Technical Safeguards</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>End-to-end encryption for data transmission</li>
                <li>Encrypted storage of sensitive information</li>
                <li>Regular security audits and penetration testing</li>
                <li>Multi-factor authentication for account access</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Operational Security</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Limited access to personal data on a need-to-know basis</li>
                <li>Employee training on data protection and privacy</li>
                <li>Incident response procedures for security breaches</li>
                <li>Regular backups and disaster recovery planning</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Your Rights */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Privacy Rights</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Access Your Data</h3>
                <p className="text-gray-600 dark:text-gray-300">Request a copy of all personal information we have about you</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Correct Inaccuracies</h3>
                <p className="text-gray-600 dark:text-gray-300">Update or correct any inaccurate personal information</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">3</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Delete Your Data</h3>
                <p className="text-gray-600 dark:text-gray-300">Request deletion of your personal information (subject to legal requirements)</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">4</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Data Portability</h3>
                <p className="text-gray-600 dark:text-gray-300">Export your data in a machine-readable format</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">5</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Opt-Out</h3>
                <p className="text-gray-600 dark:text-gray-300">Unsubscribe from marketing communications at any time</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              To exercise any of these rights, please contact us at <a href="mailto:privacy@medarion.com" className="text-primary-600 dark:text-primary-400 hover:underline">privacy@medarion.com</a> 
              or use the privacy controls in your account settings.
            </p>
          </div>
        </div>

        {/* International Transfers */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">International Data Transfers</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            As a platform serving users across Africa and globally, we may transfer your data to countries outside your home country. 
            We ensure appropriate safeguards are in place for such transfers, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
            <li>Adequacy decisions by relevant data protection authorities</li>
            <li>Standard contractual clauses approved by data protection authorities</li>
            <li>Certification schemes and codes of conduct</li>
            <li>Your explicit consent where required</li>
          </ul>
        </div>

        {/* Data Retention */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Data Retention</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We retain your personal information only as long as necessary for the purposes outlined in this policy:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
            <li><strong>Account Data:</strong> Retained while your account is active and for 3 years after account closure</li>
            <li><strong>Usage Data:</strong> Aggregated and anonymized after 2 years for analytics purposes</li>
            <li><strong>Communication Data:</strong> Retained for 5 years for customer support and legal compliance</li>
            <li><strong>Financial Data:</strong> Retained for 7 years as required by applicable financial regulations</li>
          </ul>
        </div>

        {/* Children's Privacy */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Children's Privacy</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Our platform is designed for professional use and is not intended for children under 16 years of age. 
            We do not knowingly collect personal information from children under 16. If we become aware that we have 
            collected personal information from a child under 16, we will take steps to delete such information promptly.
          </p>
        </div>

        {/* Changes to Policy */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Changes to This Policy</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We may update this privacy policy from time to time to reflect changes in our practices or applicable laws. 
            When we make changes, we will:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
            <li>Update the "Last updated" date at the top of this policy</li>
            <li>Notify you via email if the changes are material</li>
            <li>Post a notice on our platform highlighting the changes</li>
            <li>For significant changes, request your consent where required by law</li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 rounded-lg text-white">
          <h2 className="text-2xl font-bold mb-6">Contact Us About Privacy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Data Protection Officer</h3>
              <p className="text-primary-100 mb-2">Email: privacy@medarion.com</p>
              <p className="text-primary-100 mb-2">Phone: +234 800 123 4567</p>
              <p className="text-primary-100">Response time: Within 30 days</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Mailing Address</h3>
              <p className="text-primary-100">
                Medarion Healthcare Data Platform<br />
                123 Victoria Island<br />
                Lagos, Nigeria<br />
                100001
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-primary-800 rounded-lg">
            <p className="text-primary-100 text-sm">
              If you have concerns about how we handle your personal information, you also have the right to 
              lodge a complaint with your local data protection authority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;