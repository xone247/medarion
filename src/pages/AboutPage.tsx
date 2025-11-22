import React from 'react';
import { Globe, Users, Target, Award, Heart, ArrowRight, Star, TrendingUp, Shield, Zap, CheckCircle2 } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const team = [
    {
      name: 'Dr. Kwame Asante',
      role: 'CEO & Co-founder',
      bio: 'Former WHO Africa Director with 15+ years in healthcare policy and digital health initiatives across Africa.',
      image: '👨🏿‍⚕️',
      linkedin: 'linkedin.com/in/kwameasante'
    },
    {
      name: 'Amara Okafor',
      role: 'CTO & Co-founder',
      bio: 'Ex-Google AI researcher specializing in healthcare data analytics and machine learning for emerging markets.',
      image: '👩🏿‍💻',
      linkedin: 'linkedin.com/in/amaraokafor'
    },
    {
      name: 'Sarah Mwangi',
      role: 'Head of Data',
      bio: 'Former McKinsey consultant with expertise in African healthcare markets and investment analysis.',
      image: '👩🏾‍💼',
      linkedin: 'linkedin.com/in/sarahmwangi'
    },
    {
      name: 'David Adebayo',
      role: 'Head of Product',
      bio: 'Product leader with experience at Flutterwave and Paystack, focused on African fintech and healthtech.',
      image: '👨🏾‍💻',
      linkedin: 'linkedin.com/in/davidadebayo'
    }
  ];


  const values = [
    {
      title: 'African-First',
      description: 'We prioritize African healthcare needs and solutions, understanding the unique challenges and opportunities across the continent.',
      icon: Heart
    },
    {
      title: 'Data Integrity',
      description: 'We maintain the highest standards of data accuracy and reliability, ensuring our users can make informed decisions.',
      icon: Award
    },
    {
      title: 'Innovation',
      description: 'We leverage cutting-edge technology to solve complex healthcare challenges and drive meaningful change.',
      icon: Target
    },
    {
      title: 'Collaboration',
      description: 'We believe in the power of partnerships and community to accelerate healthcare innovation across Africa.',
      icon: Users
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background-default)] text-[var(--color-text-primary)]">
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
            src={(import.meta as any).env?.VITE_ABOUT_HERO_URL || (import.meta as any).env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
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
              About Medarion
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
              We're transforming African healthcare with comprehensive data intelligence—connecting innovators, investors, and institutions to accelerate solutions across the continent.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-20">
        {/* Mission & Vision */}
        <div className="grid grid-cols-2 gap-12">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 lg:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-2xl flex items-center justify-center">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
            </div>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              To democratize access to African healthcare data and insights, empowering startups, investors, 
              and policymakers to make informed decisions that improve health outcomes across Africa. 
              We believe that better data leads to better healthcare solutions.
            </p>
          </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 lg:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-2xl flex items-center justify-center">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Vision</h2>
            </div>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              A future where every African has access to quality healthcare, supported by a thriving 
              ecosystem of innovative companies, strategic investments, and data-driven policies. 
              We envision Africa as a global leader in healthcare innovation.
            </p>
          </div>
        </div>

          {/* Stats Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                <span className="w-1 h-12 bg-gradient-to-b from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-full"></span>
                Medarion by the Numbers
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">Transforming healthcare across Africa through data</p>
            </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-10 w-10 text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">35+</div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">African Countries</div>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-10 w-10 text-white" />
          </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">500+</div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">Healthcare Companies</div>
        </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$2.5B+</div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">Investment Data Tracked</div>
                  </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">1000+</div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">Platform Users</div>
              </div>
            </div>
          </div>

          {/* Values */}
          <div>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                <span className="w-1 h-12 bg-gradient-to-b from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-full"></span>
                Our Values
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                The principles that guide everything we do at Medarion
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="group bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <value.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{value.description}</p>
                </div>
              ))}
          </div>
        </div>


        {/* Team */}
        <div>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                <span className="w-1 h-12 bg-gradient-to-b from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-full"></span>
                Meet Our Team
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                The passionate leaders driving healthcare innovation across Africa
              </p>
            </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
                <div key={index} className="group bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="w-24 h-24 bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl group-hover:scale-110 transition-transform duration-300">
                    {member.image}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{member.name}</h3>
                  <p className="text-[var(--color-primary-teal)] dark:text-[var(--color-accent-sky)] font-semibold mb-4">{member.role}</p>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{member.bio}</p>
                <a 
                  href={`https://${member.linkedin}`} 
                    className="inline-flex items-center gap-2 text-[var(--color-primary-teal)] dark:text-[var(--color-accent-sky)] hover:gap-3 transition-all duration-200 font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn Profile
                    <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-[var(--color-primary-light)]/20 to-[var(--color-accent-sky)]/20 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-2xl p-12 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Ready to Transform African Healthcare?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Join thousands of healthcare innovators, investors, and policymakers who trust Medarion 
                for comprehensive African healthcare data and insights.
              </p>
              <div className="flex flex-row gap-4 justify-center">
                <a 
                  href="https://medarion.africa" 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] text-white py-4 px-8 rounded-2xl font-semibold hover:opacity-90 transition-all duration-200 shadow-lg text-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Our Platform
                  <ArrowRight className="h-5 w-5" />
                </a>
                <button className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-[var(--color-primary-teal)] py-4 px-8 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-lg text-lg border-2 border-[var(--color-primary-teal)]">
                  Learn More
                  <Star className="h-5 w-5" />
                </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;