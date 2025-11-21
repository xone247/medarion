import pool from '../config/database.js';

async function createNewsletterTables() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await pool.getConnection();
    console.log('Connected to database successfully.');
    
    // Create newsletter_subscriptions table
    console.log('\nCreating newsletter_subscriptions table...');
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
    console.log('✓ newsletter_subscriptions table created.');
    
    // Create newsletter_email_config table
    console.log('\nCreating newsletter_email_config table...');
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
    console.log('✓ newsletter_email_config table created.');
    
    // Create newsletter_campaigns table
    console.log('\nCreating newsletter_campaigns table...');
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
    console.log('✓ newsletter_campaigns table created.');
    
    // Create newsletter_campaign_stats table for tracking
    console.log('\nCreating newsletter_campaign_stats table...');
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
        FOREIGN KEY (campaign_id) REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscriptions(id) ON DELETE CASCADE,
        INDEX idx_campaign_id (campaign_id),
        INDEX idx_subscriber_id (subscriber_id),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ newsletter_campaign_stats table created.');
    
    console.log('\n✅ All newsletter tables created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('\nDatabase connection released.');
    }
  }
}

createNewsletterTables();

