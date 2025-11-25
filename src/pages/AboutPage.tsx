import React from 'react';
import { Globe, Users, Target, Award, Heart, ArrowRight, Star, TrendingUp, Shield, Zap, CheckCircle2, Play } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AboutPageProps {
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className="min-h-screen text-[var(--color-text-primary)] transition-colors duration-500" 
      style={{ 
        backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#F9F7F4'
      }}
    >
      {/* Hero Section */}
      <div className="page-hero">
        <div aria-hidden className="page-hero-bg">
          <img
            src={(import.meta as any).env?.VITE_ABOUT_HERO_URL || (import.meta as any).env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
            alt=""
          />
          <div className="page-hero-overlay" />
          <div className="page-hero-gradient" />
        </div>
        
        <div className="page-hero-content">
          <div className="page-hero-content-inner">
            <h1 className="page-hero-heading">
              About Medarion
            </h1>
            <p className="page-hero-subtext">
              We're transforming Africa with the continent's most advanced AI platform, enabling a deeper understanding of Africa's ecosystem and accelerating solutions across the continent.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16 py-16 md:py-20 lg:py-24">
        
        {/* Mission & Vision */}
        <section className="mb-20 md:mb-24 lg:mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 lg:gap-20">
            {/* Mission */}
            <div className="space-y-6 p-8 md:p-10 lg:p-12 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] transition-colors duration-500">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-black/10 dark:bg-white/10">
                  <Target className="h-6 w-6 text-black dark:text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">Our Mission</h2>
              </div>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed">
                To democratize access to AI and insights empowering startups, investors, healthcare professionals, and policymakers to make informed decisions that improve outcomes across Africa. We believe that better AI and better data lead to better solutions for the continent.
              </p>
            </div>

            {/* Vision */}
            <div className="space-y-6 p-8 md:p-10 lg:p-12 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] transition-colors duration-500">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-black/10 dark:bg-white/10">
                  <Globe className="h-6 w-6 text-black dark:text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">Our Vision</h2>
              </div>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed">
                A future where every African can achieve meaningful transformation, supported by a thriving ecosystem of innovative companies, strategic investments, and data-driven policies. We envision Africa as a global leader in innovation.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section 
          className="mb-20 md:mb-24 lg:mb-32 py-16 md:py-20 lg:py-24 rounded-2xl transition-colors duration-500"
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--color-background-surface)' : '#F9F7F4'
          }}
        >
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)] mb-4">
                Medarion by the Numbers
              </h2>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                Accelerating Africa's transformation through AI and actionable insights
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center p-8 md:p-10 rounded-xl bg-white dark:bg-[var(--color-background-default)] border border-[var(--color-divider-gray)]/20 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="inline-flex items-center justify-center p-4 rounded-xl bg-black/10 dark:bg-white/10 mb-4">
                <Globe className="h-8 w-8 text-black dark:text-white" />
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-2">35+</div>
              <div className="text-sm sm:text-base text-[var(--color-text-secondary)] font-medium">African Countries</div>
            </div>
            <div className="text-center p-8 md:p-10 rounded-xl bg-white dark:bg-[var(--color-background-default)] border border-[var(--color-divider-gray)]/20 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="inline-flex items-center justify-center p-4 rounded-xl bg-black/10 dark:bg-white/10 mb-4">
                <TrendingUp className="h-8 w-8 text-black dark:text-white" />
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-2">500+</div>
              <div className="text-sm sm:text-base text-[var(--color-text-secondary)] font-medium">Healthcare Companies</div>
            </div>
            <div className="text-center p-8 md:p-10 rounded-xl bg-white dark:bg-[var(--color-background-default)] border border-[var(--color-divider-gray)]/20 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="inline-flex items-center justify-center p-4 rounded-xl bg-black/10 dark:bg-white/10 mb-4">
                <Award className="h-8 w-8 text-black dark:text-white" />
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-2">$2.5B+</div>
              <div className="text-sm sm:text-base text-[var(--color-text-secondary)] font-medium">Investment Data Tracked</div>
            </div>
            <div className="text-center p-8 md:p-10 rounded-xl bg-white dark:bg-[var(--color-background-default)] border border-[var(--color-divider-gray)]/20 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="inline-flex items-center justify-center p-4 rounded-xl bg-black/10 dark:bg-white/10 mb-4">
                <Users className="h-8 w-8 text-black dark:text-white" />
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-2">1000+</div>
              <div className="text-sm sm:text-base text-[var(--color-text-secondary)] font-medium">Platform Users</div>
            </div>
          </div>
          </div>
        </section>

        {/* Values Section */}
        <section 
          className="mb-20 md:mb-24 lg:mb-32 py-16 md:py-20 lg:py-24 rounded-2xl transition-colors duration-500"
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--color-background-surface)' : '#F9F7F4'
          }}
        >
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)] mb-4">
                Our Values
              </h2>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                The principles that guide everything we do at Medarion
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            <div className="text-center p-8 md:p-10 lg:p-12 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-white dark:bg-[var(--color-background-default)] shadow-sm hover:shadow-md transition-all duration-300">
              <div className="inline-flex items-center justify-center p-4 rounded-xl bg-black/10 dark:bg-white/10 mb-6">
                <Award className="h-10 w-10 text-black dark:text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] mb-4">Data Integrity</h3>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
                We maintain the highest standards of data accuracy and reliability, ensuring our users can make informed decisions.
              </p>
            </div>
            <div className="text-center p-8 md:p-10 lg:p-12 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-white dark:bg-[var(--color-background-default)] shadow-sm hover:shadow-md transition-all duration-300">
              <div className="inline-flex items-center justify-center p-4 rounded-xl bg-black/10 dark:bg-white/10 mb-6">
                <Zap className="h-10 w-10 text-black dark:text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] mb-4">Innovation</h3>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
                We leverage cutting-edge technology to solve complex challenges and drive meaningful change.
              </p>
            </div>
            <div className="text-center p-8 md:p-10 lg:p-12 rounded-2xl border border-[var(--color-divider-gray)]/20 bg-white dark:bg-[var(--color-background-default)] shadow-sm hover:shadow-md transition-all duration-300">
              <div className="inline-flex items-center justify-center p-4 rounded-xl bg-black/10 dark:bg-white/10 mb-6">
                <Users className="h-10 w-10 text-black dark:text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] mb-4">Collaboration</h3>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
                We believe in the power of partnerships and community to accelerate innovation across Africa.
              </p>
            </div>
          </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="py-16 md:py-20 lg:py-24 rounded-2xl text-center transition-colors duration-500"
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--color-background-surface)' : '#F9F7F4'
          }}
        >
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">
              Ready to transform Africa's ecosystem?
            </h2>
            <p className="text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed">
              Join thousands of innovators, investors, healthcare professionals, and policymakers leveraging Medarion for the most comprehensive AI-driven insights in Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <a 
                href="https://medarion.africa" 
                className="inline-flex items-center gap-2 py-3 px-8 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 text-base sm:text-lg shadow-md hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--color-primary-teal)',
                  color: theme === 'dark' ? '#000000' : '#FFFFFF'
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Our Platform
                <ArrowRight className="h-5 w-5" />
              </a>
              <a 
                href="/contact" 
                className="inline-flex items-center gap-2 bg-transparent text-black dark:text-white py-3 px-8 rounded-lg font-semibold hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-200 text-base sm:text-lg border-2 border-black dark:border-white"
              >
                Contact Us
                <Star className="h-5 w-5" />
              </a>
            </div>
          </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
