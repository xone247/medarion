import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Send, Eye, Loader2, AlertCircle, Check } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import apiService from '../services/apiService';
import { getTemplate, type TemplateName } from '../utils/newsletterTemplates';

interface NewsletterCampaign {
  id?: number;
  title: string;
  subject: string;
  preview_text?: string;
  content_html: string;
  content_text?: string;
  template_name?: TemplateName;
  recipient_segment?: string;
  status?: string;
  scheduled_at?: string;
}

interface NewsletterComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onSend?: () => void;
  campaign?: NewsletterCampaign | null;
}

const NewsletterComposer: React.FC<NewsletterComposerProps> = ({
  isOpen,
  onClose,
  onSave,
  onSend,
  campaign
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [content, setContent] = useState('');
  const [greeting, setGreeting] = useState('');
  const [footer, setFooter] = useState('Medarion Newsletter');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName>('modern');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showTestEmail, setShowTestEmail] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recipientSegment, setRecipientSegment] = useState('all');

  // Initialize from campaign if editing
  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title || '');
      setSubject(campaign.subject || '');
      setPreviewText(campaign.preview_text || '');
      setContent(campaign.content_html || '');
      setSelectedTemplate((campaign.template_name as TemplateName) || 'modern');
      setRecipientSegment(campaign.recipient_segment || 'all');
      // Extract greeting and footer from content if possible
      setGreeting('');
      setFooter('Medarion Newsletter');
    } else {
      // Reset for new campaign
      setTitle('');
      setSubject('');
      setPreviewText('');
      setContent('');
      setGreeting('');
      setFooter('Medarion Newsletter');
      setSelectedTemplate('modern');
      setRecipientSegment('all');
    }
  }, [campaign, isOpen]);

  // Generate preview HTML
  const previewHtml = useMemo(() => {
    const template = getTemplate(selectedTemplate);
    
    // Determine greeting based on template or user input
    let finalGreeting = greeting;
    if (!finalGreeting) {
      if (selectedTemplate === 'professional') {
        finalGreeting = 'Dear Subscriber,';
      } else if (selectedTemplate === 'minimalist') {
        finalGreeting = 'Hi,';
      } else {
        finalGreeting = 'Hello!';
      }
    }
    
    const templateData = {
      subject: subject || title || 'Newsletter',
      previewText: previewText || '',
      content: content || '<p>Your newsletter content will appear here. Start typing in the editor above to see your content in this template.</p>',
      footer: footer || 'Medarion Newsletter',
      unsubscribeLink: '#',
      name: 'Subscriber',
      firstName: 'Subscriber',
      greeting: finalGreeting
    };
    
    return template(templateData);
  }, [content, title, subject, previewText, selectedTemplate, greeting, footer]);

  const handleSave = async () => {
    if (!title.trim() || !subject.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Please fill in title, subject, and content' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const campaignData = {
        id: campaign?.id,
        title: title.trim(),
        subject: subject.trim(),
        preview_text: previewText.trim() || null,
        content_html: content,
        content_text: null, // Could extract text from HTML
        template_name: selectedTemplate,
        recipient_segment: recipientSegment,
        status: 'draft'
      };

      const response = await apiService.post('/newsletter/campaigns', campaignData);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Campaign saved successfully!' });
        setTimeout(() => {
          onSave();
        }, 1000);
      } else {
        throw new Error(response.error || 'Failed to save campaign');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save campaign' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter a test email address' });
      return;
    }

    if (!title.trim() || !subject.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Please fill in title, subject, and content before sending' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      // First save the campaign
      const campaignData = {
        id: campaign?.id,
        title: title.trim(),
        subject: subject.trim(),
        preview_text: previewText.trim() || null,
        content_html: content,
        template_name: selectedTemplate,
        recipient_segment: recipientSegment,
        status: 'draft'
      };

      const saveResponse = await apiService.post('/newsletter/campaigns', campaignData);
      
      if (!saveResponse.success) {
        throw new Error('Failed to save campaign before sending');
      }

      const campaignId = saveResponse.data?.id || campaign?.id;
      
      // Send test email
      const sendResponse = await apiService.post(`/newsletter/campaigns/${campaignId}/send`, {
        test_email: testEmail.trim()
      });

      if (sendResponse.success) {
        setMessage({ type: 'success', text: `Test email sent to ${testEmail}` });
        setTestEmail('');
        setShowTestEmail(false);
      } else {
        throw new Error(sendResponse.error || 'Failed to send test email');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send test email' });
    } finally {
      setSending(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!title.trim() || !subject.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Please fill in title, subject, and content' });
      return;
    }

    if (!window.confirm('Are you sure you want to send this campaign to all subscribers?')) {
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      // First save the campaign
      const campaignData = {
        id: campaign?.id,
        title: title.trim(),
        subject: subject.trim(),
        preview_text: previewText.trim() || null,
        content_html: content,
        template_name: selectedTemplate,
        recipient_segment: recipientSegment,
        status: 'draft'
      };

      const saveResponse = await apiService.post('/newsletter/campaigns', campaignData);
      
      if (!saveResponse.success) {
        throw new Error('Failed to save campaign before sending');
      }

      const campaignId = saveResponse.data?.id || campaign?.id;
      
      // Send campaign
      const sendResponse = await apiService.post(`/newsletter/campaigns/${campaignId}/send`, {});

      if (sendResponse.success) {
        setMessage({ type: 'success', text: sendResponse.message || 'Campaign sent successfully!' });
        setTimeout(() => {
          if (onSend) onSend();
          onClose();
        }, 2000);
      } else {
        throw new Error(sendResponse.error || 'Failed to send campaign');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send campaign' });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'direction': 'rtl' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['code-block'],
      ['clean']
    ],
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--color-background-surface)] rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-[var(--color-divider-gray)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-divider-gray)]">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {campaign ? 'Edit Campaign' : 'Create Newsletter Campaign'}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Design and send professional newsletters
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-background-default)] rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., Weekly Healthcare Update"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., Your Weekly Healthcare Insights"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Preview Text
                </label>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="input w-full"
                  placeholder="Short preview text shown in email clients"
                  maxLength={150}
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {previewText.length}/150 characters
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Greeting
                </label>
                <input
                  type="text"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., Hello!, Dear Subscriber, Hi there,"
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Leave empty to use template default
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Footer Text
              </label>
              <input
                type="text"
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                className="input w-full"
                placeholder="e.g., Medarion Newsletter"
              />
            </div>

            {/* Template Selection with Previews */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                Email Template
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['modern', 'bold', 'professional', 'minimalist'] as TemplateName[]).map((template) => {
                  const isSelected = selectedTemplate === template;
                  const templateInfo = {
                    modern: { name: 'Modern', desc: 'Gradient header, clean layout', color: 'from-[var(--color-primary-teal)] to-[var(--color-primary-teal)]/80' },
                    bold: { name: 'Bold', desc: 'Black header, bold typography', color: 'from-black to-gray-900' },
                    professional: { name: 'Professional', desc: 'Formal, serif fonts', color: 'from-[var(--color-primary-teal)] to-[var(--color-primary-teal)]/90' },
                    minimalist: { name: 'Minimalist', desc: 'Simple, centered design', color: 'from-gray-100 to-gray-200' }
                  }[template];
                  
                  // Generate example preview
                  const exampleTemplate = getTemplate(template);
                  const exampleHtml = exampleTemplate({
                    subject: templateInfo.name + ' Template',
                    previewText: 'This is how your newsletter will look',
                    content: '<p>This is an example of the <strong>' + templateInfo.name + '</strong> template style.</p><p>Your content will appear here with beautiful formatting.</p>',
                    footer: 'Medarion Newsletter',
                    unsubscribeLink: '#',
                    name: 'Subscriber',
                    firstName: 'Subscriber',
                    greeting: template === 'professional' ? 'Dear Subscriber,' : template === 'minimalist' ? 'Hi,' : 'Hello!'
                  });
                  
                  return (
                    <div
                      key={template}
                      onClick={() => setSelectedTemplate(template)}
                      className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-[var(--color-primary-teal)] ring-2 ring-[var(--color-primary-teal)]/20'
                          : 'border-[var(--color-divider-gray)] hover:border-[var(--color-primary-teal)]/50'
                      } overflow-hidden bg-[var(--color-background-surface)]`}
                    >
                      {/* Template Preview - Visual Mockup */}
                      <div className="relative h-48 overflow-hidden bg-white flex flex-col shadow-sm">
                        {template === 'modern' && (
                          <>
                            <div className="h-14 bg-gradient-to-r from-[#00665C] via-[#00897B] to-[#00665C] flex items-center justify-center">
                              <span className="text-white text-xs font-bold">MODERN</span>
                            </div>
                            <div className="flex-1 p-3 space-y-2 bg-white">
                              <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                              <div className="h-2 bg-gray-200 rounded w-full"></div>
                              <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                              <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                            </div>
                            <div className="h-10 bg-gray-50 border-t border-gray-200 flex items-center justify-center">
                              <div className="h-1.5 bg-gray-300 rounded w-20"></div>
                            </div>
                          </>
                        )}
                        {template === 'bold' && (
                          <>
                            <div className="h-16 bg-black flex items-center justify-center border-b-2 border-white">
                              <span className="text-white text-xs font-black uppercase tracking-wider">BOLD</span>
                            </div>
                            <div className="flex-1 p-3 space-y-2.5 bg-white">
                              <div className="h-3 bg-gray-400 rounded w-3/4"></div>
                              <div className="h-2.5 bg-gray-300 rounded w-full"></div>
                              <div className="h-2.5 bg-gray-300 rounded w-4/5"></div>
                            </div>
                            <div className="h-10 bg-gray-900 flex items-center justify-center">
                              <div className="h-1.5 bg-gray-600 rounded w-24"></div>
                            </div>
                          </>
                        )}
                        {template === 'professional' && (
                          <>
                            <div className="h-12 border-b-4 border-[#00665C] p-3 bg-white">
                              <div className="h-4 bg-[#00665C] rounded w-36"></div>
                            </div>
                            <div className="flex-1 p-4 space-y-2 bg-white">
                              <div className="h-2.5 bg-gray-400 rounded w-1/2 italic"></div>
                              <div className="h-2 bg-gray-300 rounded w-full"></div>
                              <div className="h-2 bg-gray-300 rounded w-5/6"></div>
                              <div className="h-2 bg-gray-300 rounded w-4/5"></div>
                            </div>
                            <div className="h-10 bg-gray-50 border-t border-gray-200 p-2">
                              <div className="h-2 bg-gray-300 rounded w-32"></div>
                            </div>
                          </>
                        )}
                        {template === 'minimalist' && (
                          <>
                            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 bg-white">
                              <div className="h-5 bg-gray-400 rounded w-28"></div>
                              <div className="h-2 bg-gray-300 rounded w-36"></div>
                              <div className="h-2 bg-gray-300 rounded w-32"></div>
                              <div className="h-2 bg-gray-300 rounded w-28"></div>
                            </div>
                            <div className="h-8 border-t border-gray-300 flex items-center justify-center">
                              <div className="h-1 bg-gray-400 rounded w-16"></div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Template Info */}
                      <div className="p-3 border-t border-[var(--color-divider-gray)]">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">
                            {templateInfo.name}
                          </h4>
                          {isSelected && (
                            <Check className="h-4 w-4 text-[var(--color-primary-teal)]" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {templateInfo.desc}
                        </p>
                      </div>
                      
                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-[var(--color-primary-teal)] text-white rounded-full p-1.5">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                Click on a template to select it. The preview shows how your newsletter will look.
              </p>
            </div>

            {/* Rich Text Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                  Email Content *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    // Insert example content based on template
                    const examples = {
                      modern: '<h2>Welcome to Our Newsletter</h2><p>This is the <strong>Modern</strong> template with a beautiful gradient header and clean design.</p><p>Perfect for:</p><ul><li>Weekly updates</li><li>Product announcements</li><li>Company news</li></ul>',
                      bold: '<h2>Bold & Impactful</h2><p>This is the <strong>Bold</strong> template with striking black headers and strong typography.</p><p>Great for:</p><ul><li>Important announcements</li><li>Launch campaigns</li><li>Breaking news</li></ul>',
                      professional: '<h2>Professional Communication</h2><p>This is the <strong>Professional</strong> template with formal serif fonts and elegant styling.</p><p>Ideal for:</p><ul><li>Business updates</li><li>Industry reports</li><li>Formal communications</li></ul>',
                      minimalist: '<h2>Simple & Clean</h2><p>This is the <strong>Minimalist</strong> template with a centered, simple design.</p><p>Best for:</p><ul><li>Focused messages</li><li>Quick updates</li><li>Clean aesthetics</li></ul>'
                    };
                    setContent(examples[selectedTemplate] || examples.modern);
                  }}
                  className="text-xs text-[var(--color-primary-teal)] hover:underline"
                >
                  Insert Example Content
                </button>
              </div>
              <div className="border border-[var(--color-divider-gray)] rounded-lg overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  placeholder="Write your newsletter content here..."
                  style={{ minHeight: '300px' }}
                />
              </div>
            </div>

            {/* Recipient Segment */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Recipient Segment
              </label>
              <select
                value={recipientSegment}
                onChange={(e) => setRecipientSegment(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Subscribers</option>
                <option value="active">Active Only</option>
              </select>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                {message.type === 'success' ? (
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <p className={`text-sm ${
                  message.type === 'success'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {message.text}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[var(--color-divider-gray)] bg-[var(--color-background-default)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>
              
              {!showTestEmail ? (
                <button
                  onClick={() => setShowTestEmail(true)}
                  className="btn-outline px-4 py-2 rounded-lg"
                >
                  Send Test Email
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="input"
                    style={{ width: '200px' }}
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={sending || !testEmail.trim()}
                    className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>Send</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowTestEmail(false);
                      setTestEmail('');
                    }}
                    className="btn-outline px-2 py-2 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="btn-outline px-4 py-2 rounded-lg"
                disabled={saving || sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || sending}
                className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save Draft</span>
              </button>
              <button
                onClick={handleSendCampaign}
                disabled={saving || sending}
                className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#00665C' }}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>Send Campaign</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-divider-gray)]">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Email Preview</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Template: <span className="font-medium capitalize">{selectedTemplate}</span>
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-[var(--color-background-default)] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              <div
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                style={{ maxWidth: '600px', margin: '0 auto' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsletterComposer;

