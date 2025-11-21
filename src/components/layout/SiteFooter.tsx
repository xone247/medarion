import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Twitter, Linkedin, Github } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const SiteFooter: React.FC = () => {
  const { theme } = useTheme();
  return (
    <footer className="relative overflow-hidden glass-strong backdrop-blur-xl hairline sheen noise-overlay shadow-elevated rounded-t-2xl md:rounded-t-3xl border-t border-[var(--color-divider-gray)]" style={{ background: 'color-mix(in srgb, var(--color-background-surface), transparent 30%)' }}>
      {/* Subtle inner highlight for extra glass feel */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent dark:from-white/5 dark:via-white/0 dark:to-transparent" />
      {/* Top concave cave-out accent - stronger in light mode, subtle in dark */}
      <div aria-hidden className="absolute -top-6 left-1/2 -translate-x-1/2 w-[88%] h-8 pointer-events-none">
        <div className="block dark:hidden w-full h-full rounded-b-[40px]"
          style={{
            background: 'radial-gradient(120% 120% at 50% 0%, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0.00) 70%)'
          }}
        />
        <div className="hidden dark:block w-full h-full rounded-b-[40px]"
          style={{
            background: 'radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.00) 70%)'
          }}
        />
      </div>
      <div className="page-container py-10 md:py-12 px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-1 md:gap-2 lg:gap-2 text-sm">
          {/* Left: Logo + Promo + Contact */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2">
              <img 
                src="/images/logo-light.png" 
                alt="Medarion" 
                className="h-12 md:h-14"
                style={{
                  filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
                }}
              />
            </div>
            <p className="mt-3 text-[var(--color-text-secondary)] text-base max-w-md">African healthcare market data and AI assistance to keep you prepared on every call.</p>
            
            {/* Contact Details */}
            <div className="mt-5 space-y-2 text-[var(--color-text-secondary)]">
              <p className="font-semibold text-[var(--color-text-primary)] text-base">Contact Us</p>
              <p className="text-sm">Email: <a href="mailto:contact@medarion.com" className="hover:text-[var(--color-primary-teal)] transition-colors">contact@medarion.com</a></p>
              <p className="text-sm">Phone: <a href="tel:+1234567890" className="hover:text-[var(--color-primary-teal)] transition-colors">+1 (234) 567-890</a></p>
            </div>

            {/* Social links */}
            <div className="mt-4 flex items-center gap-2">
              <a href="#" className="btn-outline btn-sm flex items-center gap-1"><Twitter className="w-4 h-4"/><span>Twitter</span></a>
              <a href="#" className="btn-outline btn-sm flex items-center gap-1"><Linkedin className="w-4 h-4"/><span>LinkedIn</span></a>
              <a href="#" className="btn-outline btn-sm flex items-center gap-1"><Github className="w-4 h-4"/><span>GitHub</span></a>
            </div>
          </div>

          {/* Three Menu Columns */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-2 text-sm">Data</h4>
            <ul className="space-y-1.5 leading-6">
              <li><Link to="/companies" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors text-sm">Companies</Link></li>
              <li><Link to="/deals" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors text-sm">Deals</Link></li>
              <li><Link to="/grants" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors text-sm">Grants</Link></li>
              <li><Link to="/clinical-trials" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors text-sm">Clinical Trials</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-2 text-sm">Resources</h4>
            <ul className="space-y-1.5 leading-6">
              <li><Link to="/arion" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors text-sm">Arion</Link></li>
              <li><Link to="/m-index" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors text-sm">m‑index (Glossary)</Link></li>
              <li><Link to="/nationpulse" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors text-sm">Nation Pulse</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-2 text-sm">Company</h4>
            <ul className="space-y-1.5 leading-6">
              <li><Link to="/about" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors text-sm">About</Link></li>
              <li><Link to="/contact" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors text-sm">Contact</Link></li>
              <li><Link to="/pricing" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors text-sm">Pricing</Link></li>
              <li><Link to="/documentation" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors text-sm">Documentation</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-5 border-t border-[var(--color-divider-gray)] flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>All systems operational</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="hover:text-[var(--color-primary-teal)] transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-[var(--color-primary-teal)] transition-colors">Terms of Service</Link>
          </div>
          <div className="text-[var(--color-text-secondary)]">© {new Date().getFullYear()} Medarion. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;


