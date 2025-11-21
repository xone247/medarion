import express from 'express';
import pool from '../config/database.js';
import nodemailer from 'nodemailer';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ==================== DATABASE MIGRATIONS ====================

async function ensureNewsletterTables() {
  const connection = await pool.getConnection();
  try {
    // Create newsletter_subscriptions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) DEFAULT NULL,
        company VARCHAR(255) DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at TIMESTAMP NULL DEFAULT NULL,
        source VARCHAR(100) DEFAULT NULL,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_is_active (is_active),
        INDEX idx_subscribed_at (subscribed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create newsletter_email_config table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS newsletter_email_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        smtp_host VARCHAR(255) NOT NULL,
        smtp_port INT NOT NULL DEFAULT 587,
        smtp_secure BOOLEAN DEFAULT TRUE,
        smtp_user VARCHAR(255) NOT NULL,
        smtp_password VARCHAR(500) NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        from_name VARCHAR(255) NOT NULL DEFAULT 'Medarion Newsletter',
        reply_to VARCHAR(255) DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_tested_at TIMESTAMP NULL DEFAULT NULL,
        test_result VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create newsletter_campaigns table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS newsletter_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        preview_text VARCHAR(500) DEFAULT NULL,
        content_html TEXT NOT NULL,
        content_text TEXT DEFAULT NULL,
        template_name VARCHAR(100) DEFAULT 'modern',
        recipient_segment VARCHAR(50) DEFAULT 'all',
        status ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled') DEFAULT 'draft',
        scheduled_at TIMESTAMP NULL DEFAULT NULL,
        sent_at TIMESTAMP NULL DEFAULT NULL,
        total_recipients INT DEFAULT 0,
        sent_count INT DEFAULT 0,
        opened_count INT DEFAULT 0,
        clicked_count INT DEFAULT 0,
        bounced_count INT DEFAULT 0,
        unsubscribed_count INT DEFAULT 0,
        metadata JSON DEFAULT NULL,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_scheduled_at (scheduled_at),
        INDEX idx_sent_at (sent_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create newsletter_campaign_stats table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS newsletter_campaign_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        subscriber_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        opened_at TIMESTAMP NULL DEFAULT NULL,
        clicked_at TIMESTAMP NULL DEFAULT NULL,
        bounced BOOLEAN DEFAULT FALSE,
        bounce_reason VARCHAR(500) DEFAULT NULL,
        unsubscribed BOOLEAN DEFAULT FALSE,
        INDEX idx_campaign_id (campaign_id),
        INDEX idx_subscriber_id (subscriber_id),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } finally {
    connection.release();
  }
}

// ==================== EMAIL CONFIGURATION ====================

async function getEmailConfig() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM newsletter_email_config WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
}

async function createEmailTransporter(config) {
  if (!config) {
    throw new Error('Email configuration not found');
  }

  return nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_secure,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_password,
    },
  });
}

// ==================== PUBLIC ROUTES ====================

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    const { email, name, company, source } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }

    try {
      // Check if subscriber exists
      const [existing] = await connection.execute(
        'SELECT * FROM newsletter_subscriptions WHERE email = ?',
        [email.toLowerCase().trim()]
      );

      if (existing.length > 0) {
        const subscriber = existing[0];
        
        // If inactive, reactivate
        if (!subscriber.is_active) {
          await connection.execute(
            'UPDATE newsletter_subscriptions SET is_active = TRUE, subscribed_at = CURRENT_TIMESTAMP, unsubscribed_at = NULL, name = COALESCE(?, name), company = COALESCE(?, company), source = COALESCE(?, source) WHERE id = ?',
            [name || null, company || null, source || null, subscriber.id]
          );
          return res.json({ success: true, message: 'Subscription reactivated successfully' });
        }
        
        return res.json({ success: true, message: 'You are already subscribed' });
      }

      // Create new subscription
      await connection.execute(
        'INSERT INTO newsletter_subscriptions (email, name, company, source) VALUES (?, ?, ?, ?)',
        [email.toLowerCase().trim(), name || null, company || null, source || null]
      );

      // Send welcome email if config exists
      try {
        const emailConfig = await getEmailConfig();
        if (emailConfig) {
          const transporter = await createEmailTransporter(emailConfig);
          await transporter.sendMail({
            from: `"${emailConfig.from_name}" <${emailConfig.from_email}>`,
            to: email,
            subject: 'Welcome to Medarion Newsletter',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #00665C;">Welcome to Medarion Newsletter!</h2>
                <p>Thank you for subscribing to our newsletter. You'll receive the latest healthcare insights and platform updates.</p>
                <p>Best regards,<br>The Medarion Team</p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the subscription if email fails
      }

      res.json({ success: true, message: 'Successfully subscribed to newsletter' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    try {
      await connection.execute(
        'UPDATE newsletter_subscriptions SET is_active = FALSE, unsubscribed_at = CURRENT_TIMESTAMP WHERE email = ?',
        [email.toLowerCase().trim()]
      );

      res.json({ success: true, message: 'Successfully unsubscribed' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all subscribers
router.get('/subscribers', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    const { page = 1, limit = 50, search, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM newsletter_subscriptions WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND (email LIKE ? OR name LIKE ? OR company LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (status === 'active') {
      query += ' AND is_active = TRUE';
    } else if (status === 'inactive') {
      query += ' AND is_active = FALSE';
    }
    
    query += ' ORDER BY subscribed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    try {
      const [subscribers] = await connection.execute(query, params);
      const [countResult] = await connection.execute(
        query.replace('SELECT *', 'SELECT COUNT(*) as total').replace('ORDER BY subscribed_at DESC LIMIT ? OFFSET ?', '')
      );
      
      res.json({
        success: true,
        data: subscribers,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subscribers' });
  }
});

// Get subscription statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    try {
      const [total] = await connection.execute('SELECT COUNT(*) as total FROM newsletter_subscriptions');
      const [active] = await connection.execute('SELECT COUNT(*) as active FROM newsletter_subscriptions WHERE is_active = TRUE');
      const [thisWeek] = await connection.execute(
        'SELECT COUNT(*) as this_week FROM newsletter_subscriptions WHERE subscribed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
      );
      const [thisMonth] = await connection.execute(
        'SELECT COUNT(*) as this_month FROM newsletter_subscriptions WHERE subscribed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );
      
      res.json({
        success: true,
        stats: {
          total: total[0].total,
          active: active[0].active,
          this_week: thisWeek[0].this_week,
          this_month: thisMonth[0].this_month
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

// Update subscriber
router.put('/subscribers/:id', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    const { id } = req.params;
    const { email, name, company, is_active } = req.body;
    
    try {
      await connection.execute(
        'UPDATE newsletter_subscriptions SET email = ?, name = ?, company = ?, is_active = ? WHERE id = ?',
        [email, name || null, company || null, is_active !== undefined ? is_active : true, id]
      );
      
      res.json({ success: true, message: 'Subscriber updated successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating subscriber:', error);
    res.status(500).json({ success: false, error: 'Failed to update subscriber' });
  }
});

// Delete subscriber
router.delete('/subscribers/:id', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    const { id } = req.params;
    
    try {
      await connection.execute('DELETE FROM newsletter_subscriptions WHERE id = ?', [id]);
      res.json({ success: true, message: 'Subscriber deleted successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ success: false, error: 'Failed to delete subscriber' });
  }
});

// Get email configuration
router.get('/email-config', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const config = await getEmailConfig();
    
    if (config) {
      // Don't send password in response
      const { smtp_password, ...safeConfig } = config;
      res.json({ success: true, data: safeConfig });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error) {
    console.error('Error fetching email config:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch email configuration' });
  }
});

// Save email configuration
router.post('/email-config', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    const {
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_user,
      smtp_password,
      from_email,
      from_name,
      reply_to
    } = req.body;
    
    // Validate required fields
    if (!smtp_host || !smtp_port || !smtp_user || !smtp_password || !from_email || !from_name) {
      return res.status(400).json({ success: false, error: 'All required fields must be provided' });
    }
    
    try {
      // Test SMTP connection
      const testTransporter = nodemailer.createTransport({
        host: smtp_host,
        port: parseInt(smtp_port),
        secure: smtp_secure === true || smtp_secure === 'true',
        auth: {
          user: smtp_user,
          pass: smtp_password,
        },
      });
      
      await testTransporter.verify();
      
      // Check if config exists
      const [existing] = await connection.execute('SELECT * FROM newsletter_email_config WHERE is_active = TRUE');
      
      if (existing.length > 0) {
        // Update existing
        await connection.execute(
          `UPDATE newsletter_email_config SET
            smtp_host = ?, smtp_port = ?, smtp_secure = ?, smtp_user = ?,
            smtp_password = ?, from_email = ?, from_name = ?, reply_to = ?,
            last_tested_at = CURRENT_TIMESTAMP, test_result = 'success'
          WHERE id = ?`,
          [smtp_host, parseInt(smtp_port), smtp_secure === true || smtp_secure === 'true', smtp_user,
           smtp_password, from_email, from_name, reply_to || null, existing[0].id]
        );
      } else {
        // Create new
        await connection.execute(
          `INSERT INTO newsletter_email_config
            (smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, from_email, from_name, reply_to, last_tested_at, test_result)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'success')`,
          [smtp_host, parseInt(smtp_port), smtp_secure === true || smtp_secure === 'true', smtp_user,
           smtp_password, from_email, from_name, reply_to || null]
        );
      }
      
      res.json({ success: true, message: 'Email configuration saved and verified successfully' });
    } catch (smtpError) {
      console.error('SMTP verification failed:', smtpError);
      res.status(400).json({
        success: false,
        error: 'SMTP configuration test failed: ' + (smtpError.message || 'Unknown error')
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error saving email config:', error);
    res.status(500).json({ success: false, error: 'Failed to save email configuration' });
  }
});

// Test email configuration
router.post('/email-config/test', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const { test_email } = req.body;
    
    if (!test_email) {
      return res.status(400).json({ success: false, error: 'Test email address is required' });
    }
    
    const config = await getEmailConfig();
    if (!config) {
      return res.status(400).json({ success: false, error: 'Email configuration not found' });
    }
    
    const transporter = await createEmailTransporter(config);
    
    await transporter.sendMail({
      from: `"${config.from_name}" <${config.from_email}>`,
      to: test_email,
      subject: 'Test Email from Medarion Newsletter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #00665C;">Test Email</h2>
          <p>This is a test email from your Medarion Newsletter configuration.</p>
          <p>If you received this email, your SMTP configuration is working correctly!</p>
          <p>Best regards,<br>The Medarion Team</p>
        </div>
      `,
    });
    
    res.json({ success: true, message: `Test email sent successfully to ${test_email}` });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email: ' + (error.message || 'Unknown error')
    });
  }
});

// ==================== CAMPAIGN ROUTES ====================

// Get all campaigns
router.get('/campaigns', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    const { page = 1, limit = 50, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM newsletter_campaigns WHERE 1=1';
    const params = [];
    
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    try {
      const [campaigns] = await connection.execute(query, params);
      res.json({ success: true, data: campaigns });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaigns' });
  }
});

// Get single campaign
router.get('/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    const { id } = req.params;
    
    try {
      const [campaigns] = await connection.execute(
        'SELECT * FROM newsletter_campaigns WHERE id = ?',
        [id]
      );
      
      if (campaigns.length === 0) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      
      res.json({ success: true, data: campaigns[0] });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaign' });
  }
});

// Create or update campaign
router.post('/campaigns', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    const {
      id,
      title,
      subject,
      preview_text,
      content_html,
      content_text,
      template_name,
      recipient_segment,
      status,
      scheduled_at
    } = req.body;
    
    if (!title || !subject || !content_html) {
      return res.status(400).json({ success: false, error: 'Title, subject, and content are required' });
    }
    
    const userId = req.user && req.user.id ? req.user.id : null;
    
    try {
      if (id) {
        // Update existing campaign
        await connection.execute(
          `UPDATE newsletter_campaigns SET
            title = ?, subject = ?, preview_text = ?, content_html = ?, content_text = ?,
            template_name = ?, recipient_segment = ?, status = ?, scheduled_at = ?
          WHERE id = ?`,
          [title, subject, preview_text || null, content_html, content_text || null,
           template_name || 'modern', recipient_segment || 'all', status || 'draft',
           scheduled_at || null, id]
        );
        res.json({ success: true, message: 'Campaign updated successfully', data: { id } });
      } else {
        // Create new campaign
        const [result] = await connection.execute(
          `INSERT INTO newsletter_campaigns
            (title, subject, preview_text, content_html, content_text, template_name, recipient_segment, status, scheduled_at, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [title, subject, preview_text || null, content_html, content_text || null,
           template_name || 'modern', recipient_segment || 'all', status || 'draft',
           scheduled_at || null, userId]
        );
        res.json({ success: true, message: 'Campaign created successfully', data: { id: result.insertId } });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error saving campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to save campaign' });
  }
});

// Delete campaign
router.delete('/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    const { id } = req.params;
    
    try {
      await connection.execute('DELETE FROM newsletter_campaigns WHERE id = ?', [id]);
      res.json({ success: true, message: 'Campaign deleted successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to delete campaign' });
  }
});

// Send campaign
router.post('/campaigns/:id/send', authenticateToken, async (req, res) => {
  try {
    await ensureNewsletterTables();
    const connection = await pool.getConnection();
    
    const { id } = req.params;
    const { test_email } = req.body;
    
    try {
      // Get campaign
      const [campaigns] = await connection.execute(
        'SELECT * FROM newsletter_campaigns WHERE id = ?',
        [id]
      );
      
      if (campaigns.length === 0) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      
      const campaign = campaigns[0];
      
      // Get email config
      const emailConfig = await getEmailConfig();
      if (!emailConfig) {
        return res.status(400).json({ success: false, error: 'Email configuration not found' });
      }
      
      const transporter = await createEmailTransporter(emailConfig);
      
      if (test_email) {
        // Send test email
        await transporter.sendMail({
          from: `"${emailConfig.from_name}" <${emailConfig.from_email}>`,
          to: test_email,
          subject: campaign.subject,
          html: campaign.content_html,
          text: campaign.content_text || campaign.subject,
        });
        
        res.json({ success: true, message: `Test email sent to ${test_email}` });
      } else {
        // Send to all active subscribers
        const [subscribers] = await connection.execute(
          'SELECT * FROM newsletter_subscriptions WHERE is_active = TRUE'
        );
        
        let sentCount = 0;
        let errorCount = 0;
        
        // Update campaign status
        await connection.execute(
          'UPDATE newsletter_campaigns SET status = ?, total_recipients = ? WHERE id = ?',
          ['sending', subscribers.length, id]
        );
        
        // Send emails (in batches to avoid overwhelming the server)
        for (const subscriber of subscribers) {
          try {
            // Personalize content
            let personalizedHtml = campaign.content_html;
            if (subscriber.name) {
              personalizedHtml = personalizedHtml.replace(/\{\{name\}\}/g, subscriber.name);
              personalizedHtml = personalizedHtml.replace(/\{\{firstName\}\}/g, subscriber.name.split(' ')[0]);
            }
            
            await transporter.sendMail({
              from: `"${emailConfig.from_name}" <${emailConfig.from_email}>`,
              to: subscriber.email,
              subject: campaign.subject,
              html: personalizedHtml,
              text: campaign.content_text || campaign.subject,
            });
            
            // Record stats
            await connection.execute(
              `INSERT INTO newsletter_campaign_stats (campaign_id, subscriber_id, email)
               VALUES (?, ?, ?)`,
              [id, subscriber.id, subscriber.email]
            );
            
            sentCount++;
          } catch (emailError) {
            console.error(`Error sending to ${subscriber.email}:`, emailError);
            errorCount++;
          }
        }
        
        // Update campaign status
        await connection.execute(
          'UPDATE newsletter_campaigns SET status = ?, sent_at = CURRENT_TIMESTAMP, sent_count = ? WHERE id = ?',
          ['sent', sentCount, id]
        );
        
        res.json({
          success: true,
          message: `Campaign sent to ${sentCount} subscribers${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
          sent: sentCount,
          errors: errorCount
        });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to send campaign: ' + (error.message || 'Unknown error') });
  }
});

export default router;

