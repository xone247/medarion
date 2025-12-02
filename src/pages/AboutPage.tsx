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
        backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
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
      <div className="max-w-screen-2xl mx-auto">
        
        {/* Mission & Vision Section */}
        <section 
          className="py-24 md:py-32 lg:py-40 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
          }}
        >
          <div className="px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-12 md:gap-16 lg:gap-20">
              {/* Mission - Left */}
              <div className="space-y-6 md:space-y-7 order-1 lg:order-1 lg:col-span-2">
                <div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">01</div>
                <div className="flex items-center gap-4 mb-2">
                  <Target className="h-6 w-6 text-[var(--color-primary-teal)]" />
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
                    Our Mission
                  </h2>
                </div>
                <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
                  To democratize access to AI and insights empowering startups, investors, healthcare professionals, and policymakers to make informed decisions that improve outcomes across Africa. We believe that better AI and better data lead to better solutions for the continent.
                </p>
              </div>
              {/* Mission Image - Right */}
              <div className="relative order-2 lg:order-2 lg:col-span-3">
                <div className="aspect-[4/3] flex items-center justify-center min-h-[300px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[480px] overflow-hidden rounded-2xl shadow-2xl border border-[var(--color-divider-gray)]/20">
                  <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80"
                    alt="Our Mission - Healthcare Technology Innovation"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section 
          className="py-24 md:py-32 lg:py-40 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#F9F7F4'
          }}
        >
          <div className="px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-12 md:gap-16 lg:gap-20">
              {/* Vision Image - Left */}
              <div className="relative order-1 lg:order-1 lg:col-span-3">
                <div className="aspect-[4/3] flex items-center justify-center min-h-[300px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[480px] overflow-hidden rounded-2xl shadow-2xl border border-[var(--color-divider-gray)]/20">
                  <img 
                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=900&fit=crop&q=80"
                    alt="Our Vision - Precision Medicine and Innovation"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=900&fit=crop&q=80';
                    }}
                  />
                </div>
              </div>
              {/* Vision - Right */}
              <div className="space-y-6 md:space-y-7 order-2 lg:order-2 lg:col-span-2">
                <div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">02</div>
                <div className="flex items-center gap-4 mb-2">
                  <Globe className="h-6 w-6 text-[var(--color-primary-teal)]" />
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
                    Our Vision
                  </h2>
                </div>
                <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
                  A future where every African can achieve meaningful transformation, supported by a thriving ecosystem of innovative companies, strategic investments, and data-driven policies. We envision Africa as a global leader in innovation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section 
          className="py-24 md:py-32 lg:py-40 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
          }}
        >
          <div className="px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="text-center mb-12 md:mb-16">
              <div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60 mb-4">03</div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight mb-4">
                Medarion by the Numbers
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
                Accelerating Africa's transformation through AI and actionable insights
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              <div className="text-center p-8 md:p-10">
                <div className="inline-flex items-center justify-center p-4 rounded-xl bg-[var(--color-background-surface)] mb-4">
                  <Globe className="h-8 w-8 text-[var(--color-primary-teal)]" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-normal text-[var(--color-text-primary)] mb-2">35+</div>
                <div className="text-sm sm:text-base text-[var(--color-text-secondary)] font-medium">African Countries</div>
              </div>
              <div className="text-center p-8 md:p-10">
                <div className="inline-flex items-center justify-center p-4 rounded-xl bg-[var(--color-background-surface)] mb-4">
                  <TrendingUp className="h-8 w-8 text-[var(--color-primary-teal)]" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-normal text-[var(--color-text-primary)] mb-2">500+</div>
                <div className="text-sm sm:text-base text-[var(--color-text-secondary)] font-medium">Healthcare Companies</div>
              </div>
              <div className="text-center p-8 md:p-10">
                <div className="inline-flex items-center justify-center p-4 rounded-xl bg-[var(--color-background-surface)] mb-4">
                  <Award className="h-8 w-8 text-[var(--color-primary-teal)]" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-normal text-[var(--color-text-primary)] mb-2">$2.5B+</div>
                <div className="text-sm sm:text-base text-[var(--color-text-secondary)] font-medium">Investment Data Tracked</div>
              </div>
              <div className="text-center p-8 md:p-10">
                <div className="inline-flex items-center justify-center p-4 rounded-xl bg-[var(--color-background-surface)] mb-4">
                  <Users className="h-8 w-8 text-[var(--color-primary-teal)]" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-normal text-[var(--color-text-primary)] mb-2">1000+</div>
                <div className="text-sm sm:text-base text-[var(--color-text-secondary)] font-medium">Platform Users</div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section 
          className="py-24 md:py-32 lg:py-40 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#F9F7F4'
          }}
        >
          <div className="px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="text-center mb-12 md:mb-16">
              <div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60 mb-4">04</div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight mb-4">
                Our Values
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
                The principles that guide everything we do at Medarion
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
              <div className="p-0 flex flex-col h-full">
                <div className="relative mb-4 sm:mb-5 md:mb-6 overflow-hidden rounded-xl shadow-lg aspect-[4/3] border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)]">
                  <img 
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=900&fit=crop&q=80"
                    alt="Data Integrity"
                    className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=900&fit=crop&q=80';
                    }}
                  />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Award className="h-5 w-5 text-[var(--color-primary-teal)]" />
                  <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-[var(--color-text-primary)]">Data Integrity</h3>
                </div>
                <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed flex-grow">
                  We maintain the highest standards of data accuracy and reliability, ensuring our users can make informed decisions.
                </p>
              </div>
              <div className="p-0 flex flex-col h-full">
                <div className="relative mb-4 sm:mb-5 md:mb-6 overflow-hidden rounded-xl shadow-lg aspect-[4/3] border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)]">
                  <img 
                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=900&fit=crop&q=80"
                    alt="Innovation"
                    className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=900&fit=crop&q=80';
                    }}
                  />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="h-5 w-5 text-[var(--color-primary-teal)]" />
                  <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-[var(--color-text-primary)]">Innovation</h3>
                </div>
                <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed flex-grow">
                  We leverage cutting-edge technology to solve complex challenges and drive meaningful change.
                </p>
              </div>
              <div className="p-0 flex flex-col h-full">
                <div className="relative mb-4 sm:mb-5 md:mb-6 overflow-hidden rounded-xl shadow-lg aspect-[4/3] border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)]">
                  <img 
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop&q=80"
                    alt="Collaboration"
                    className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop&q=80';
                    }}
                  />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Users className="h-5 w-5 text-[var(--color-primary-teal)]" />
                  <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-[var(--color-text-primary)]">Collaboration</h3>
                </div>
                <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed flex-grow">
                  We believe in the power of partnerships and community to accelerate innovation across Africa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="py-24 md:py-32 lg:py-40 transition-colors duration-500"
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
          }}
        >
          <div className="px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-7">
              <div className="text-xl sm:text-2xl font-normal text-[var(--color-text-primary)] opacity-60">05</div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-[var(--color-text-primary)] tracking-tight leading-tight">
                Ready to transform Africa's ecosystem?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed">
                Join thousands of innovators, investors, healthcare professionals, and policymakers leveraging Medarion for the most comprehensive AI-driven insights in Africa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <a 
                  href="/auth" 
                  className="w-full sm:w-auto px-10 sm:px-12 py-3.5 sm:py-4 btn-primary-elevated rounded-full font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 text-base sm:text-lg"
                >
                  Sign in
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a 
                  href="/contact" 
                  className="w-full sm:w-auto px-10 sm:px-12 py-3.5 sm:py-4 btn-outline rounded-full font-medium transition-all inline-flex items-center justify-center text-base sm:text-lg"
                >
                  Contact Us
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
