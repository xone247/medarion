import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Ensure advertisements and ad_events tables exist
async function ensureAdsTables() {
  try {
    // Create advertisements table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        advertiser VARCHAR(255) DEFAULT NULL,
        image_url TEXT NOT NULL,
        cta_text VARCHAR(100) DEFAULT 'Learn more',
        target_url TEXT NOT NULL,
        category VARCHAR(64) NOT NULL,
        placements JSON NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        priority INT DEFAULT 0,
        start_date DATETIME DEFAULT NULL,
        end_date DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_is_active (is_active),
        INDEX idx_priority (priority),
        INDEX idx_dates (start_date, end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create ad_events table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ad_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ad_id INT NOT NULL,
        event_type ENUM('view','click') NOT NULL,
        placement VARCHAR(64) DEFAULT NULL,
        category VARCHAR(64) DEFAULT NULL,
        user_agent TEXT NULL,
        ip_address VARCHAR(64) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ad_id (ad_id),
        INDEX idx_event_type (event_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  } catch (error) {
    console.error('[Ads] Error ensuring tables:', error.message);
  }
}

// Initialize tables on startup
ensureAdsTables();

/**
 * GET /api/ads
 * Get sponsored ads (backward compatibility with get_ads.php)
 * Query params: position, limit
 */
router.get('/', async (req, res) => {
  try {
    const { position, limit = 10 } = req.query;
    const limitNum = parseInt(limit, 10) || 10;

    // Check if sponsored_ads table exists
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'sponsored_ads'"
    );
    
    if (tables.length === 0) {
      return res.json({
        success: true,
        ads: []
      });
    }

    // Build query
    let sql = `SELECT id, title, description, image_url, link_url, position, priority
               FROM sponsored_ads
               WHERE is_active = 1`;
    const params = [];

    if (position) {
      sql += ' AND position = ?';
      params.push(position);
    }

    sql += ' ORDER BY priority DESC, id DESC LIMIT ?';
    params.push(limitNum);

    const [ads] = await pool.execute(sql, params);

    res.json({
      success: true,
      ads: ads
    });
  } catch (error) {
    console.error('[Ads] Error fetching sponsored ads:', error.message);
    res.json({
      success: true,
      ads: []
    });
  }
});

/**
 * GET /api/ads/public
 * Public endpoint to fetch active advertisements
 * Query params: placement, category, limit
 */
router.get('/public', async (req, res) => {
  try {
    const { placement, category, limit = 10 } = req.query;
    const limitNum = parseInt(limit, 10) || 10;

    // Check if advertisements table exists
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'advertisements'"
    );
    
    if (tables.length === 0) {
      return res.json({
        success: true,
        ads: []
      });
    }

    // Build query conditions
    const conditions = ['is_active = 1'];
    const params = [];

    // Date range check
    conditions.push("(start_date IS NULL OR start_date <= NOW())");
    conditions.push("(end_date IS NULL OR end_date >= NOW())");

    // Placement filter (check JSON array)
    if (placement) {
      conditions.push("(JSON_SEARCH(placements, 'one', ?) IS NOT NULL OR placements LIKE ?)");
      params.push(placement);
      params.push(`%"${placement}"%`);
    }

    // Category filter
    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }

    const whereClause = conditions.join(' AND ');

    // Execute query
    const [ads] = await pool.execute(
      `SELECT * FROM advertisements 
       WHERE ${whereClause} 
       ORDER BY priority DESC, RAND() 
       LIMIT ?`,
      [...params, limitNum]
    );

    // Format advertisements
    const formattedAds = ads.map(ad => ({
      id: parseInt(ad.id, 10),
      title: ad.title || '',
      advertiser: ad.advertiser || '',
      image_url: ad.image_url || '',
      cta_text: ad.cta_text || 'Learn more',
      target_url: ad.target_url || '#',
      category: ad.category || '',
      placements: typeof ad.placements === 'string' 
        ? JSON.parse(ad.placements || '[]') 
        : (ad.placements || []),
      is_active: Boolean(ad.is_active),
      priority: parseInt(ad.priority, 10) || 0
    }));

    res.json({
      success: true,
      ads: formattedAds
    });
  } catch (error) {
    console.error('[Ads] Error fetching ads:', error.message);
    // Return empty array instead of error to prevent page breakage
    res.json({
      success: true,
      ads: []
    });
  }
});

/**
 * GET /api/ads/random
 * Get random ad for placement and tier (backward compatibility)
 * Query params: placement, tier
 */
router.get('/random', async (req, res) => {
  try {
    const { placement = 'sidebar', tier = 'free' } = req.query;

    // Check if advertisements table exists
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'advertisements'"
    );
    
    if (tables.length === 0) {
      return res.json({
        success: false,
        message: 'No ads available'
      });
    }

    // Get random ad for placement and tier
    const [ads] = await pool.execute(
      `SELECT * FROM advertisements 
       WHERE is_active = 1 
       AND (target_tier = ? OR target_tier = 'all' OR target_tier IS NULL)
       AND (JSON_SEARCH(placements, 'one', ?) IS NOT NULL OR placements LIKE ?)
       AND (start_date IS NULL OR start_date <= NOW())
       AND (end_date IS NULL OR end_date >= NOW())
       ORDER BY RAND() 
       LIMIT 1`,
      [tier, placement, `%"${placement}"%`]
    );

    if (ads.length > 0) {
      const ad = ads[0];
      res.json({
        success: true,
        ad: {
          id: parseInt(ad.id, 10),
          title: ad.title || '',
          advertiser: ad.advertiser || '',
          image_url: ad.image_url || '',
          cta_text: ad.cta_text || 'Learn more',
          target_url: ad.target_url || '#',
          category: ad.category || '',
          placements: typeof ad.placements === 'string' 
            ? JSON.parse(ad.placements || '[]') 
            : (ad.placements || []),
          target_tier: ad.target_tier || 'all'
        }
      });
    } else {
      res.json({
        success: false,
        message: 'No ads available'
      });
    }
  } catch (error) {
    console.error('[Ads] Error fetching random ad:', error.message);
    res.json({
      success: false,
      message: 'No ads available'
    });
  }
});

/**
 * POST /api/ads/track
 * Track ad events (views and clicks)
 * Body: { ad_id, event_type, placement, category }
 */
router.post('/track', async (req, res) => {
  try {
    const { ad_id, event_type, placement, category } = req.body;

    if (!ad_id || !event_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing ad_id or event_type'
      });
    }

    // Validate event_type
    if (event_type !== 'view' && event_type !== 'click') {
      return res.status(400).json({
        success: false,
        error: 'Invalid event_type. Must be "view" or "click"'
      });
    }

    // Ensure ad_events table exists
    await ensureAdsTables();

    // Get user info
    const userAgent = req.get('user-agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';

    // Insert event
    await pool.execute(
      `INSERT INTO ad_events (ad_id, event_type, placement, category, user_agent, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        parseInt(ad_id, 10),
        event_type,
        placement ? String(placement).substring(0, 64) : null,
        category ? String(category).substring(0, 64) : null,
        userAgent,
        ipAddress
      ]
    );

    res.json({
      success: true
    });
  } catch (error) {
    console.error('[Ads] Error tracking event:', error.message);
    // Return success even on error to not break frontend
    res.json({
      success: true
    });
  }
});

/**
 * POST /api/ads/click
 * Track ad clicks (backward compatibility with AdBanner)
 * Body: { ad_id, placement, page_url, user_id }
 */
router.post('/click', async (req, res) => {
  try {
    const { ad_id, placement, page_url, user_id } = req.body;

    if (!ad_id || !placement) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    await ensureAdsTables();

    const userAgent = req.get('user-agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';

    // Track as click event
    await pool.execute(
      `INSERT INTO ad_events (ad_id, event_type, placement, user_agent, ip_address) 
       VALUES (?, 'click', ?, ?, ?)`,
      [parseInt(ad_id, 10), String(placement).substring(0, 64), userAgent, ipAddress]
    );

    res.json({
      success: true,
      message: 'Click recorded'
    });
  } catch (error) {
    console.error('[Ads] Error tracking click:', error.message);
    res.json({
      success: true
    });
  }
});

/**
 * POST /api/ads/impression
 * Track ad impressions (backward compatibility with AdBanner)
 * Body: { ad_id, placement, page_url, user_id }
 */
router.post('/impression', async (req, res) => {
  try {
    const { ad_id, placement, page_url, user_id } = req.body;

    if (!ad_id || !placement) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    await ensureAdsTables();

    const userAgent = req.get('user-agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';

    // Track as view event
    await pool.execute(
      `INSERT INTO ad_events (ad_id, event_type, placement, user_agent, ip_address) 
       VALUES (?, 'view', ?, ?, ?)`,
      [parseInt(ad_id, 10), String(placement).substring(0, 64), userAgent, ipAddress]
    );

    res.json({
      success: true,
      message: 'Impression recorded'
    });
  } catch (error) {
    console.error('[Ads] Error tracking impression:', error.message);
    res.json({
      success: true
    });
  }
});

export default router;

