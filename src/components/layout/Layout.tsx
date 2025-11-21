import React from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage }) => {
  const scopedClass = currentPage && (currentPage === 'blog' || currentPage === 'blog-detail') ? 'blog-theme' : '';
  const removePad = currentPage === 'home' || currentPage === 'blog' || currentPage === 'blog-detail';
  const topPadClass = removePad ? 'pt-0 md:pt-0' : 'pt-4 md:pt-6';
  return (
    <div className={`min-h-screen bg-[var(--color-background-default)] text-[var(--color-text-primary)] ${scopedClass}`}>
      <SiteHeader currentPage={currentPage} />
      <main className={topPadClass}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export default Layout;




