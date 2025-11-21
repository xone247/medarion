import React, { useState } from 'react';
import { Globe, Mail, Phone, MapPin, Send, ArrowLeft, MessageSquare, Calendar } from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
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
      address: '123 Victoria Island, Lagos, Nigeria',
      phone: '+234 800 123 4567',
      email: 'lagos@medarion.com',
      flag: '🇳🇬',
      description: 'Our headquarters and main operations center'
    },
    {
      city: 'Nairobi',
      country: 'Kenya',
      address: '456 Westlands, Nairobi, Kenya',
      phone: '+254 700 123 456',
      email: 'nairobi@medarion.com',
      flag: '🇰🇪',
      description: 'East Africa regional office'
    },
    {
      city: 'Cape Town',
      country: 'South Africa',
      address: '789 Waterfront, Cape Town, South Africa',
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
    }
  ];

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
            src={(import.meta as any).env?.VITE_CONTACT_HERO_URL || (import.meta as any).env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
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
              Get in Touch
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
              Have questions about our platform or partnerships? We'd love to hear from you—reach out to our team across Africa.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">

        {/* Contact Form & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h2>
            
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Message Sent!</h3>
                <p className="text-gray-600 dark:text-gray-400">Thank you for reaching out. We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company/Organization
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Your company name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Inquiry Type
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => handleInputChange('inquiryType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {inquiryTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Brief subject of your inquiry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 border border-primary-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Contact</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">General Inquiries</p>
                    <a href="mailto:hello@medarion.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                      hello@medarion.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Phone Support</p>
                    <a href="tel:+2348001234567" className="text-primary-600 dark:text-primary-400 hover:underline">
                      +234 800 123 4567
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Live Chat</p>
                    <p className="text-gray-600 dark:text-gray-400">Available 9 AM - 6 PM WAT</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Schedule a Demo</p>
                    <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                      Book a meeting
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-primary-200 dark:border-primary-800">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Response Time</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                We typically respond to all inquiries within 24 hours during business days. 
                For urgent matters, please call our phone support line.
              </p>
            </div>
          </div>
        </div>

        {/* Office Locations */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Our Offices</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {offices.map((office, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">{office.flag}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{office.city}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{office.country}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{office.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{office.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${office.phone}`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      {office.phone}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${office.email}`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      {office.email}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{faq.question}</h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;