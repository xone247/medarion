import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Twitter, Linkedin, Github } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/apiService';

const SiteFooter: React.FC = () => {
  const { theme } = useTheme();
  const [newsletterStatus, setNewsletterStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isSubscribing, setIsSubscribing] = useState(false);
  return (
    <footer 
      className="relative border-t transition-colors duration-500 rounded-t-3xl"
      style={{ 
        backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#F9F7F4',
        borderColor: theme === 'dark' 
          ? 'var(--color-divider-gray)' 
          : 'rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="w-full px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 md:py-20">
        <div className="footer-grid items-start">
          {/* Brand Section - Wider */}
          <div className="space-y-4 flex flex-col h-full items-center text-center">
            <div>
              <img 
                src="/images/logo-light.png" 
                alt="Medarion" 
                className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto mx-auto"
                style={{
                  filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
                }}
              />
            </div>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed flex-grow max-w-md">
              African healthcare market data and AI assistance to keep you prepared on every call.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center justify-center gap-3 pt-2 mt-auto">
              <a 
                href="#" 
                aria-label="Twitter" 
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
              >
                <Twitter className="w-5 h-5"/>
              </a>
              <a 
                href="#" 
                aria-label="LinkedIn" 
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
              >
                <Linkedin className="w-5 h-5"/>
              </a>
              <a 
                href="#" 
                aria-label="GitHub" 
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
              >
                <Github className="w-5 h-5"/>
              </a>
            </div>
          </div>

          {/* Data */}
          <div className="space-y-4 flex flex-col h-full">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] min-h-[1.5rem] flex items-center">Data</h4>
            <ul className="space-y-3 flex-grow">
              <li>
                <Link 
                  to="/companies" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  Companies
                </Link>
              </li>
              <li>
                <Link 
                  to="/deals" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  Deals
                </Link>
              </li>
              <li>
                <Link 
                  to="/grants" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  Grants
                </Link>
              </li>
              <li>
                <Link 
                  to="/clinical-trials" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  Clinical Trials
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4 flex flex-col h-full">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] min-h-[1.5rem] flex items-center">Resources</h4>
            <ul className="space-y-3 flex-grow">
              <li>
                <Link 
                  to="/arion" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  Arion
                </Link>
              </li>
              <li>
                <Link 
                  to="/m-index" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  m‑index (Glossary)
                </Link>
              </li>
              <li>
                <Link 
                  to="/nationpulse" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  Nation Pulse
                </Link>
              </li>
              <li>
                <Link 
                  to="/ergon" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  Ergon
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4 flex flex-col h-full">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] min-h-[1.5rem] flex items-center">Company</h4>
            <ul className="space-y-3 flex-grow">
              <li>
                <Link 
                  to="/about" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  to="/pricing" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link 
                  to="/documentation" 
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Section - Last Column, Biggest */}
          <div className="space-y-4 flex flex-col h-full">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] min-h-[1.5rem] flex items-center">Stay updated</h4>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Get the latest updates and insights delivered to your inbox.
            </p>
            <form 
              className="flex flex-col gap-2 flex-grow" 
              onSubmit={async (e)=>{
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = form.querySelector('input[type="email"]') as HTMLInputElement;
                if (input && input.value && !isSubscribing) {
                  const email = input.value.trim();
                  setIsSubscribing(true);
                  setNewsletterStatus({ type: null, message: '' });
                  
                  try {
                    const response = await apiService.post('/newsletter/subscribe', {
                      email: email,
                      source: 'footer'
                    });
                    
                    if (response.success) {
                      setNewsletterStatus({ 
                        type: 'success', 
                        message: response.message || 'Successfully subscribed to newsletter!' 
                      });
                      input.value = '';
                      // Clear success message after 5 seconds
                      setTimeout(() => {
                        setNewsletterStatus({ type: null, message: '' });
                      }, 5000);
                    } else {
                      throw new Error(response.error || 'Failed to subscribe');
                    }
                  } catch (error: any) {
                    setNewsletterStatus({ 
                      type: 'error', 
                      message: error.message || 'Failed to subscribe. Please try again.' 
                    });
                    // Clear error message after 5 seconds
                    setTimeout(() => {
                      setNewsletterStatus({ type: null, message: '' });
                    }, 5000);
                  } finally {
                    setIsSubscribing(false);
                  }
                }
              }}
            >
              <input 
                type="email" 
                className="w-full px-4 py-2.5 border border-[var(--color-divider-gray)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed" 
                placeholder="Enter your email" 
                aria-label="Email" 
                required
                disabled={isSubscribing}
              />
              {newsletterStatus.type && (
                <div className={`p-3 rounded text-sm ${
                  newsletterStatus.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}>
                  {newsletterStatus.message}
                </div>
              )}
              <button 
                type="submit"
                className="w-full px-6 py-2.5 rounded font-medium transition-all text-sm newsletter-subscribe-btn disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-primary-teal)',
                  color: theme === 'dark' ? '#000000' : '#FFFFFF',
                  WebkitTextFillColor: theme === 'dark' ? '#000000' : '#FFFFFF',
                  caretColor: theme === 'dark' ? '#000000' : '#FFFFFF'
                } as React.CSSProperties}
                disabled={isSubscribing}
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            <p className="text-xs text-[var(--color-text-secondary)] mt-auto">
              We'll email occasional updates. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div 
          className="mt-12 pt-8 border-t"
          style={{
            borderColor: theme === 'dark' 
              ? 'var(--color-divider-gray)' 
              : 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <CheckCircle2 className="w-4 h-4 text-green-500"/>
              <span>All systems operational</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Link 
                to="/privacy" 
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-[var(--color-text-secondary)]">•</span>
              <Link 
                to="/terms" 
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors"
              >
                Terms of Service
              </Link>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              © {new Date().getFullYear()} Medarion. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;


