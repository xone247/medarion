// Newsletter HTML Templates - Mailchimp-level quality
// Professional, responsive, and beautifully designed

export type TemplateName = 'modern' | 'bold' | 'professional' | 'minimalist';

interface TemplateData {
  subject?: string;
  previewText?: string;
  content?: string;
  footer?: string;
  unsubscribeLink?: string;
  name?: string;
  firstName?: string;
  greeting?: string;
}

// Helper to escape HTML entities and template literal syntax
function safeString(str: any): string {
  if (!str) return '';
  const s = String(str);
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\$\{/g, '\\${')
    .replace(/\`/g, '\\`')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helper for HTML content (preserves HTML but escapes template literals)
function safeHtmlContent(str: any): string {
  if (!str) return '';
  const s = String(str);
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\$\{/g, '\\${')
    .replace(/\`/g, '\\`');
}

export function getTemplate(templateName: TemplateName): (data: TemplateData) => string {
  switch (templateName) {
    case 'modern':
      return modernTemplate;
    case 'bold':
      return boldTemplate;
    case 'professional':
      return professionalTemplate;
    case 'minimalist':
      return minimalistTemplate;
    default:
      return modernTemplate;
  }
}

// MODERN TEMPLATE - Mailchimp-style with gradient header, clean sections, and professional footer
function modernTemplate(data: TemplateData): string {
  const subject = safeString(data.subject || 'Newsletter');
  const previewText = safeString(data.previewText || '');
  const content = safeHtmlContent(data.content || '<p>Your newsletter content here.</p>');
  const footer = safeString(data.footer || 'Medarion Newsletter');
  const unsubscribeLink = safeString(data.unsubscribeLink || '#');
  const name = safeString(data.name || '');
  const firstName = safeString(data.firstName || '');
  const greeting = safeString(data.greeting || (firstName ? `Hello ${firstName}!` : 'Hello!'));

  return '<!DOCTYPE html>' +
    '<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<meta name="x-apple-disable-message-reformatting">' +
    '<meta name="color-scheme" content="light">' +
    '<meta name="supported-color-schemes" content="light">' +
    '<title>' + subject + '</title>' +
    (previewText ? '<!--[if !mso]><!--><meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no"><!--<![endif]--><style type="text/css">' +
    '/* What it does: Prevents Gmail from displaying an email preview. */' +
    'u + .body .gmail-blend-screen { background-color: #f5f5f5 !important; }' +
    'u + .body .gmail-blend-difference { background-color: #ffffff !important; }' +
    '</style>' +
    '<style type="text/css">' +
    '@media only screen and (max-width: 600px) {' +
    '  .email-container { width: 100% !important; margin: auto !important; }' +
    '  .email-body { padding: 20px !important; }' +
    '  .email-header { padding: 30px 20px !important; }' +
    '}' +
    '</style>' : '') +
    '</head>' +
    '<body style="margin: 0; padding: 0; width: 100%; word-break: break-word; -webkit-font-smoothing: antialiased; background-color: #f5f7fa;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; width: 100%; background-color: #f5f7fa;">' +
    '<tr>' +
    '<td align="center" style="padding: 40px 20px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">' +
    
    // Header with gradient
    '<tr>' +
    '<td class="email-header" style="background: linear-gradient(135deg, #00665C 0%, #00897B 50%, #00665C 100%); padding: 50px 40px; text-align: center;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td style="padding-bottom: 20px;">' +
    '<h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; line-height: 1.2; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;">' + subject + '</h1>' +
    '</td>' +
    '</tr>' +
    (previewText ? '<tr><td style="padding-top: 10px;"><p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">' + previewText + '</p></td></tr>' : '') +
    '</table>' +
    '</td>' +
    '</tr>' +
    
    // Main Content
    '<tr>' +
    '<td class="email-body" style="padding: 50px 40px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td style="padding-bottom: 25px;">' +
    '<p style="margin: 0; color: #1a1a1a; font-size: 18px; line-height: 1.6; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;">' + greeting + '</p>' +
    '</td>' +
    '</tr>' +
    '<tr>' +
    '<td>' +
    '<div style="color: #4a5568; font-size: 16px; line-height: 1.75; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;">' + content + '</div>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr>' +
    
    // Footer
    '<tr>' +
    '<td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td align="center" style="padding-bottom: 20px;">' +
    '<p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">' + footer + '</p>' +
    '<p style="margin: 0; color: #adb5bd; font-size: 12px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">' +
    'You received this email because you subscribed to our newsletter.<br>' +
    '<a href="' + unsubscribeLink + '" style="color: #00665C; text-decoration: underline;">Unsubscribe from this list</a> | ' +
    '<a href="#" style="color: #00665C; text-decoration: underline;">Update subscription preferences</a>' +
    '</p>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr>' +
    
    '</table>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</body>' +
    '</html>';
}

// BOLD TEMPLATE - High contrast, impactful design
function boldTemplate(data: TemplateData): string {
  const subject = safeString(data.subject || 'Newsletter');
  const previewText = safeString(data.previewText || '');
  const content = safeHtmlContent(data.content || '<p>Your newsletter content here.</p>');
  const footer = safeString(data.footer || 'Medarion Newsletter');
  const unsubscribeLink = safeString(data.unsubscribeLink || '#');
  const name = safeString(data.name || '');
  const firstName = safeString(data.firstName || '');
  const greeting = safeString(data.greeting || (firstName ? `Hello ${firstName}!` : 'Hello!'));

  return '<!DOCTYPE html>' +
    '<html lang="en" xmlns="http://www.w3.org/1999/xhtml">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<title>' + subject + '</title>' +
    '<style type="text/css">' +
    '@media only screen and (max-width: 600px) {' +
    '  .email-container { width: 100% !important; }' +
    '  .email-body { padding: 30px 20px !important; }' +
    '}' +
    '</style>' +
    '</head>' +
    '<body style="margin: 0; padding: 0; width: 100%; background-color: #000000; -webkit-font-smoothing: antialiased;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; width: 100%; background-color: #000000;">' +
    '<tr>' +
    '<td align="center" style="padding: 0;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #000000;">' +
    
    // Bold Header
    '<tr>' +
    '<td style="background-color: #000000; padding: 60px 40px; text-align: center; border-bottom: 4px solid #ffffff;">' +
    '<h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 900; line-height: 1.1; letter-spacing: -1.5px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;">' + subject + '</h1>' +
    (previewText ? '<p style="margin: 20px 0 0 0; color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.5; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">' + previewText + '</p>' : '') +
    '</td>' +
    '</tr>' +
    
    // Content
    '<tr>' +
    '<td class="email-body" style="padding: 60px 40px; background-color: #ffffff;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td style="padding-bottom: 30px;">' +
    '<h2 style="margin: 0; color: #000000; font-size: 28px; font-weight: 800; line-height: 1.3; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;">' + greeting + '</h2>' +
    '</td>' +
    '</tr>' +
    '<tr>' +
    '<td>' +
    '<div style="color: #1a1a1a; font-size: 17px; line-height: 1.85; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;">' + content + '</div>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr>' +
    
    // Footer
    '<tr>' +
    '<td style="padding: 40px; background-color: #1a1a1a; text-align: center;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td align="center">' +
    '<p style="margin: 0 0 12px 0; color: #ffffff; font-size: 15px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">' + footer + '</p>' +
    '<p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">' +
    '<a href="' + unsubscribeLink + '" style="color: #ffffff; text-decoration: underline;">Unsubscribe</a> | ' +
    '<a href="#" style="color: #ffffff; text-decoration: underline;">Preferences</a>' +
    '</p>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr>' +
    
    '</table>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</body>' +
    '</html>';
}

// PROFESSIONAL TEMPLATE - Corporate, elegant, formal
function professionalTemplate(data: TemplateData): string {
  const subject = safeString(data.subject || 'Newsletter');
  const previewText = safeString(data.previewText || '');
  const content = safeHtmlContent(data.content || '<p>Your newsletter content here.</p>');
  const footer = safeString(data.footer || 'Medarion Newsletter');
  const unsubscribeLink = safeString(data.unsubscribeLink || '#');
  const name = safeString(data.name || '');
  const firstName = safeString(data.firstName || '');
  const greeting = safeString(data.greeting || (firstName ? `Dear ${firstName},` : 'Dear Subscriber,'));

  return '<!DOCTYPE html>' +
    '<html lang="en" xmlns="http://www.w3.org/1999/xhtml">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<title>' + subject + '</title>' +
    '<style type="text/css">' +
    '@media only screen and (max-width: 600px) {' +
    '  .email-container { width: 100% !important; }' +
    '  .email-body { padding: 30px 20px !important; }' +
    '}' +
    '</style>' +
    '</head>' +
    '<body style="margin: 0; padding: 0; width: 100%; background-color: #f5f5f5; -webkit-font-smoothing: antialiased;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; width: 100%; background-color: #f5f5f5;">' +
    '<tr>' +
    '<td align="center" style="padding: 50px 20px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">' +
    
    // Professional Header
    '<tr>' +
    '<td style="padding: 40px 40px 30px 40px; border-bottom: 4px solid #00665C; background-color: #ffffff;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td>' +
    '<h1 style="margin: 0 0 10px 0; color: #00665C; font-size: 30px; font-weight: 600; line-height: 1.3; font-family: Georgia, \'Times New Roman\', serif;">' + subject + '</h1>' +
    (previewText ? '<p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5; font-style: italic; font-family: Georgia, \'Times New Roman\', serif;">' + previewText + '</p>' : '') +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr>' +
    
    // Content
    '<tr>' +
    '<td class="email-body" style="padding: 45px 40px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td style="padding-bottom: 25px;">' +
    '<p style="margin: 0; color: #2c3e50; font-size: 17px; line-height: 1.7; font-style: italic; font-family: Georgia, \'Times New Roman\', serif;">' + greeting + '</p>' +
    '</td>' +
    '</tr>' +
    '<tr>' +
    '<td>' +
    '<div style="color: #34495e; font-size: 16px; line-height: 1.8; font-family: Georgia, \'Times New Roman\', serif;">' + content + '</div>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr>' +
    
    // Professional Footer
    '<tr>' +
    '<td style="padding: 35px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td style="padding-bottom: 15px;">' +
    '<p style="margin: 0; color: #495057; font-size: 13px; font-weight: 600; font-family: Georgia, \'Times New Roman\', serif;">' + footer + '</p>' +
    '</td>' +
    '</tr>' +
    '<tr>' +
    '<td>' +
    '<p style="margin: 0; color: #6c757d; font-size: 12px; line-height: 1.6; font-family: Georgia, \'Times New Roman\', serif;">' +
    'This email was sent to you because you are subscribed to our newsletter.<br>' +
    'If you no longer wish to receive these emails, you may ' +
    '<a href="' + unsubscribeLink + '" style="color: #00665C; text-decoration: underline;">unsubscribe</a> at any time.' +
    '</p>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr>' +
    
    '</table>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</body>' +
    '</html>';
}

// MINIMALIST TEMPLATE - Clean, simple, focused
function minimalistTemplate(data: TemplateData): string {
  const subject = safeString(data.subject || 'Newsletter');
  const previewText = safeString(data.previewText || '');
  const content = safeHtmlContent(data.content || '<p>Your newsletter content here.</p>');
  const footer = safeString(data.footer || 'Medarion Newsletter');
  const unsubscribeLink = safeString(data.unsubscribeLink || '#');
  const name = safeString(data.name || '');
  const firstName = safeString(data.firstName || '');
  const greeting = safeString(data.greeting || (firstName ? `Hi ${firstName},` : 'Hi,'));

  return '<!DOCTYPE html>' +
    '<html lang="en" xmlns="http://www.w3.org/1999/xhtml">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<title>' + subject + '</title>' +
    '<style type="text/css">' +
    '@media only screen and (max-width: 600px) {' +
    '  .email-container { width: 100% !important; max-width: 100% !important; }' +
    '  .email-body { padding: 40px 25px !important; }' +
    '}' +
    '</style>' +
    '</head>' +
    '<body style="margin: 0; padding: 0; width: 100%; background-color: #ffffff; -webkit-font-smoothing: antialiased;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; width: 100%; background-color: #ffffff;">' +
    '<tr>' +
    '<td align="center" style="padding: 80px 20px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="520" class="email-container" style="max-width: 520px; width: 100%; margin: 0 auto; background-color: #ffffff;">' +
    
    // Minimalist Header
    '<tr>' +
    '<td style="padding-bottom: 50px; text-align: center;">' +
    '<h1 style="margin: 0; color: #1a1a1a; font-size: 36px; font-weight: 300; line-height: 1.2; letter-spacing: 3px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;">' + subject + '</h1>' +
    (previewText ? '<p style="margin: 20px 0 0 0; color: #999999; font-size: 13px; line-height: 1.5; letter-spacing: 1px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">' + previewText + '</p>' : '') +
    '</td>' +
    '</tr>' +
    
    // Content
    '<tr>' +
    '<td class="email-body" style="padding-bottom: 60px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td style="padding-bottom: 25px;">' +
    '<p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;">' + greeting + '</p>' +
    '</td>' +
    '</tr>' +
    '<tr>' +
    '<td>' +
    '<div style="color: #555555; font-size: 15px; line-height: 1.75; font-weight: 300; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;">' + content + '</div>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr>' +
    
    // Minimalist Footer
    '<tr>' +
    '<td style="padding-top: 60px; border-top: 1px solid #e5e5e5; text-align: center;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td style="padding-bottom: 15px;">' +
    '<p style="margin: 0; color: #999999; font-size: 11px; letter-spacing: 0.5px; font-weight: 300; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">' + footer + '</p>' +
    '</td>' +
    '</tr>' +
    '<tr>' +
    '<td>' +
    '<p style="margin: 0; color: #cccccc; font-size: 10px; letter-spacing: 1px; font-weight: 300; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">' +
    '<a href="' + unsubscribeLink + '" style="color: #999999; text-decoration: none;">UNSUBSCRIBE</a>' +
    '</p>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</td>' +
    '</tr>' +
    
    '</table>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '</body>' +
    '</html>';
}
