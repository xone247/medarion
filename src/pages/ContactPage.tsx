import React, { useState } from 'react';
import { Globe, Mail, Phone, MapPin, Send, ArrowLeft, MessageSquare, Calendar, ChevronDown, Clock, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ContactPageProps {
  onBack: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
        inquiryType: 'general'
      });
    }, 3000);
  };

  const offices = [
    {
      city: 'Lagos',
      country: 'Nigeria',
      address: '88 Reindei, Lagos, Nigeria',
      phone: '+234 800 523 4087',
      email: 'lagos@medarion.com',
      flag: '🇳🇬',
      description: 'Our headquarters and main operations center'
    },
    {
      city: 'Nairobi',
      country: 'Kenya',
      address: '400 Meadows, Nairobi, Kenya',
      phone: '+254 700 123 456',
      email: 'nairobi@medarion.com',
      flag: '🇰🇪',
      description: 'East Africa regional office'
    },
    {
      city: 'Cape Town',
      country: 'South Africa',
      address: 'Cape Town, South Africa',
      phone: '+27 21 123 4567',
      email: 'capetown@medarion.com',
      flag: '🇿🇦',
      description: 'Southern Africa regional office'
    }
  ];

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'partnership', label: 'Partnership Opportunities' },
    { value: 'investment', label: 'Investment Information' },
    { value: 'data', label: 'Data Access & API' },
    { value: 'press', label: 'Press & Media' },
    { value: 'support', label: 'Technical Support' }
  ];

  const faqs = [
    {
      question: 'How can I access Medarion\'s data?',
      answer: 'You can sign up for our platform to access comprehensive African healthcare data. We offer different subscription tiers based on your needs.'
    },
    {
      question: 'Do you provide API access?',
      answer: 'Yes, we offer API access for enterprise customers. Contact our sales team to discuss your specific requirements and integration needs.'
    },
    {
      question: 'How often is your data updated?',
      answer: 'Our data is updated continuously, with most datasets refreshed daily. Real-time data feeds are available for premium subscribers.'
    },
    {
      question: 'Can I contribute data to your platform?',
      answer: 'Absolutely! We welcome data contributions from verified sources. Please contact us to discuss data partnership opportunities.'
    },
    {
      question: 'What types of data do you provide?',
      answer: 'We provide comprehensive data on companies, deals, grants, clinical trials, investors, regulatory information, public markets, clinical centers, investigators, and nation pulse indicators across African healthcare markets.'
    },
    {
      question: 'How accurate is your data?',
      answer: 'We maintain the highest standards of data accuracy and reliability. Our data is sourced from verified sources and continuously validated to ensure quality.'
    },
    {
      question: 'Can I export data from the platform?',
      answer: 'Yes, export functionality is available based on your subscription tier. Free accounts have limited exports, while paid accounts have 20 exports per day. Company accounts have custom export limits.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit cards, bank transfers, and other payment methods. Contact our sales team for enterprise payment options.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'Yes, we offer a free starter tier that gives you access to essential features. You can upgrade anytime as your needs grow.'
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period.'
    },
    {
      question: 'Do you offer training or onboarding?',
      answer: 'Yes, we provide comprehensive onboarding and training for enterprise customers. Contact our customer support team to schedule a session.'
    },
    {
      question: 'What countries are covered in your database?',
      answer: 'We cover 35+ African countries with comprehensive healthcare data including companies, deals, clinical trials, and market intelligence.'
    },
    {
      question: 'Can I integrate Medarion data with my existing systems?',
      answer: 'Yes, our API allows seamless integration with your existing systems. Enterprise customers can work with our technical team for custom integrations.'
    },
    {
      question: 'What is the difference between Arion, M-Index, and Ergon?',
      answer: 'Arion provides healthcare insights and analysis, M-Index is our healthcare terms database, and Ergon is our AI-driven recruitment platform for hiring talent across Africa.'
    },
    {
      question: 'How do I report data errors or discrepancies?',
      answer: 'You can report data issues through our platform or contact our technical support team. We take data accuracy seriously and will investigate all reports promptly.'
    },
    {
      question: 'Do you provide custom reports?',
      answer: 'Yes, our Report & Advisory service provides on-demand reports and advisory services across industries and countries. Contact us to discuss your specific needs.'
    },
    {
      question: 'What security measures do you have in place?',
      answer: 'We implement enterprise-grade security including encryption, secure authentication, and regular security audits to protect your data and our platform.'
    },
    {
      question: 'Can I access historical data?',
      answer: 'Yes, our platform includes historical data going back several years, allowing you to track trends and analyze changes over time.'
    },
    {
      question: 'How do I get support if I have technical issues?',
      answer: 'You can reach our technical support team at technical@medarion.com or use our live chat feature available 9 AM - 6 PM WAT.'
    },
    {
      question: 'Are there any data usage restrictions?',
      answer: 'Usage restrictions depend on your subscription tier. Free accounts have basic limits, while paid and enterprise accounts have higher limits. Check our pricing page for details.'
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background-default)] transition-colors duration-500">
      {/* Hero Section */}
      <div className="page-hero">
        <div aria-hidden className="page-hero-bg">
          <img
            src={(import.meta as any).env?.VITE_CONTACT_HERO_URL || (import.meta as any).env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
            alt=""
          />
          <div className="page-hero-overlay" />
          <div className="page-hero-gradient" />
        </div>
        
        <div className="page-hero-content">
          <div className="page-hero-content-inner">
            <h1 className="page-hero-heading">
              Get in Touch
            </h1>
            <p className="page-hero-subtext">
              Have questions about our platform or partnerships? Connect with our team, we'd love to hear from you!
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto">
        {/* Contact Form & Info Section */}
        <section 
          className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
          }}
        >
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16 items-start">
              {/* Contact Form */}
              <div className="p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] shadow-sm hover:shadow-md transition-shadow duration-300">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-[var(--color-text-primary)] mb-6 sm:mb-8">Send us a Message</h2>
                
                {submitted ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6 rounded-full bg-green-100 dark:bg-green-500/40">
                      <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-[var(--color-text-primary)] mb-2 sm:mb-3">Message Sent!</h3>
                    <p className="text-sm sm:text-base text-[var(--color-text-secondary)] px-4">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-[var(--color-text-primary)] mb-1.5 sm:mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-[var(--color-divider-gray)] rounded-lg sm:rounded-xl bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all"
                          placeholder="Your full name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-[var(--color-text-primary)] mb-1.5 sm:mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-[var(--color-divider-gray)] rounded-lg sm:rounded-xl bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-[var(--color-text-primary)] mb-1.5 sm:mb-2">
                          Company/Organization
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-[var(--color-divider-gray)] rounded-lg sm:rounded-xl bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all"
                          placeholder="Your company name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-[var(--color-text-primary)] mb-1.5 sm:mb-2">
                          Inquiry Type
                        </label>
                        <select
                          value={formData.inquiryType}
                          onChange={(e) => handleInputChange('inquiryType', e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-[var(--color-divider-gray)] rounded-lg sm:rounded-xl bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all"
                        >
                          {inquiryTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--color-text-primary)] mb-1.5 sm:mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-[var(--color-divider-gray)] rounded-lg sm:rounded-xl bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all"
                        placeholder="Brief subject of your inquiry"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--color-text-primary)] mb-1.5 sm:mb-2">
                        Message *
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-[var(--color-divider-gray)] rounded-lg sm:rounded-xl bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all resize-none"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary-elevated py-3 sm:py-3.5 px-6 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                <div className="p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-[var(--color-text-primary)] mb-6 sm:mb-8">Quick Contact</h3>
                  <div className="space-y-4 sm:space-y-5 md:space-y-6">
                    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-[var(--color-background-default)] transition-colors">
                      <div className="p-2 sm:p-2.5 rounded-lg bg-[var(--color-primary-teal)]/10 dark:bg-white/10 flex-shrink-0">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary-teal)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-[var(--color-text-primary)] font-medium mb-1">Customer Support</p>
                        <a href="mailto:customer@medarion.com" className="text-xs sm:text-sm text-[var(--color-primary-teal)] hover:underline break-all">
                          customer@medarion.com
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-[var(--color-background-default)] transition-colors">
                      <div className="p-2 sm:p-2.5 rounded-lg bg-[var(--color-primary-teal)]/10 dark:bg-white/10 flex-shrink-0">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary-teal)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-[var(--color-text-primary)] font-medium mb-1">Technical Support</p>
                        <a href="mailto:technical@medarion.com" className="text-xs sm:text-sm text-[var(--color-primary-teal)] hover:underline break-all">
                          technical@medarion.com
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-[var(--color-background-default)] transition-colors">
                      <div className="p-2 sm:p-2.5 rounded-lg bg-[var(--color-primary-teal)]/10 dark:bg-white/10 flex-shrink-0">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary-teal)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-[var(--color-text-primary)] font-medium mb-1">Live Chat</p>
                        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Available 9 AM - 6 PM WAT</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-[var(--color-background-default)] transition-colors">
                      <div className="p-2 sm:p-2.5 rounded-lg bg-[var(--color-primary-teal)]/10 dark:bg-white/10 flex-shrink-0">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary-teal)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-[var(--color-text-primary)] font-medium mb-1">Schedule a Demo</p>
                        <a href="#" className="text-xs sm:text-sm text-[var(--color-primary-teal)] hover:underline">
                          Book a meeting
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response Time */}
                <div className="p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] shadow-sm">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-[var(--color-primary-teal)]/10 dark:bg-white/10 flex-shrink-0">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary-teal)]" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)] mb-2 sm:mb-3">Response Time</h4>
                      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        We typically respond to all inquiries within 24 hours during business days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Office Locations Section */}
        <section 
          className="py-12 sm:py-16 md:py-20 lg:py-24 border-b border-[var(--color-divider-gray)]/20 transition-colors duration-500"
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#F9F7F4'
          }}
        >
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal text-[var(--color-text-primary)] text-center mb-8 sm:mb-12 md:mb-16 tracking-tight leading-tight">Our Offices</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {offices.map((office, index) => (
                <div key={index} className="p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-[var(--color-divider-gray)]/20 bg-white dark:bg-[var(--color-background-default)] shadow-sm hover:shadow-lg hover:border-[var(--color-primary-teal)]/30 transition-all duration-300">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <span className="text-3xl sm:text-4xl">{office.flag}</span>
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl font-medium text-[var(--color-text-primary)]">{office.city}</h3>
                      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">{office.country}</p>
                    </div>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4 sm:mb-6 leading-relaxed">{office.description}</p>
                  
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--color-primary-teal)] mt-0.5 sm:mt-1 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">{office.address}</span>
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--color-primary-teal)] flex-shrink-0" />
                      <a href={`tel:${office.phone}`} className="text-xs sm:text-sm text-[var(--color-primary-teal)] hover:underline break-all">
                        {office.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--color-primary-teal)] flex-shrink-0" />
                      <a href={`mailto:${office.email}`} className="text-xs sm:text-sm text-[var(--color-primary-teal)] hover:underline break-all">
                        {office.email}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section 
          className="py-12 sm:py-16 md:py-20 lg:py-24 transition-colors duration-500"
          style={{ 
            backgroundColor: theme === 'dark' ? 'var(--color-background-default)' : '#FFFFFF'
          }}
        >
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal text-[var(--color-text-primary)] text-center mb-8 sm:mb-12 md:mb-16 tracking-tight leading-tight">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 max-w-7xl mx-auto">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div 
                    key={index} 
                    className="rounded-xl sm:rounded-2xl border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] shadow-sm hover:shadow-md hover:border-[var(--color-primary-teal)]/30 transition-all duration-300 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-4 sm:p-5 md:p-6 flex items-center justify-between gap-3 text-left hover:bg-[var(--color-background-default)]/50 transition-colors"
                    >
                      <h3 className="text-sm sm:text-base md:text-lg font-medium text-[var(--color-text-primary)] pr-2 flex-1 leading-snug">
                        {faq.question}
                      </h3>
                      <ChevronDown 
                        className={`h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary-teal)] flex-shrink-0 transition-transform duration-300 ${
                          isOpen ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 pt-0">
                        <p className="text-xs sm:text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactPage;
