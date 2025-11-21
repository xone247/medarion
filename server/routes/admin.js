import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to extract YouTube video ID from various URL formats
const extractYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const trimmed = url.trim();
  if (!trimmed) return null;
  
  // Patterns for different YouTube URL formats
  const patterns = [
    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    // Alternative watch URL formats
    /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
    // Short URL: youtu.be/VIDEO_ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Mobile URL: m.youtube.com/watch?v=VIDEO_ID
    /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }
  
  return null;
};

// Normalize YouTube URL to standard format
const normalizeYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const trimmed = url.trim();
  if (!trimmed) return null;
  
  const videoId = extractYouTubeId(trimmed);
  if (!videoId) return null;
  
  return `https://www.youtube.com/watch?v=${videoId}`;
};

// Helper function to format time ago
function timeAgo(datetime) {
  const time = Math.floor((Date.now() - new Date(datetime).getTime()) / 1000);
  if (time < 60) return 'just now';
  if (time < 3600) return `${Math.floor(time / 60)} minutes ago`;
  if (time < 86400) return `${Math.floor(time / 3600)} hours ago`;
  if (time < 2592000) return `${Math.floor(time / 86400)} days ago`;
  if (time < 31536000) return `${Math.floor(time / 2592000)} months ago`;
  return `${Math.floor(time / 31536000)} years ago`;
}

// Admin Dashboard Overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    // Get user statistics
    const [userCount] = await db.execute('SELECT COUNT(*) as total FROM users');
    const totalUsers = userCount[0]?.total || 0;
    
    const [activeCount] = await db.execute('SELECT COUNT(*) as total FROM users WHERE is_active = 1');
    const activeUsers = activeCount[0]?.total || 0;
    
    const [blogCount] = await db.execute('SELECT COUNT(*) as total FROM blog_posts');
    const blogPosts = blogCount[0]?.total || 0;
    
    const [monthUsers] = await db.execute(`
      SELECT COUNT(*) as total FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    const newUsersThisMonth = monthUsers[0]?.total || 0;
    
    // Get user roles distribution
    const [userRoles] = await db.execute(`
      SELECT 
        role,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE is_active = 1), 1) as percentage
      FROM users 
      WHERE is_active = 1 
      GROUP BY role 
      ORDER BY count DESC
    `);
    
    // Get user growth for last 6 months
    const [userGrowth] = await db.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%b') as month,
        COUNT(*) as users
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY created_at ASC
    `);
    
    // Get revenue by tier
    const [revenueByTier] = await db.execute(`
      SELECT 
        COALESCE(account_tier, 'free') as tier,
        COUNT(*) as users,
        COUNT(*) * 50 as revenue
      FROM users 
      WHERE is_active = 1 
      GROUP BY COALESCE(account_tier, 'free')
      ORDER BY revenue DESC
    `);
    
    // Get recent activity
    const [recentActivity] = await db.execute(`
      SELECT 
        'signup' as type,
        CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''), ' joined the platform') as message,
        created_at as time,
        'user' as icon
      FROM users 
      WHERE is_active = 1 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        metrics: { system_ok: true },
        userStats: {
          totalUsers: parseInt(totalUsers),
          activeUsers: parseInt(activeUsers),
          newUsersThisMonth: parseInt(newUsersThisMonth)
        },
        revenueStats: {
          totalRevenue: 0,
          monthlyRevenue: 0
        },
        blogStats: {
          blogPosts: parseInt(blogPosts)
        },
        userRoles: userRoles.map(role => ({
          role: role.role.charAt(0).toUpperCase() + role.role.slice(1).replace(/_/g, ' '),
          count: parseInt(role.count),
          percentage: parseFloat(role.percentage)
        })),
        revenueByTier: revenueByTier.map(tier => ({
          tier: tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1),
          revenue: parseFloat(tier.revenue),
          users: parseInt(tier.users)
        })),
        recentActivity: recentActivity.map(activity => ({
          type: activity.type,
          message: activity.message || 'User activity',
          time: timeAgo(activity.time),
          icon: activity.icon
        })),
        userGrowth: userGrowth.map(growth => ({
          month: growth.month,
          users: parseInt(growth.users)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin overview', error: error.message });
  }
});

// Ensure blog_posts table has required columns
async function ensureBlogPostColumns() {
  try {
    // Ensure featured_image column exists
    try {
      await db.execute(`
        ALTER TABLE blog_posts 
        ADD COLUMN featured_image VARCHAR(500) NULL
      `);
    } catch (e) {
      // Column already exists, ignore
    }

    // Ensure video_url column exists
    try {
      await db.execute(`
        ALTER TABLE blog_posts 
        ADD COLUMN video_url VARCHAR(500) NULL
      `);
    } catch (e) {
      // Column already exists, ignore
    }
  } catch (error) {
    console.error('Error ensuring blog post columns:', error);
    // Don't throw - allow the endpoint to continue
  }
}

// Ensure all tables have required image/logo columns
async function ensureImageColumns() {
  try {
    // Ensure advertisements table has image_url
    try {
      await db.execute(`
        ALTER TABLE advertisements 
        ADD COLUMN image_url VARCHAR(500) NULL
      `);
    } catch (e) {
      // Column already exists, ignore
    }

    // Ensure announcements table exists and has image_url
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS announcements (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          image_url VARCHAR(500) NULL,
          action_url VARCHAR(500) NULL,
          action_text VARCHAR(100) NULL,
          placement ENUM('blog_sidebar', 'dashboard_sidebar') DEFAULT 'blog_sidebar',
          is_active TINYINT(1) DEFAULT 1,
          expires_at DATETIME NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_placement (placement),
          INDEX idx_active_expires (is_active, expires_at),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (e) {
      // Table already exists, ensure image_url column exists
      try {
        await db.execute(`
          ALTER TABLE announcements 
          ADD COLUMN image_url VARCHAR(500) NULL
        `);
      } catch (e2) {
        // Column already exists, ignore
      }
    }

    // Ensure companies table has logo column
    try {
      await db.execute(`
        ALTER TABLE companies 
        ADD COLUMN logo VARCHAR(500) NULL
      `);
    } catch (e) {
      // Column already exists or table doesn't exist, ignore
    }

    // Ensure investors table has logo column
    try {
      await db.execute(`
        ALTER TABLE investors 
        ADD COLUMN logo VARCHAR(500) NULL
      `);
    } catch (e) {
      // Column already exists or table doesn't exist, ignore
    }
  } catch (error) {
    console.error('Error ensuring image columns:', error);
    // Don't throw - allow the endpoint to continue
  }
}

// Get all blog posts
router.get('/blog-posts', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureBlogPostColumns();
    
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT id, title, slug, content, excerpt, author_id, featured_image, category, status, published_at, created_at, updated_at, video_url
      FROM blog_posts 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM blog_posts WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [posts] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({ 
      success: true, 
      data: {
        posts: posts || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blog posts' });
  }
});

// Create blog post
router.post('/blog-posts', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureBlogPostColumns();
    
    // Log the incoming request for debugging
    console.log('[Blog Post Create] Request body:', JSON.stringify(req.body, null, 2));
    
    // Accept both imageUrl and featured_image for backward compatibility
    let { title, excerpt, content, author, category, readTime, imageUrl, featured_image, featured, status, video_url } = req.body;
    
    // Validate required fields
    if (!title || !title.trim()) {
      console.error('[Blog Post Create] Missing title');
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    
    if (!content || !content.trim()) {
      console.error('[Blog Post Create] Missing content');
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    
    // Normalize YouTube URL if provided
    if (video_url !== undefined && video_url !== null && video_url !== '') {
      if (typeof video_url === 'string' && video_url.trim()) {
        const trimmed = video_url.trim();
        const normalized = normalizeYouTubeUrl(trimmed);
        if (normalized) {
          video_url = normalized;
          console.log('[Blog Post Create] YouTube URL normalized:', normalized);
        } else {
          // If it's not a valid YouTube URL, set to null
          console.warn('[Blog Post Create] Invalid YouTube URL provided:', trimmed);
          video_url = null;
        }
      } else {
        video_url = null;
      }
    } else {
      video_url = null;
    }
    
    // Use the logged-in user's ID as author_id, or look up by author name if provided
    let authorId = req.user?.id || null;
    
    // If author name is provided and different from current user, try to find that user
    if (author && author !== req.user?.email && author !== req.user?.username) {
      try {
        const [authorUsers] = await db.execute(
          'SELECT id FROM users WHERE email = ? OR username = ? OR CONCAT(first_name, " ", last_name) = ? LIMIT 1',
          [author, author, author]
        );
        if (authorUsers.length > 0) {
          authorId = authorUsers[0].id;
        }
      } catch (lookupError) {
        console.warn('Could not lookup author by name, using current user:', lookupError.message);
        // Fall back to current user ID
      }
    }
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Use featured_image if provided, otherwise fall back to imageUrl
    const finalImageUrl = featured_image || imageUrl || '';
    
    // Prepare values for database insertion
    const insertValues = [
      title.trim(),
      slug,
      content.trim(),
      excerpt ? excerpt.trim() : '',
      authorId,
      finalImageUrl,
      category || 'General',
      status || 'draft',
      status === 'published' ? new Date() : null,
      video_url || null
    ];
    
    console.log('[Blog Post Create] Inserting with values:', {
      title: insertValues[0],
      slug: insertValues[1],
      contentLength: insertValues[2]?.length,
      excerpt: insertValues[3],
      authorId: insertValues[4],
      featured_image: insertValues[5],
      category: insertValues[6],
      status: insertValues[7],
      published_at: insertValues[8],
      video_url: insertValues[9]
    });
    
    const [result] = await db.execute(`
      INSERT INTO blog_posts (title, slug, content, excerpt, author_id, featured_image, category, status, published_at, video_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, insertValues);
    
    // Fetch created post
    const [posts] = await db.execute('SELECT * FROM blog_posts WHERE id = ?', [result.insertId]);
    
    res.json({ success: true, data: { post: posts[0] } });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ success: false, message: 'Failed to create blog post', error: error.message });
  }
});

// Update blog post
router.put('/blog-posts/:id', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureBlogPostColumns();
    
    const { id } = req.params;
    // Accept both imageUrl and featured_image for backward compatibility
    let { title, excerpt, content, author, category, readTime, imageUrl, featured_image, featured, status, video_url } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }
    
    // Normalize YouTube URL if provided
    if (video_url && typeof video_url === 'string' && video_url.trim()) {
      const normalized = normalizeYouTubeUrl(video_url.trim());
      if (normalized) {
        video_url = normalized;
      } else {
        // If it's not a valid YouTube URL, set to null
        console.warn('Invalid YouTube URL provided:', video_url);
        video_url = null;
      }
    } else {
      video_url = null;
    }
    
    // Use the logged-in user's ID as author_id, or look up by author name if provided
    let authorId = req.user?.id || null;
    
    // If author name is provided and different from current user, try to find that user
    if (author && author !== req.user?.email && author !== req.user?.username) {
      try {
        const [authorUsers] = await db.execute(
          'SELECT id FROM users WHERE email = ? OR username = ? OR CONCAT(first_name, " ", last_name) = ? LIMIT 1',
          [author, author, author]
        );
        if (authorUsers.length > 0) {
          authorId = authorUsers[0].id;
        }
      } catch (lookupError) {
        console.warn('Could not lookup author by name, using current user:', lookupError.message);
        // Fall back to current user ID
      }
    }
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Use featured_image if provided, otherwise fall back to imageUrl
    const finalImageUrl = featured_image !== undefined ? featured_image : (imageUrl || '');
    
    await db.execute(`
      UPDATE blog_posts 
      SET title = ?, slug = ?, content = ?, excerpt = ?, author_id = ?, featured_image = ?, category = ?, status = ?, video_url = ?, updated_at = NOW()
      WHERE id = ?
    `, [title, slug, content, excerpt || '', authorId, finalImageUrl, category || 'General', status || 'draft', video_url || null, id]);
    
    // Fetch updated post
    const [posts] = await db.execute('SELECT * FROM blog_posts WHERE id = ?', [id]);
    
    res.json({ success: true, data: { post: posts[0] } });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ success: false, message: 'Failed to update blog post', error: error.message });
  }
});

// Delete blog post
router.delete('/blog-posts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute('DELETE FROM blog_posts WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Blog post deleted' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ success: false, message: 'Failed to delete blog post' });
  }
});

// ==================== VIDEO MANAGEMENT ====================

// Ensure videos table exists
async function ensureVideosTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS blog_videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('[Videos] Table structure verified');
  } catch (error) {
    console.error('[Videos] Error ensuring table structure:', error);
    throw error;
  }
}

// Get all videos
router.get('/videos', authenticateToken, async (req, res) => {
  try {
    await ensureVideosTable();
    
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT id, title, description, video_url, thumbnail_url, is_active, display_order, created_at, updated_at
      FROM blog_videos 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM blog_videos WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      countQuery += ' AND (title LIKE ? OR description LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }
    
    query += ' ORDER BY display_order ASC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [videos] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: videos.map(v => ({
        ...v,
        is_active: Boolean(v.is_active)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
});

// Get all active videos (for public API)
router.get('/videos/public', async (req, res) => {
  try {
    await ensureVideosTable();
    
    const [videos] = await db.execute(`
      SELECT id, title, description, video_url, thumbnail_url, display_order, created_at
      FROM blog_videos 
      WHERE is_active = TRUE
      ORDER BY display_order ASC, created_at DESC
    `);
    
    res.json({
      success: true,
      videos: videos.map(v => ({
        ...v,
        is_active: Boolean(v.is_active)
      }))
    });
  } catch (error) {
    console.error('Error fetching public videos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
});

// Create video
router.post('/videos', authenticateToken, async (req, res) => {
  try {
    await ensureVideosTable();
    
    const { title, description, video_url, thumbnail_url, is_active, display_order } = req.body;
    
    if (!title || !video_url) {
      return res.status(400).json({ success: false, message: 'Title and video URL are required' });
    }
    
    // Normalize YouTube URL if provided
    let normalizedUrl = video_url;
    if (video_url && typeof video_url === 'string' && video_url.trim()) {
      const normalized = normalizeYouTubeUrl(video_url.trim());
      if (normalized) {
        normalizedUrl = normalized;
      } else {
        // If it's not a valid YouTube URL, keep the original (might be another video platform)
        normalizedUrl = video_url.trim();
      }
    }
    
    const [result] = await db.execute(
      `INSERT INTO blog_videos (title, description, video_url, thumbnail_url, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description ? description.trim() : null,
        normalizedUrl,
        thumbnail_url ? thumbnail_url.trim() : null,
        is_active !== undefined ? Boolean(is_active) : true,
        display_order !== undefined ? parseInt(display_order) : 0
      ]
    );
    
    const [newVideo] = await db.execute('SELECT * FROM blog_videos WHERE id = ?', [result.insertId]);
    
    res.json({ 
      success: true, 
      data: {
        ...newVideo[0],
        is_active: Boolean(newVideo[0].is_active)
      }
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ success: false, message: 'Failed to create video' });
  }
});

// Update video
router.put('/videos/:id', authenticateToken, async (req, res) => {
  try {
    await ensureVideosTable();
    const { id } = req.params;
    const { title, description, video_url, thumbnail_url, is_active, display_order } = req.body;
    
    if (!title || !video_url) {
      return res.status(400).json({ success: false, message: 'Title and video URL are required' });
    }
    
    // Normalize YouTube URL if provided
    let normalizedUrl = video_url;
    if (video_url && typeof video_url === 'string' && video_url.trim()) {
      const normalized = normalizeYouTubeUrl(video_url.trim());
      if (normalized) {
        normalizedUrl = normalized;
      } else {
        normalizedUrl = video_url.trim();
      }
    }
    
    await db.execute(
      `UPDATE blog_videos 
       SET title = ?, description = ?, video_url = ?, thumbnail_url = ?, is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title.trim(),
        description ? description.trim() : null,
        normalizedUrl,
        thumbnail_url ? thumbnail_url.trim() : null,
        is_active !== undefined ? Boolean(is_active) : true,
        display_order !== undefined ? parseInt(display_order) : 0,
        id
      ]
    );
    
    const [updatedVideo] = await db.execute('SELECT * FROM blog_videos WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      data: {
        ...updatedVideo[0],
        is_active: Boolean(updatedVideo[0].is_active)
      }
    });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ success: false, message: 'Failed to update video' });
  }
});

// Delete video
router.delete('/videos/:id', authenticateToken, async (req, res) => {
  try {
    await ensureVideosTable();
    const { id } = req.params;
    
    await db.execute('DELETE FROM blog_videos WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ success: false, message: 'Failed to delete video' });
  }
});

// Get all advertisements
router.get('/advertisements', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureImageColumns();
    
    const { page = 1, limit = 20, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT id, title, advertiser, image_url, cta_text, target_url, category, placements, is_active, priority, created_at, updated_at
      FROM advertisements 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM advertisements WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (category) {
      query += ' AND category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }
    
    query += ' ORDER BY priority ASC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [ads] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Parse JSON fields
    const parsedAds = ads.map(ad => ({
      ...ad,
      placements: ad.placements ? (typeof ad.placements === 'string' ? JSON.parse(ad.placements) : ad.placements) : [],
      is_active: Boolean(ad.is_active)
    }));
    
    res.json({ 
      success: true, 
      data: {
        advertisements: parsedAds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advertisements' });
  }
});

// Create advertisement
router.post('/advertisements', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureImageColumns();
    
    const { title, advertiser, image_url, imageUrl, cta_text, ctaText, target_url, targetUrl, category, placements, is_active, priority } = req.body;
    
    if (!title || !advertiser) {
      return res.status(400).json({ success: false, message: 'Title and advertiser are required' });
    }
    
    const [result] = await db.execute(`
      INSERT INTO advertisements (title, advertiser, image_url, cta_text, target_url, category, placements, is_active, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, 
      advertiser, 
      image_url || imageUrl || '', 
      cta_text || ctaText || '', 
      target_url || targetUrl || '', 
      category || 'general', 
      JSON.stringify(placements || []),
      is_active !== false ? 1 : 0,
      priority || 0
    ]);
    
    // Fetch created ad
    const [ads] = await db.execute('SELECT * FROM advertisements WHERE id = ?', [result.insertId]);
    const ad = ads[0];
    ad.placements = ad.placements ? (typeof ad.placements === 'string' ? JSON.parse(ad.placements) : ad.placements) : [];
    ad.is_active = Boolean(ad.is_active);
    
    res.json({ success: true, data: { ad } });
  } catch (error) {
    console.error('Error creating advertisement:', error);
    res.status(500).json({ success: false, message: 'Failed to create advertisement', error: error.message });
  }
});

// Update advertisement
router.put('/advertisements/:id', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureImageColumns();
    
    const { id } = req.params;
    const { title, advertiser, image_url, imageUrl, cta_text, ctaText, target_url, targetUrl, category, placements, is_active, priority } = req.body;
    
    await db.execute(`
      UPDATE advertisements 
      SET title = ?, advertiser = ?, image_url = ?, cta_text = ?, target_url = ?, category = ?, placements = ?, is_active = ?, priority = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      title, 
      advertiser, 
      image_url || imageUrl || '', 
      cta_text || ctaText || '', 
      target_url || targetUrl || '', 
      category || 'general', 
      JSON.stringify(placements || []),
      is_active !== false ? 1 : 0,
      priority || 0,
      id
    ]);
    
    // Fetch updated ad
    const [ads] = await db.execute('SELECT * FROM advertisements WHERE id = ?', [id]);
    const ad = ads[0];
    ad.placements = ad.placements ? (typeof ad.placements === 'string' ? JSON.parse(ad.placements) : ad.placements) : [];
    ad.is_active = Boolean(ad.is_active);
    
    res.json({ success: true, data: { ad } });
  } catch (error) {
    console.error('Error updating advertisement:', error);
    res.status(500).json({ success: false, message: 'Failed to update advertisement', error: error.message });
  }
});

// Delete advertisement
router.delete('/advertisements/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute('DELETE FROM advertisements WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Advertisement deleted' });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    res.status(500).json({ success: false, message: 'Failed to delete advertisement' });
  }
});

// Get all announcements
router.get('/announcements', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureImageColumns();
    
    const { page = 1, limit = 20, placement } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT id, title, message, image_url, action_url, action_text, placement, is_active, expires_at, created_at, updated_at
      FROM announcements 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM announcements WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (placement) {
      query += ' AND placement = ?';
      countQuery += ' AND placement = ?';
      params.push(placement);
      countParams.push(placement);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [announcements] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({ 
      success: true, 
      data: {
        announcements: announcements || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
  }
});

// Create announcement
router.post('/announcements', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureImageColumns();
    
    const { title, message, image_url, action_url, action_text, placement, expires_at, send_notification } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }
    
    const [result] = await db.execute(`
      INSERT INTO announcements (title, message, image_url, action_url, action_text, placement, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      title, 
      message, 
      image_url || '', 
      action_url || '', 
      action_text || '', 
      placement || 'blog_sidebar',
      expires_at || null
    ]);
    
    const announcementId = result.insertId;
    
    // If send_notification is true, create notifications for all users
    if (send_notification) {
      try {
        // Ensure notifications table exists
        try {
          await db.execute('SELECT 1 FROM notifications LIMIT 1');
        } catch (tableError) {
          // Table doesn't exist, create it
          await db.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              type ENUM('info', 'success', 'warning', 'error', 'system') DEFAULT 'info',
              category VARCHAR(50) DEFAULT 'system',
              is_read TINYINT(1) DEFAULT 0,
              is_important TINYINT(1) DEFAULT 0,
              action_url VARCHAR(500) NULL,
              action_text VARCHAR(100) NULL,
              metadata TEXT NULL,
              expires_at DATETIME NULL,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              INDEX idx_user_id (user_id),
              INDEX idx_is_read (is_read),
              INDEX idx_created_at (created_at),
              INDEX idx_expires_at (expires_at),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
          `);
        }
        
        const [users] = await db.execute('SELECT id FROM users WHERE is_active = 1');
        for (const user of users) {
          await db.execute(
            `INSERT INTO notifications (user_id, title, message, type, category, is_important, action_url, action_text, metadata)
             VALUES (?, ?, ?, 'info', 'announcement', 1, ?, ?, ?)`,
            [
              user.id,
              title,
              message,
              action_url || null,
              action_text || null,
              JSON.stringify({ announcement_id: announcementId })
            ]
          );
        }
        console.log(`[Announcements] Created ${users.length} notifications for announcement ${announcementId}`);
      } catch (notifError) {
        console.error('Error creating notifications for announcement:', notifError);
        // Don't fail the announcement creation if notifications fail
      }
    }
    
    // Fetch created announcement
    const [announcements] = await db.execute('SELECT * FROM announcements WHERE id = ?', [announcementId]);
    
    res.json({ success: true, data: { announcement: announcements[0] } });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: 'Failed to create announcement', error: error.message });
  }
});

// Update announcement
router.put('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, image_url, action_url, action_text, placement, expires_at, is_active } = req.body;
    
    await db.execute(`
      UPDATE announcements 
      SET title = ?, message = ?, image_url = ?, action_url = ?, action_text = ?, placement = ?, expires_at = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      title, 
      message, 
      image_url || '', 
      action_url || '', 
      action_text || '', 
      placement || 'blog_sidebar',
      expires_at || null,
      is_active !== false ? 1 : 0,
      id
    ]);
    
    // Fetch updated announcement
    const [announcements] = await db.execute('SELECT * FROM announcements WHERE id = ?', [id]);
    
    res.json({ success: true, data: { announcement: announcements[0] } });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ success: false, message: 'Failed to update announcement', error: error.message });
  }
});

// Delete announcement
router.delete('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute('DELETE FROM announcements WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ success: false, message: 'Failed to delete announcement' });
  }
});

// Get user overrides
router.get('/user-overrides', authenticateToken, async (req, res) => {
  try {
    // Check if user_overrides table exists, if not return empty array
    try {
      const [users] = await db.execute(`
        SELECT id, email, role, account_tier, full_name, company_name, is_admin, app_roles, created_at, updated_at
        FROM user_overrides 
        ORDER BY created_at DESC
      `);
      
      // Parse JSON fields
      const parsedUsers = users.map(user => ({
        ...user,
        app_roles: user.app_roles ? (typeof user.app_roles === 'string' ? JSON.parse(user.app_roles) : user.app_roles) : []
      }));
      
      res.json({ success: true, users: parsedUsers });
    } catch (tableError) {
      // If table doesn't exist, return empty array
      if (tableError.code === 'ER_NO_SUCH_TABLE') {
        console.log('user_overrides table does not exist, returning empty array');
        res.json({ success: true, users: [] });
      } else {
        throw tableError;
      }
    }
  } catch (error) {
    console.error('Error fetching user overrides:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user overrides', error: error.message });
  }
});

// Create user override
router.post('/user-overrides', authenticateToken, async (req, res) => {
  try {
    const { email, role, accountTier, fullName, companyName, isAdmin, appRoles } = req.body;
    
    const [result] = await db.execute(`
      INSERT INTO user_overrides (email, role, account_tier, full_name, company_name, is_admin, app_roles)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [email, role, accountTier, fullName, companyName, isAdmin, JSON.stringify(appRoles || [])]);
    
    res.json({ success: true, user: { id: result.insertId, email, role, accountTier, fullName, companyName, isAdmin, appRoles } });
  } catch (error) {
    console.error('Error creating user override:', error);
    res.status(500).json({ success: false, message: 'Failed to create user override' });
  }
});

// Delete user override
router.delete('/user-overrides/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute('DELETE FROM user_overrides WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'User override deleted' });
  } catch (error) {
    console.error('Error deleting user override:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user override' });
  }
});

// Get platform configuration
router.get('/platform-config', authenticateToken, async (req, res) => {
  try {
    const [configs] = await db.execute(`
      SELECT config_key, config_value, description
      FROM platform_config 
      ORDER BY config_key
    `);
    
    const config = {};
    configs.forEach(item => {
      config[item.config_key] = JSON.parse(item.config_value);
    });
    
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error fetching platform config:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch platform config' });
  }
});

// Update platform configuration
router.put('/platform-config', authenticateToken, async (req, res) => {
  try {
    const { config } = req.body;
    
    for (const [key, value] of Object.entries(config)) {
      await db.execute(`
        INSERT INTO platform_config (config_key, config_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
      `, [key, JSON.stringify(value)]);
    }
    
    res.json({ success: true, message: 'Platform config updated' });
  } catch (error) {
    console.error('Error updating platform config:', error);
    res.status(500).json({ success: false, message: 'Failed to update platform config' });
  }
});

// Get module configuration for user (from users table)
router.get('/module-config/:email', authenticateToken, async (req, res) => {
  try {
    // Decode email from URL (handles @ symbol encoding)
    const email = decodeURIComponent(req.params.email);
    
    const [users] = await db.execute(`
      SELECT dashboard_modules, module_order
      FROM users 
      WHERE email = ?
    `, [email]);
    
    if (users.length === 0) {
      return res.json({ success: true, modules: [], moduleOrder: [] });
    }
    
    const user = users[0];
    const modules = user.dashboard_modules ? JSON.parse(user.dashboard_modules) : [];
    const moduleOrder = user.module_order ? JSON.parse(user.module_order) : [];
    
    res.json({ 
      success: true, 
      modules: modules, 
      moduleOrder: moduleOrder 
    });
  } catch (error) {
    console.error('Error fetching module config:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch module config' });
  }
});

// Save module configuration for user (to users table)
router.post('/module-config', authenticateToken, async (req, res) => {
  try {
    const { email, modules, moduleOrder } = req.body;
    
    if (!email || !Array.isArray(modules) || !Array.isArray(moduleOrder)) {
      return res.status(400).json({ success: false, message: 'Invalid request data' });
    }
    
    await db.execute(`
      UPDATE users 
      SET dashboard_modules = ?, module_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `, [JSON.stringify(modules), JSON.stringify(moduleOrder), email]);
    
    res.json({ success: true, message: 'Module configuration saved' });
  } catch (error) {
    console.error('Error saving module config:', error);
    res.status(500).json({ success: false, message: 'Failed to save module config' });
  }
});

// Get active advertisements for display
router.get('/advertisements/active', async (req, res) => {
  try {
    const { placement, category } = req.query;
    
    let query = 'SELECT * FROM advertisements WHERE is_active = TRUE';
    const params = [];
    
    if (placement) {
      query += ' AND JSON_CONTAINS(placements, ?)';
      params.push(`"${placement}"`);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY priority ASC, RAND() LIMIT 5';
    
    const [ads] = await db.execute(query, params);
    
    res.json({ success: true, ads });
  } catch (error) {
    console.error('Error fetching active advertisements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advertisements' });
  }
});

// Get modules list (for admin dashboard) - Query from database
router.get('/modules', async (req, res) => {
  console.log('[Admin] GET /modules - Request received:', {
    method: req.method,
    originalUrl: req.originalUrl,
    url: req.url,
    path: req.path,
    query: req.query
  });
  try {
    const { page = 1, limit = 100, search, category, enabled } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query with filters
    let query = 'SELECT * FROM modules WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM modules WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR module_id LIKE ?)';
      countQuery += ' AND (name LIKE ? OR description LIKE ? OR module_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (category) {
      query += ' AND category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }
    
    if (enabled !== undefined && enabled !== '') {
      query += ' AND is_enabled = ?';
      countQuery += ' AND is_enabled = ?';
      params.push(enabled === 'true' ? 1 : 0);
      countParams.push(enabled === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY display_order ASC, name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    // Get total count
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get modules
    const [modules] = await db.execute(query, params);
    
    // Parse JSON fields
    const parsedModules = modules.map(module => ({
      ...module,
      required_roles: module.required_roles ? (typeof module.required_roles === 'string' ? JSON.parse(module.required_roles) : module.required_roles) : null,
      config_data: module.config_data ? (typeof module.config_data === 'string' ? JSON.parse(module.config_data) : module.config_data) : null,
      is_enabled: Boolean(module.is_enabled),
      is_core: Boolean(module.is_core)
    }));
    
    res.json({
      success: true,
      data: parsedModules, // Return 'data' not 'modules' to match frontend expectation
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch modules', error: error.message });
  }
});

// Get single module by ID or module_id
router.get('/modules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let module;
    
    // Try numeric ID first, then module_id
    if (!isNaN(id)) {
      const [modules] = await db.execute('SELECT * FROM modules WHERE id = ?', [id]);
      module = modules[0];
    } else {
      const [modules] = await db.execute('SELECT * FROM modules WHERE module_id = ?', [id]);
      module = modules[0];
    }
    
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }
    
    // Parse JSON fields
    module.required_roles = module.required_roles ? (typeof module.required_roles === 'string' ? JSON.parse(module.required_roles) : module.required_roles) : null;
    module.config_data = module.config_data ? (typeof module.config_data === 'string' ? JSON.parse(module.config_data) : module.config_data) : null;
    module.is_enabled = Boolean(module.is_enabled);
    module.is_core = Boolean(module.is_core);
    
    res.json({ success: true, data: module });
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch module', error: error.message });
  }
});

// Create new module
router.post('/modules', authenticateToken, async (req, res) => {
  try {
    const { module_id, name, description, component, icon, category, required_tier, required_roles, is_enabled, is_core, display_order, config_data, data_source } = req.body;
    
    if (!module_id || !name) {
      return res.status(400).json({ success: false, message: 'module_id and name are required' });
    }
    
    // Check if module_id already exists
    const [existing] = await db.execute('SELECT id FROM modules WHERE module_id = ?', [module_id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Module ID already exists' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO modules (module_id, name, description, component, icon, category, required_tier, required_roles, is_enabled, is_core, display_order, config_data, data_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        module_id,
        name,
        description || null,
        component || null,
        icon || null,
        category || 'core',
        required_tier || 'free',
        required_roles ? JSON.stringify(required_roles) : null,
        is_enabled !== false ? 1 : 0,
        is_core ? 1 : 0,
        display_order || 0,
        config_data ? JSON.stringify(config_data) : null,
        data_source || null
      ]
    );
    
    // Fetch created module
    const [modules] = await db.execute('SELECT * FROM modules WHERE id = ?', [result.insertId]);
    const module = modules[0];
    module.required_roles = module.required_roles ? JSON.parse(module.required_roles) : null;
    module.config_data = module.config_data ? JSON.parse(module.config_data) : null;
    module.is_enabled = Boolean(module.is_enabled);
    module.is_core = Boolean(module.is_core);
    
    res.status(201).json({ success: true, data: module, message: 'Module created successfully' });
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ success: false, message: 'Failed to create module', error: error.message });
  }
});

// Update module
router.put('/modules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if module exists
    let moduleId = id;
    if (isNaN(id)) {
      const [modules] = await db.execute('SELECT id FROM modules WHERE module_id = ?', [id]);
      if (modules.length === 0) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }
      moduleId = modules[0].id;
    }
    
    // Build update query
    const allowedFields = ['name', 'description', 'component', 'icon', 'category', 'required_tier', 'required_roles', 'is_enabled', 'display_order', 'config_data', 'data_source'];
    const updateFields = [];
    const updateValues = [];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'required_roles' || field === 'config_data') {
          updateFields.push(`${field} = ?`);
          updateValues.push(Array.isArray(updates[field]) || typeof updates[field] === 'object' ? JSON.stringify(updates[field]) : updates[field]);
        } else if (field === 'is_enabled') {
          updateFields.push(`${field} = ?`);
          updateValues.push(updates[field] ? 1 : 0);
        } else {
          updateFields.push(`${field} = ?`);
          updateValues.push(updates[field]);
        }
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(moduleId);
    
    await db.execute(
      `UPDATE modules SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Fetch updated module
    const [modules] = await db.execute('SELECT * FROM modules WHERE id = ?', [moduleId]);
    const module = modules[0];
    module.required_roles = module.required_roles ? JSON.parse(module.required_roles) : null;
    module.config_data = module.config_data ? JSON.parse(module.config_data) : null;
    module.is_enabled = Boolean(module.is_enabled);
    module.is_core = Boolean(module.is_core);
    
    res.json({ success: true, data: module, message: 'Module updated successfully' });
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ success: false, message: 'Failed to update module', error: error.message });
  }
});

// Delete module
router.delete('/modules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if module exists and is core
    let moduleId = id;
    if (isNaN(id)) {
      const [modules] = await db.execute('SELECT id, is_core FROM modules WHERE module_id = ?', [id]);
      if (modules.length === 0) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }
      if (modules[0].is_core) {
        return res.status(400).json({ success: false, message: 'Core modules cannot be deleted' });
      }
      moduleId = modules[0].id;
    } else {
      const [modules] = await db.execute('SELECT is_core FROM modules WHERE id = ?', [id]);
      if (modules.length === 0) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }
      if (modules[0].is_core) {
        return res.status(400).json({ success: false, message: 'Core modules cannot be deleted' });
      }
    }
    
    await db.execute('DELETE FROM modules WHERE id = ?', [moduleId]);
    res.json({ success: true, message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ success: false, message: 'Failed to delete module', error: error.message });
  }
});

// Bulk module operations
router.patch('/modules', authenticateToken, async (req, res) => {
  try {
    const { action, module_ids } = req.body;
    
    if (!action || !Array.isArray(module_ids) || module_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'action and module_ids array are required' });
    }
    
    const placeholders = module_ids.map(() => '?').join(',');
    
    if (action === 'enable') {
      await db.execute(`UPDATE modules SET is_enabled = 1 WHERE id IN (${placeholders})`, module_ids);
      res.json({ success: true, message: `${module_ids.length} module(s) enabled` });
    } else if (action === 'disable') {
      // Don't disable core modules
      await db.execute(`UPDATE modules SET is_enabled = 0 WHERE id IN (${placeholders}) AND is_core = 0`, module_ids);
      res.json({ success: true, message: 'Modules disabled (core modules excluded)' });
    } else if (action === 'delete') {
      // Don't delete core modules
      await db.execute(`DELETE FROM modules WHERE id IN (${placeholders}) AND is_core = 0`, module_ids);
      res.json({ success: true, message: 'Modules deleted (core modules excluded)' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action. Use: enable, disable, or delete' });
    }
  } catch (error) {
    console.error('Error in bulk module operation:', error);
    res.status(500).json({ success: false, message: 'Failed to perform bulk operation', error: error.message });
  }
});

// ============================================
// USERS ADMIN ENDPOINTS
// ============================================

// Test endpoint to verify route registration (remove in production)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Admin routes are working!' });
});

// Get all users with pagination and filters
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // Check if requester is admin - handle both is_admin flag and role check
    const isAdmin = req.user.is_admin === true || req.user.is_admin === 1 || req.user.role === 'admin' || (Array.isArray(req.user.app_roles) && req.user.app_roles.includes('super_admin'));
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden - Admin access required' });
    }

    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT id, username, email, first_name, last_name, role, user_type, account_tier, company_name, phone, country, city, is_verified, is_active, app_roles, created_at, updated_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR company_name LIKE ?)';
      countQuery += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR company_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(role);
      countParams.push(role);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [users] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Parse JSON fields
    const parsedUsers = users.map(user => ({
      ...user,
      app_roles: user.app_roles ? (typeof user.app_roles === 'string' ? JSON.parse(user.app_roles) : user.app_roles) : [],
      firstName: user.first_name,
      lastName: user.last_name,
      companyName: user.company_name,
      isVerified: user.is_verified,
      isActive: user.is_active,
      accountTier: user.account_tier,
      userType: user.user_type,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
    
    res.json({
      success: true,
      data: {
        users: parsedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

// Get single user by ID
router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if requester is admin or requesting own profile
    const isAdmin = req.user.is_admin === true || req.user.is_admin === 1 || req.user.role === 'admin' || (Array.isArray(req.user.app_roles) && req.user.app_roles.includes('super_admin'));
    if (!isAdmin && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ success: false, error: 'Forbidden - Admin access required or own profile only' });
    }

    const { id } = req.params;
    const [users] = await db.execute(
      'SELECT id, username, email, first_name, last_name, role, user_type, account_tier, company_name, phone, country, city, bio, profile_image, is_verified, is_active, app_roles, dashboard_modules, module_order, ai_quota_used, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = users[0];
    const parsedUser = {
      ...user,
      app_roles: user.app_roles ? (typeof user.app_roles === 'string' ? JSON.parse(user.app_roles) : user.app_roles) : [],
      dashboard_modules: user.dashboard_modules ? (typeof user.dashboard_modules === 'string' ? JSON.parse(user.dashboard_modules) : user.dashboard_modules) : [],
      module_order: user.module_order ? (typeof user.module_order === 'string' ? JSON.parse(user.module_order) : user.module_order) : [],
      firstName: user.first_name,
      lastName: user.last_name,
      companyName: user.company_name,
      profileImage: user.profile_image,
      isVerified: user.is_verified,
      isActive: user.is_active,
      accountTier: user.account_tier,
      userType: user.user_type,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
    
    res.json({ success: true, user: parsedUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
});

// Create new user (admin only)
router.post('/users', authenticateToken, async (req, res) => {
  try {
    // Check if requester is admin
    const isAdmin = req.user.is_admin === true || req.user.is_admin === 1 || req.user.role === 'admin' || (Array.isArray(req.user.app_roles) && req.user.app_roles.includes('super_admin'));
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden - Admin access required' });
    }

    const { username, email, password, firstName, lastName, role, userType, accountTier, companyName, phone, country, city } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    const [existing] = await db.execute('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'Username or email already exists' });
    }
    
    // Hash password
    const bcrypt = await import('bcryptjs');
    const saltRounds = 12;
    const passwordHash = await bcrypt.default.hash(password, saltRounds);
    
    const finalUserType = userType || 'startup';
    const finalAccountTier = accountTier || 'free';
    const finalRole = role || 'startup';
    
    const [result] = await db.execute(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, user_type, account_tier, company_name, phone, country, city, is_verified, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [username, email, passwordHash, firstName, lastName, finalRole, finalUserType, finalAccountTier, companyName, phone, country, city]
    );
    
    res.status(201).json({ success: true, id: result.insertId, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
});

// Update user (admin only, or user updating own profile)
router.patch('/users', authenticateToken, async (req, res) => {
  try {
    const { id, action, ...updates } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    // Check if requester is admin or updating own profile
    const isAdmin = req.user.is_admin === true || req.user.is_admin === 1 || req.user.role === 'admin' || (Array.isArray(req.user.app_roles) && req.user.app_roles.includes('super_admin'));
    if (!isAdmin && req.user.id !== parseInt(id)) {
      return res.status(403).json({ success: false, error: 'Forbidden - Admin access required or own profile only' });
    }
    
    // Handle special actions
    if (action === 'reset_password') {
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Only admins can reset passwords' });
      }
      const bcrypt = await import('bcryptjs');
      const newPassword = updates.password || 'password123';
      const passwordHash = await bcrypt.default.hash(newPassword, 12);
      await db.execute('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [passwordHash, id]);
      return res.json({ success: true, message: 'Password reset successfully' });
    }
    
    if (action === 'change_tier') {
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Only admins can change account tier' });
      }
      const { tier } = updates;
      if (!['free', 'paid', 'academic', 'enterprise'].includes(tier)) {
        return res.status(400).json({ success: false, error: 'Invalid account tier' });
      }
      await db.execute('UPDATE users SET account_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [tier, id]);
      return res.json({ success: true, message: 'Account tier updated successfully' });
    }
    
    if (action === 'change_role') {
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Only admins can change roles' });
      }
      const { role } = updates;
      await db.execute('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, id]);
      return res.json({ success: true, message: 'Role updated successfully' });
    }
    
    if (action === 'update_app_roles') {
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Only admins can update app roles' });
      }
      const { app_roles } = updates;
      if (!Array.isArray(app_roles)) {
        return res.status(400).json({ success: false, error: 'app_roles must be an array' });
      }
      await db.execute('UPDATE users SET app_roles = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(app_roles), id]);
      return res.json({ success: true, message: 'App roles updated successfully' });
    }
    
    if (action === 'verify' || action === 'unverify') {
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Only admins can verify users' });
      }
      const isVerified = action === 'verify' ? 1 : 0;
      await db.execute('UPDATE users SET is_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [isVerified, id]);
      return res.json({ success: true, message: `User ${action === 'verify' ? 'verified' : 'unverified'} successfully` });
    }
    
    // Regular field updates
    const allowedFields = ['first_name', 'last_name', 'company_name', 'phone', 'country', 'city', 'bio', 'profile_image', 'user_type', 'account_tier'];
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key === 'firstName' ? 'first_name' : 
                    key === 'lastName' ? 'last_name' :
                    key === 'companyName' ? 'company_name' :
                    key === 'profileImage' ? 'profile_image' :
                    key === 'userType' ? 'user_type' :
                    key === 'accountTier' ? 'account_tier' : key;
      
      if (allowedFields.includes(dbKey) && value !== undefined) {
        updateFields.push(`${dbKey} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    await db.execute(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
});

// Delete/Deactivate user (admin only)
router.delete('/users', authenticateToken, async (req, res) => {
  try {
    // Check if requester is admin
    const isAdmin = req.user.is_admin === true || req.user.is_admin === 1 || req.user.role === 'admin' || (Array.isArray(req.user.app_roles) && req.user.app_roles.includes('super_admin'));
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden - Admin access required' });
    }

    const { id, action = 'deactivate' } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    if (action === 'delete') {
      // Permanently delete user (use with caution)
      await db.execute('DELETE FROM users WHERE id = ?', [id]);
      res.json({ success: true, message: 'User deleted successfully' });
    } else if (action === 'deactivate') {
      await db.execute('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      res.json({ success: true, message: 'User deactivated successfully' });
    } else if (action === 'activate') {
      await db.execute('UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      res.json({ success: true, message: 'User activated successfully' });
    } else if (action === 'block') {
      await db.execute('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      res.json({ success: true, message: 'User blocked successfully' });
    } else if (action === 'suspend') {
      await db.execute('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      res.json({ success: true, message: 'User suspended successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error deleting/deactivating user:', error);
    res.status(500).json({ success: false, message: 'Failed to process user action', error: error.message });
  }
});

// ============================================
// COMPANIES ADMIN ENDPOINTS
// ============================================

// Get companies with pagination and search
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureImageColumns();
    
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM companies WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM companies WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR sector LIKE ?)';
      countQuery += ' AND (name LIKE ? OR description LIKE ? OR sector LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [companies] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: companies,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: offset + companies.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch companies' });
  }
});

// Get single company
router.get('/companies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [companies] = await db.execute('SELECT * FROM companies WHERE id = ?', [id]);
    
    if (companies.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    res.json({ success: true, data: companies[0] });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch company' });
  }
});

// Create company
router.post('/companies', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureImageColumns();
    
    const { name, description, website, sector, stage, country, total_funding, employees_count, logo, is_active } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO companies (name, description, website, sector, stage, country, total_funding, employees_count, logo, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, website, sector, stage, country, total_funding, employees_count, logo || null, is_active !== false]
    );
    
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ success: false, message: 'Failed to create company' });
  }
});

// Update company
router.put('/companies/:id', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureImageColumns();
    
    const { id } = req.params;
    const { name, description, website, sector, stage, country, total_funding, employees_count, logo, is_active } = req.body;
    
    await db.execute(
      `UPDATE companies SET name = ?, description = ?, website = ?, sector = ?, stage = ?, country = ?, 
       total_funding = ?, employees_count = ?, logo = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
      [name, description, website, sector, stage, country, total_funding, employees_count, logo || null, is_active !== false, id]
    );
    
    res.json({ success: true, message: 'Company updated successfully' });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ success: false, message: 'Failed to update company' });
  }
});

// Delete company
router.delete('/companies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM companies WHERE id = ?', [id]);
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ success: false, message: 'Failed to delete company' });
  }
});

// ============================================
// DEALS ADMIN ENDPOINTS
// ============================================

router.get('/deals', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM deals WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM deals WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (company_name LIKE ? OR description LIKE ? OR deal_type LIKE ?)';
      countQuery += ' AND (company_name LIKE ? OR description LIKE ? OR deal_type LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY deal_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [deals] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: deals,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), has_more: offset + deals.length < total }
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch deals' });
  }
});

router.get('/deals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [deals] = await db.execute('SELECT * FROM deals WHERE id = ?', [id]);
    if (deals.length === 0) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, data: deals[0] });
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch deal' });
  }
});

router.post('/deals', authenticateToken, async (req, res) => {
  try {
    const { company_id, company_name, deal_type, amount, valuation, lead_investor, participants, deal_date, status, sector, country, description } = req.body;
    if (!company_name || !deal_type || !amount) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    const [result] = await db.execute(
      `INSERT INTO deals (company_id, company_name, deal_type, amount, valuation, lead_investor, participants, deal_date, status, sector, country, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_id, company_name, deal_type, amount, valuation, lead_investor, participants ? JSON.stringify(participants) : null, deal_date, status || 'announced', sector, country, description]
    );
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ success: false, message: 'Failed to create deal' });
  }
});

router.put('/deals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, company_name, deal_type, amount, valuation, lead_investor, participants, deal_date, status, sector, country, description } = req.body;
    await db.execute(
      `UPDATE deals SET company_id = ?, company_name = ?, deal_type = ?, amount = ?, valuation = ?, lead_investor = ?, 
       participants = ?, deal_date = ?, status = ?, sector = ?, country = ?, description = ?, updated_at = NOW() WHERE id = ?`,
      [company_id, company_name, deal_type, amount, valuation, lead_investor, participants ? JSON.stringify(participants) : null, deal_date, status, sector, country, description, id]
    );
    res.json({ success: true, message: 'Deal updated successfully' });
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ success: false, message: 'Failed to update deal' });
  }
});

router.delete('/deals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM deals WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ success: false, message: 'Failed to delete deal' });
  }
});

// ============================================
// GRANTS ADMIN ENDPOINTS
// ============================================

router.get('/grants', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM grants WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM grants WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR funding_agency LIKE ?)';
      countQuery += ' AND (title LIKE ? OR description LIKE ? OR funding_agency LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [grants] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: grants,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), has_more: offset + grants.length < total }
    });
  } catch (error) {
    console.error('Error fetching grants:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch grants' });
  }
});

router.get('/grants/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [grants] = await db.execute('SELECT * FROM grants WHERE id = ?', [id]);
    if (grants.length === 0) return res.status(404).json({ success: false, message: 'Grant not found' });
    res.json({ success: true, data: grants[0] });
  } catch (error) {
    console.error('Error fetching grant:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch grant' });
  }
});

router.post('/grants', authenticateToken, async (req, res) => {
  try {
    const { title, description, funding_agency, amount, grant_type, application_deadline, award_date, status, requirements, contact_email, website, country, sector, duration_months } = req.body;
    if (!title || !funding_agency) {
      return res.status(400).json({ success: false, message: 'Title and funding agency are required' });
    }
    const [result] = await db.execute(
      `INSERT INTO grants (title, description, funding_agency, amount, grant_type, application_deadline, award_date, status, requirements, contact_email, website, country, sector, duration_months)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, funding_agency, amount, grant_type || 'Research', application_deadline, award_date, status || 'open', requirements, contact_email, website, country, sector, duration_months]
    );
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating grant:', error);
    res.status(500).json({ success: false, message: 'Failed to create grant' });
  }
});

router.put('/grants/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, funding_agency, amount, grant_type, application_deadline, award_date, status, requirements, contact_email, website, country, sector, duration_months } = req.body;
    await db.execute(
      `UPDATE grants SET title = ?, description = ?, funding_agency = ?, amount = ?, grant_type = ?, application_deadline = ?, 
       award_date = ?, status = ?, requirements = ?, contact_email = ?, website = ?, country = ?, sector = ?, duration_months = ?, updated_at = NOW() WHERE id = ?`,
      [title, description, funding_agency, amount, grant_type, application_deadline, award_date, status, requirements, contact_email, website, country, sector, duration_months, id]
    );
    res.json({ success: true, message: 'Grant updated successfully' });
  } catch (error) {
    console.error('Error updating grant:', error);
    res.status(500).json({ success: false, message: 'Failed to update grant' });
  }
});

router.delete('/grants/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM grants WHERE id = ?', [id]);
    res.json({ success: true, message: 'Grant deleted successfully' });
  } catch (error) {
    console.error('Error deleting grant:', error);
    res.status(500).json({ success: false, message: 'Failed to delete grant' });
  }
});

// ============================================
// INVESTORS ADMIN ENDPOINTS
// ============================================

router.get('/investors', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM investors WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM investors WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR headquarters LIKE ?)';
      countQuery += ' AND (name LIKE ? OR description LIKE ? OR headquarters LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [investors] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Parse JSON fields
    const parsedInvestors = investors.map(inv => ({
      ...inv,
      focus_sectors: inv.focus_sectors ? JSON.parse(inv.focus_sectors) : [],
      investment_stages: inv.investment_stages ? JSON.parse(inv.investment_stages) : [],
      countries: inv.countries ? JSON.parse(inv.countries) : [],
      social_media: inv.social_media ? JSON.parse(inv.social_media) : {},
      recent_investments: inv.recent_investments ? JSON.parse(inv.recent_investments) : [],
      investment_criteria: inv.investment_criteria ? JSON.parse(inv.investment_criteria) : []
    }));
    
    res.json({
      success: true,
      data: parsedInvestors,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), has_more: offset + investors.length < total }
    });
  } catch (error) {
    console.error('Error fetching investors:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch investors' });
  }
});

router.get('/investors/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [investors] = await db.execute('SELECT * FROM investors WHERE id = ?', [id]);
    if (investors.length === 0) return res.status(404).json({ success: false, message: 'Investor not found' });
    const investor = investors[0];
    const parsedInvestor = {
      ...investor,
      focus_sectors: investor.focus_sectors ? JSON.parse(investor.focus_sectors) : [],
      investment_stages: investor.investment_stages ? JSON.parse(investor.investment_stages) : [],
      countries: investor.countries ? JSON.parse(investor.countries) : [],
      social_media: investor.social_media ? JSON.parse(investor.social_media) : {},
      recent_investments: investor.recent_investments ? JSON.parse(investor.recent_investments) : [],
      investment_criteria: investor.investment_criteria ? JSON.parse(investor.investment_criteria) : []
    };
    res.json({ success: true, data: parsedInvestor });
  } catch (error) {
    console.error('Error fetching investor:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch investor' });
  }
});

router.post('/investors', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureImageColumns();
    
    const { name, logo, description, type, headquarters, founded_year, assets_under_management, website, focus_sectors, investment_stages, portfolio_companies, total_investments, average_investment, countries, team_size, contact_email, social_media, recent_investments, investment_criteria, portfolio_exits, is_active } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Investor name is required' });
    }
    const [result] = await db.execute(
      `INSERT INTO investors (name, logo, description, type, headquarters, founded_year, assets_under_management, website, focus_sectors, investment_stages, portfolio_companies, total_investments, average_investment, countries, team_size, contact_email, social_media, recent_investments, investment_criteria, portfolio_exits, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, logo, description, type, headquarters, founded_year, assets_under_management, website, focus_sectors ? JSON.stringify(focus_sectors) : null, investment_stages ? JSON.stringify(investment_stages) : null, portfolio_companies ? JSON.stringify(portfolio_companies) : null, total_investments, average_investment, countries ? JSON.stringify(countries) : null, team_size, contact_email, social_media ? JSON.stringify(social_media) : null, recent_investments ? JSON.stringify(recent_investments) : null, investment_criteria ? JSON.stringify(investment_criteria) : null, portfolio_exits ? JSON.stringify(portfolio_exits) : null, is_active !== false]
    );
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating investor:', error);
    res.status(500).json({ success: false, message: 'Failed to create investor' });
  }
});

router.put('/investors/:id', authenticateToken, async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureImageColumns();
    
    const { id } = req.params;
    const { name, logo, description, type, headquarters, founded_year, assets_under_management, website, focus_sectors, investment_stages, portfolio_companies, total_investments, average_investment, countries, team_size, contact_email, social_media, recent_investments, investment_criteria, portfolio_exits, is_active } = req.body;
    await db.execute(
      `UPDATE investors SET name = ?, logo = ?, description = ?, type = ?, headquarters = ?, founded_year = ?, assets_under_management = ?, website = ?, 
       focus_sectors = ?, investment_stages = ?, portfolio_companies = ?, total_investments = ?, average_investment = ?, countries = ?, team_size = ?, 
       contact_email = ?, social_media = ?, recent_investments = ?, investment_criteria = ?, portfolio_exits = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
      [name, logo, description, type, headquarters, founded_year, assets_under_management, website, focus_sectors ? JSON.stringify(focus_sectors) : null, investment_stages ? JSON.stringify(investment_stages) : null, portfolio_companies ? JSON.stringify(portfolio_companies) : null, total_investments, average_investment, countries ? JSON.stringify(countries) : null, team_size, contact_email, social_media ? JSON.stringify(social_media) : null, recent_investments ? JSON.stringify(recent_investments) : null, investment_criteria ? JSON.stringify(investment_criteria) : null, portfolio_exits ? JSON.stringify(portfolio_exits) : null, is_active !== false, id]
    );
    res.json({ success: true, message: 'Investor updated successfully' });
  } catch (error) {
    console.error('Error updating investor:', error);
    res.status(500).json({ success: false, message: 'Failed to update investor' });
  }
});

router.delete('/investors/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM investors WHERE id = ?', [id]);
    res.json({ success: true, message: 'Investor deleted successfully' });
  } catch (error) {
    console.error('Error deleting investor:', error);
    res.status(500).json({ success: false, message: 'Failed to delete investor' });
  }
});

// ============================================
// CLINICAL TRIALS ADMIN ENDPOINTS
// ============================================

router.get('/clinical-trials', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM clinical_trials WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM clinical_trials WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR medical_condition LIKE ?)';
      countQuery += ' AND (title LIKE ? OR description LIKE ? OR medical_condition LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [trials] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: trials,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), has_more: offset + trials.length < total }
    });
  } catch (error) {
    console.error('Error fetching clinical trials:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clinical trials' });
  }
});

router.get('/clinical-trials/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [trials] = await db.execute('SELECT * FROM clinical_trials WHERE id = ?', [id]);
    if (trials.length === 0) return res.status(404).json({ success: false, message: 'Clinical trial not found' });
    res.json({ success: true, data: trials[0] });
  } catch (error) {
    console.error('Error fetching clinical trial:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clinical trial' });
  }
});

router.post('/clinical-trials', authenticateToken, async (req, res) => {
  try {
    const { title, description, phase, medical_condition, indication, intervention, sponsor, location, country, start_date, end_date, status, nct_number, trial_id, company_id } = req.body;
    if (!title || !phase) {
      return res.status(400).json({ success: false, message: 'Title and phase are required' });
    }
    const [result] = await db.execute(
      `INSERT INTO clinical_trials (title, description, phase, medical_condition, indication, intervention, sponsor, location, country, start_date, end_date, status, nct_number, trial_id, company_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, phase, medical_condition, indication, intervention, sponsor, location, country, start_date, end_date, status || 'Recruiting', nct_number, trial_id, company_id]
    );
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating clinical trial:', error);
    res.status(500).json({ success: false, message: 'Failed to create clinical trial' });
  }
});

router.put('/clinical-trials/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, phase, medical_condition, indication, intervention, sponsor, location, country, start_date, end_date, status, nct_number, trial_id, company_id } = req.body;
    await db.execute(
      `UPDATE clinical_trials SET title = ?, description = ?, phase = ?, medical_condition = ?, indication = ?, intervention = ?, sponsor = ?, location = ?, country = ?, 
       start_date = ?, end_date = ?, status = ?, nct_number = ?, trial_id = ?, company_id = ?, updated_at = NOW() WHERE id = ?`,
      [title, description, phase, medical_condition, indication, intervention, sponsor, location, country, start_date, end_date, status, nct_number, trial_id, company_id, id]
    );
    res.json({ success: true, message: 'Clinical trial updated successfully' });
  } catch (error) {
    console.error('Error updating clinical trial:', error);
    res.status(500).json({ success: false, message: 'Failed to update clinical trial' });
  }
});

router.delete('/clinical-trials/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM clinical_trials WHERE id = ?', [id]);
    res.json({ success: true, message: 'Clinical trial deleted successfully' });
  } catch (error) {
    console.error('Error deleting clinical trial:', error);
    res.status(500).json({ success: false, message: 'Failed to delete clinical trial' });
  }
});

// ============================================
// REGULATORY ADMIN ENDPOINTS (company_regulatory)
// ============================================

router.get('/regulatory', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // First check if table exists
    try {
      await db.execute('SELECT 1 FROM company_regulatory LIMIT 1');
    } catch (tableError) {
      // Table doesn't exist, return empty result
      console.warn('company_regulatory table does not exist:', tableError.message);
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), has_more: false }
      });
    }
    
    // Check actual table structure to determine schema
    let query, countQuery, params = [], countParams = [];
    let hasRegulatoryBodyId = false;
    let hasProductName = false;
    
    try {
      // Get all columns to check schema
      const [allColumns] = await db.execute("SHOW COLUMNS FROM company_regulatory");
      const columnNames = allColumns.map(col => col.Field);
      hasRegulatoryBodyId = columnNames.includes('regulatory_body_id');
      hasProductName = columnNames.includes('product_name');
    } catch (schemaCheckError) {
      console.warn('Error checking schema, using fallback:', schemaCheckError.message);
    }
    
    // Use simpler query without JOINs to avoid schema issues
    // The table likely has: regulatory_body (VARCHAR) and product (VARCHAR) instead of IDs
    query = 'SELECT * FROM company_regulatory WHERE 1=1';
    countQuery = 'SELECT COUNT(*) as total FROM company_regulatory WHERE 1=1';
    
    if (search) {
      // Try both column name variations
      query += ' AND (product_name LIKE ? OR product LIKE ? OR notes LIKE ?)';
      countQuery += ' AND (product_name LIKE ? OR product LIKE ? OR notes LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [regulatory] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Normalize the data to ensure consistent field names
    const normalizedData = regulatory.map(reg => ({
      ...reg,
      product_name: reg.product_name || reg.product || 'Unknown Product',
      regulatory_body_name: reg.regulatory_body_name || reg.regulatory_body || 'Unknown Body',
      company_name: reg.company_name || 'Unknown Company'
    }));
    
    res.json({
      success: true,
      data: normalizedData,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), has_more: offset + regulatory.length < total }
    });
  } catch (error) {
    console.error('Error fetching regulatory records:', error);
    console.error('Error stack:', error.stack);
    // Return empty result instead of 500 error to prevent frontend issues
    res.json({
      success: true,
      data: [],
      pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), has_more: false },
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/regulatory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [regulatory] = await db.execute('SELECT * FROM company_regulatory WHERE id = ?', [id]);
    if (regulatory.length === 0) return res.status(404).json({ success: false, message: 'Regulatory record not found' });
    res.json({ success: true, data: regulatory[0] });
  } catch (error) {
    console.error('Error fetching regulatory record:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch regulatory record' });
  }
});

router.post('/regulatory', authenticateToken, async (req, res) => {
  try {
    const { company_id, regulatory_body_id, product_name, status, approval_date, region, application_date, expiry_date, notes } = req.body;
    if (!product_name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }
    const [result] = await db.execute(
      `INSERT INTO company_regulatory (company_id, regulatory_body_id, product_name, status, approval_date, region, application_date, expiry_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_id, regulatory_body_id, product_name, status || 'Submitted', approval_date, region, application_date, expiry_date, notes]
    );
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating regulatory record:', error);
    res.status(500).json({ success: false, message: 'Failed to create regulatory record' });
  }
});

router.put('/regulatory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, regulatory_body_id, product_name, status, approval_date, region, application_date, expiry_date, notes } = req.body;
    await db.execute(
      `UPDATE company_regulatory SET company_id = ?, regulatory_body_id = ?, product_name = ?, status = ?, approval_date = ?, region = ?, 
       application_date = ?, expiry_date = ?, notes = ?, updated_at = NOW() WHERE id = ?`,
      [company_id, regulatory_body_id, product_name, status, approval_date, region, application_date, expiry_date, notes, id]
    );
    res.json({ success: true, message: 'Regulatory record updated successfully' });
  } catch (error) {
    console.error('Error updating regulatory record:', error);
    res.status(500).json({ success: false, message: 'Failed to update regulatory record' });
  }
});

router.delete('/regulatory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM company_regulatory WHERE id = ?', [id]);
    res.json({ success: true, message: 'Regulatory record deleted successfully' });
  } catch (error) {
    console.error('Error deleting regulatory record:', error);
    res.status(500).json({ success: false, message: 'Failed to delete regulatory record' });
  }
});

// ============================================
// REGULATORY BODIES ADMIN ENDPOINTS
// ============================================

router.get('/regulatory-bodies', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM regulatory_bodies WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM regulatory_bodies WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR country LIKE ? OR description LIKE ?)';
      countQuery += ' AND (name LIKE ? OR country LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [bodies] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: bodies,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), has_more: offset + bodies.length < total }
    });
  } catch (error) {
    console.error('Error fetching regulatory bodies:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch regulatory bodies' });
  }
});

router.get('/regulatory-bodies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [bodies] = await db.execute('SELECT * FROM regulatory_bodies WHERE id = ?', [id]);
    if (bodies.length === 0) return res.status(404).json({ success: false, message: 'Regulatory body not found' });
    res.json({ success: true, data: bodies[0] });
  } catch (error) {
    console.error('Error fetching regulatory body:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch regulatory body' });
  }
});

router.post('/regulatory-bodies', authenticateToken, async (req, res) => {
  try {
    const { name, country, abbreviation, website, description, jurisdiction, contact_info, regulatory_framework, approval_process, fees_structure, is_active } = req.body;
    if (!name || !country) {
      return res.status(400).json({ success: false, message: 'Name and country are required' });
    }
    const [result] = await db.execute(
      `INSERT INTO regulatory_bodies (name, country, abbreviation, website, description, jurisdiction, contact_info, regulatory_framework, approval_process, fees_structure, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, country, abbreviation, website, description, jurisdiction, contact_info ? JSON.stringify(contact_info) : null, regulatory_framework, approval_process, fees_structure, is_active !== false]
    );
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating regulatory body:', error);
    res.status(500).json({ success: false, message: 'Failed to create regulatory body' });
  }
});

router.put('/regulatory-bodies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, abbreviation, website, description, jurisdiction, contact_info, regulatory_framework, approval_process, fees_structure, is_active } = req.body;
    await db.execute(
      `UPDATE regulatory_bodies SET name = ?, country = ?, abbreviation = ?, website = ?, description = ?, jurisdiction = ?, contact_info = ?, 
       regulatory_framework = ?, approval_process = ?, fees_structure = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
      [name, country, abbreviation, website, description, jurisdiction, contact_info ? JSON.stringify(contact_info) : null, regulatory_framework, approval_process, fees_structure, is_active !== false, id]
    );
    res.json({ success: true, message: 'Regulatory body updated successfully' });
  } catch (error) {
    console.error('Error updating regulatory body:', error);
    res.status(500).json({ success: false, message: 'Failed to update regulatory body' });
  }
});

router.delete('/regulatory-bodies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM regulatory_bodies WHERE id = ?', [id]);
    res.json({ success: true, message: 'Regulatory body deleted successfully' });
  } catch (error) {
    console.error('Error deleting regulatory body:', error);
    res.status(500).json({ success: false, message: 'Failed to delete regulatory body' });
  }
});

// ============================================
// PUBLIC MARKETS ADMIN ENDPOINTS (public_stocks)
// ============================================

router.get('/public-markets', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM public_stocks WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM public_stocks WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (company_name LIKE ? OR ticker LIKE ? OR exchange LIKE ?)';
      countQuery += ' AND (company_name LIKE ? OR ticker LIKE ? OR exchange LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [stocks] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: stocks,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), has_more: offset + stocks.length < total }
    });
  } catch (error) {
    console.error('Error fetching public markets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch public markets' });
  }
});

router.get('/public-markets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [stocks] = await db.execute('SELECT * FROM public_stocks WHERE id = ?', [id]);
    if (stocks.length === 0) return res.status(404).json({ success: false, message: 'Stock not found' });
    res.json({ success: true, data: stocks[0] });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock' });
  }
});

router.post('/public-markets', authenticateToken, async (req, res) => {
  try {
    const { company_name, ticker, exchange, price, market_cap, currency, sector, country } = req.body;
    if (!company_name || !ticker || !exchange) {
      return res.status(400).json({ success: false, message: 'Company name, ticker, and exchange are required' });
    }
    const [result] = await db.execute(
      `INSERT INTO public_stocks (company_name, ticker, exchange, price, market_cap, currency, sector, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_name, ticker, exchange, price, market_cap, currency, sector, country]
    );
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating stock:', error);
    res.status(500).json({ success: false, message: 'Failed to create stock' });
  }
});

router.put('/public-markets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, ticker, exchange, price, market_cap, currency, sector, country } = req.body;
    await db.execute(
      `UPDATE public_stocks SET company_name = ?, ticker = ?, exchange = ?, price = ?, market_cap = ?, currency = ?, sector = ?, country = ?, last_updated = NOW() WHERE id = ?`,
      [company_name, ticker, exchange, price, market_cap, currency, sector, country, id]
    );
    res.json({ success: true, message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, message: 'Failed to update stock' });
  }
});

router.delete('/public-markets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM public_stocks WHERE id = ?', [id]);
    res.json({ success: true, message: 'Stock deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({ success: false, message: 'Failed to delete stock' });
  }
});

// ============================================
// CLINICAL CENTERS ADMIN ENDPOINTS
// ============================================

router.get('/clinical-centers', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM clinical_centers WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM clinical_centers WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR country LIKE ? OR city LIKE ?)';
      countQuery += ' AND (name LIKE ? OR country LIKE ? OR city LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [centers] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: centers,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), has_more: offset + centers.length < total }
    });
  } catch (error) {
    console.error('Error fetching clinical centers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clinical centers' });
  }
});

router.get('/clinical-centers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [centers] = await db.execute('SELECT * FROM clinical_centers WHERE id = ?', [id]);
    if (centers.length === 0) return res.status(404).json({ success: false, message: 'Clinical center not found' });
    res.json({ success: true, data: centers[0] });
  } catch (error) {
    console.error('Error fetching clinical center:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clinical center' });
  }
});

router.post('/clinical-centers', authenticateToken, async (req, res) => {
  try {
    const { name, country, city, address, website, description, specialties, phases_supported, capacity_patients, established_year, accreditation, contact_info, facilities, is_active } = req.body;
    if (!name || !country) {
      return res.status(400).json({ success: false, message: 'Name and country are required' });
    }
    const [result] = await db.execute(
      `INSERT INTO clinical_centers (name, country, city, address, website, description, specialties, phases_supported, capacity_patients, established_year, accreditation, contact_info, facilities, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, country, city, address, website, description, specialties ? JSON.stringify(specialties) : null, phases_supported ? JSON.stringify(phases_supported) : null, capacity_patients, established_year, accreditation ? JSON.stringify(accreditation) : null, contact_info ? JSON.stringify(contact_info) : null, facilities ? JSON.stringify(facilities) : null, is_active !== false]
    );
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating clinical center:', error);
    res.status(500).json({ success: false, message: 'Failed to create clinical center' });
  }
});

router.put('/clinical-centers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, city, address, website, description, specialties, phases_supported, capacity_patients, established_year, accreditation, contact_info, facilities, is_active } = req.body;
    await db.execute(
      `UPDATE clinical_centers SET name = ?, country = ?, city = ?, address = ?, website = ?, description = ?, specialties = ?, phases_supported = ?, 
       capacity_patients = ?, established_year = ?, accreditation = ?, contact_info = ?, facilities = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
      [name, country, city, address, website, description, specialties ? JSON.stringify(specialties) : null, phases_supported ? JSON.stringify(phases_supported) : null, capacity_patients, established_year, accreditation ? JSON.stringify(accreditation) : null, contact_info ? JSON.stringify(contact_info) : null, facilities ? JSON.stringify(facilities) : null, is_active !== false, id]
    );
    res.json({ success: true, message: 'Clinical center updated successfully' });
  } catch (error) {
    console.error('Error updating clinical center:', error);
    res.status(500).json({ success: false, message: 'Failed to update clinical center' });
  }
});

router.delete('/clinical-centers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM clinical_centers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Clinical center deleted successfully' });
  } catch (error) {
    console.error('Error deleting clinical center:', error);
    res.status(500).json({ success: false, message: 'Failed to delete clinical center' });
  }
});

// ============================================
// INVESTIGATORS ADMIN ENDPOINTS
// ============================================

router.get('/investigators', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM investigators WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM investigators WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR institution LIKE ? OR country LIKE ?)';
      countQuery += ' AND (name LIKE ? OR institution LIKE ? OR country LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [investigators] = await db.execute(query, params);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: investigators,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), has_more: offset + investigators.length < total }
    });
  } catch (error) {
    console.error('Error fetching investigators:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch investigators' });
  }
});

router.get('/investigators/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [investigators] = await db.execute('SELECT * FROM investigators WHERE id = ?', [id]);
    if (investigators.length === 0) return res.status(404).json({ success: false, message: 'Investigator not found' });
    res.json({ success: true, data: investigators[0] });
  } catch (error) {
    console.error('Error fetching investigator:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch investigator' });
  }
});

router.post('/investigators', authenticateToken, async (req, res) => {
  try {
    const { name, title, institution, country, city, email, phone, specialties, therapeutic_areas, trial_count, experience_years, education, certifications, publications_count, languages, is_active } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const [result] = await db.execute(
      `INSERT INTO investigators (name, title, institution, country, city, email, phone, specialties, therapeutic_areas, trial_count, experience_years, education, certifications, publications_count, languages, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, title, institution, country, city, email, phone, specialties ? JSON.stringify(specialties) : null, therapeutic_areas ? JSON.stringify(therapeutic_areas) : null, trial_count, experience_years, education ? JSON.stringify(education) : null, certifications ? JSON.stringify(certifications) : null, publications_count, languages ? JSON.stringify(languages) : null, is_active !== false]
    );
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating investigator:', error);
    res.status(500).json({ success: false, message: 'Failed to create investigator' });
  }
});

router.put('/investigators/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, institution, country, city, email, phone, specialties, therapeutic_areas, trial_count, experience_years, education, certifications, publications_count, languages, is_active } = req.body;
    await db.execute(
      `UPDATE investigators SET name = ?, title = ?, institution = ?, country = ?, city = ?, email = ?, phone = ?, specialties = ?, therapeutic_areas = ?, 
       trial_count = ?, experience_years = ?, education = ?, certifications = ?, publications_count = ?, languages = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
      [name, title, institution, country, city, email, phone, specialties ? JSON.stringify(specialties) : null, therapeutic_areas ? JSON.stringify(therapeutic_areas) : null, trial_count, experience_years, education ? JSON.stringify(education) : null, certifications ? JSON.stringify(certifications) : null, publications_count, languages ? JSON.stringify(languages) : null, is_active !== false, id]
    );
    res.json({ success: true, message: 'Investigator updated successfully' });
  } catch (error) {
    console.error('Error updating investigator:', error);
    res.status(500).json({ success: false, message: 'Failed to update investigator' });
  }
});

router.delete('/investigators/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM investigators WHERE id = ?', [id]);
    res.json({ success: true, message: 'Investigator deleted successfully' });
  } catch (error) {
    console.error('Error deleting investigator:', error);
    res.status(500).json({ success: false, message: 'Failed to delete investigator' });
  }
});

// ==============================================
// NATION PULSE DATA CRUD OPERATIONS
// ==============================================

router.get('/nation-pulse', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, country, data_type, year } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Check which columns exist in the table
    let hasDataType = false;
    try {
      const [columns] = await db.execute("SHOW COLUMNS FROM nation_pulse_data");
      const columnNames = columns.map(col => col.Field);
      hasDataType = columnNames.includes('data_type');
    } catch (colCheckError) {
      console.warn('Error checking columns, will skip data_type filter:', colCheckError.message);
    }
    
    let query = 'SELECT * FROM nation_pulse_data WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND (metric_name LIKE ? OR country LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (country) {
      query += ' AND country = ?';
      params.push(country);
    }
    if (data_type && hasDataType) {
      query += ' AND data_type = ?';
      params.push(data_type);
    }
    if (year) {
      query += ' AND year = ?';
      params.push(parseInt(year));
    }
    
    // Check which columns exist before ordering
    try {
      const [columns] = await db.execute("SHOW COLUMNS FROM nation_pulse_data");
      const columnNames = columns.map(col => col.Field);
      
      // Build ORDER BY with only existing columns
      let orderBy = [];
      if (columnNames.includes('country')) orderBy.push('country');
      if (columnNames.includes('year')) orderBy.push('year DESC');
      if (columnNames.includes('metric_name')) orderBy.push('metric_name');
      if (orderBy.length === 0) orderBy.push('id DESC'); // Fallback
      
      query += ` ORDER BY ${orderBy.join(', ')} LIMIT ? OFFSET ?`;
    } catch (colError) {
      // Fallback to simple ordering
      query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    }
    params.push(parseInt(limit), offset);
    
    const [data] = await db.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM nation_pulse_data WHERE 1=1';
    const countParams = [];
    if (search) {
      countQuery += ' AND (metric_name LIKE ? OR country LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (country) {
      countQuery += ' AND country = ?';
      countParams.push(country);
    }
    if (data_type && hasDataType) {
      countQuery += ' AND data_type = ?';
      countParams.push(data_type);
    }
    if (year) {
      countQuery += ' AND year = ?';
      countParams.push(parseInt(year));
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching nation pulse data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch nation pulse data' });
  }
});

router.get('/nation-pulse/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM nation_pulse_data WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Nation pulse data not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching nation pulse data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch nation pulse data' });
  }
});

router.post('/nation-pulse', authenticateToken, async (req, res) => {
  try {
    const { country, country_code, data_type, metric_name, metric_value, metric_unit, year, source, notes } = req.body;
    
    if (!country || !data_type || !metric_name) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO nation_pulse_data (country, country_code, data_type, metric_name, metric_value, metric_unit, year, source, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [country, country_code || null, data_type, metric_name, metric_value || null, metric_unit || null, year || null, source || null, notes || null]
    );
    
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating nation pulse data:', error);
    res.status(500).json({ success: false, message: 'Failed to create nation pulse data' });
  }
});

router.put('/nation-pulse/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { country, country_code, data_type, metric_name, metric_value, metric_unit, year, source, notes } = req.body;
    
    await db.execute(
      `UPDATE nation_pulse_data 
       SET country = ?, country_code = ?, data_type = ?, metric_name = ?, metric_value = ?, metric_unit = ?, year = ?, source = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [country, country_code || null, data_type, metric_name, metric_value || null, metric_unit || null, year || null, source || null, notes || null, id]
    );
    
    res.json({ success: true, message: 'Nation pulse data updated successfully' });
  } catch (error) {
    console.error('Error updating nation pulse data:', error);
    res.status(500).json({ success: false, message: 'Failed to update nation pulse data' });
  }
});

router.delete('/nation-pulse/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM nation_pulse_data WHERE id = ?', [id]);
    res.json({ success: true, message: 'Nation pulse data deleted successfully' });
  } catch (error) {
    console.error('Error deleting nation pulse data:', error);
    res.status(500).json({ success: false, message: 'Failed to delete nation pulse data' });
  }
});

// ==============================================
// FUNDRAISING CRM CRUD OPERATIONS
// ==============================================

router.get('/crm-investors', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, user_id, pipeline_stage } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM crm_investors WHERE 1=1';
    const params = [];
    
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(parseInt(user_id));
    } else {
      // If not admin, only show own records
      const userId = req.user?.id;
      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }
    }
    
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR type LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (pipeline_stage) {
      query += ' AND pipeline_stage = ?';
      params.push(pipeline_stage);
    }
    
    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [data] = await db.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM crm_investors WHERE 1=1';
    const countParams = [];
    if (user_id) {
      countQuery += ' AND user_id = ?';
      countParams.push(parseInt(user_id));
    } else {
      const userId = req.user?.id;
      if (userId) {
        countQuery += ' AND user_id = ?';
        countParams.push(userId);
      }
    }
    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ? OR type LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (pipeline_stage) {
      countQuery += ' AND pipeline_stage = ?';
      countParams.push(pipeline_stage);
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching CRM investors:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch CRM investors' });
  }
});

router.get('/crm-investors/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM crm_investors WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'CRM investor not found' });
    }
    
    // Check if user owns this record or is admin
    const userId = req.user?.id;
    const isAdmin = req.user?.is_admin;
    if (!isAdmin && rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching CRM investor:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch CRM investor' });
  }
});

router.post('/crm-investors', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, type, focus, email, phone, website, headquarters, last_contact, notes, deal_size, timeline, pipeline_stage, probability_percent, next_action, next_action_date } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO crm_investors (user_id, name, type, focus, email, phone, website, headquarters, last_contact, notes, deal_size, timeline, pipeline_stage, probability_percent, next_action, next_action_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, type || null, focus || null, email || null, phone || null, website || null, headquarters || null, last_contact || null, notes || null, deal_size || null, timeline || null, pipeline_stage || 'Not Contacted', probability_percent || 0, next_action || null, next_action_date || null]
    );
    
    res.json({ success: true, data: { id: result.insertId, ...req.body, user_id: userId } });
  } catch (error) {
    console.error('Error creating CRM investor:', error);
    res.status(500).json({ success: false, message: 'Failed to create CRM investor' });
  }
});

router.put('/crm-investors/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.is_admin;
    
    // Check ownership
    const [existing] = await db.execute('SELECT user_id FROM crm_investors WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'CRM investor not found' });
    }
    if (!isAdmin && existing[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { name, type, focus, email, phone, website, headquarters, last_contact, notes, deal_size, timeline, pipeline_stage, probability_percent, next_action, next_action_date } = req.body;
    
    await db.execute(
      `UPDATE crm_investors 
       SET name = ?, type = ?, focus = ?, email = ?, phone = ?, website = ?, headquarters = ?, last_contact = ?, notes = ?, deal_size = ?, timeline = ?, pipeline_stage = ?, probability_percent = ?, next_action = ?, next_action_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, type || null, focus || null, email || null, phone || null, website || null, headquarters || null, last_contact || null, notes || null, deal_size || null, timeline || null, pipeline_stage || 'Not Contacted', probability_percent || 0, next_action || null, next_action_date || null, id]
    );
    
    res.json({ success: true, message: 'CRM investor updated successfully' });
  } catch (error) {
    console.error('Error updating CRM investor:', error);
    res.status(500).json({ success: false, message: 'Failed to update CRM investor' });
  }
});

router.delete('/crm-investors/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.is_admin;
    
    // Check ownership
    const [existing] = await db.execute('SELECT user_id FROM crm_investors WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'CRM investor not found' });
    }
    if (!isAdmin && existing[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    await db.execute('DELETE FROM crm_investors WHERE id = ?', [id]);
    res.json({ success: true, message: 'CRM investor deleted successfully' });
  } catch (error) {
    console.error('Error deleting CRM investor:', error);
    res.status(500).json({ success: false, message: 'Failed to delete CRM investor' });
  }
});

// CRM Meetings CRUD
router.get('/crm-meetings', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, crm_investor_id, user_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT m.*, i.name as investor_name FROM crm_meetings m LEFT JOIN crm_investors i ON m.crm_investor_id = i.id WHERE 1=1';
    const params = [];
    
    if (crm_investor_id) {
      query += ' AND m.crm_investor_id = ?';
      params.push(parseInt(crm_investor_id));
    }
    
    if (user_id) {
      query += ' AND m.user_id = ?';
      params.push(parseInt(user_id));
    } else {
      const userId = req.user?.id;
      if (userId) {
        query += ' AND m.user_id = ?';
        params.push(userId);
      }
    }
    
    query += ' ORDER BY m.meeting_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [data] = await db.execute(query, params);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching CRM meetings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch CRM meetings' });
  }
});

router.post('/crm-meetings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { crm_investor_id, meeting_date, meeting_type, location, notes, outcome, next_steps } = req.body;
    
    if (!crm_investor_id || !meeting_date) {
      return res.status(400).json({ success: false, message: 'CRM investor ID and meeting date are required' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO crm_meetings (crm_investor_id, user_id, meeting_date, meeting_type, location, notes, outcome, next_steps)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [crm_investor_id, userId, meeting_date, meeting_type || 'Initial', location || null, notes || null, outcome || null, next_steps || null]
    );
    
    res.json({ success: true, data: { id: result.insertId, ...req.body, user_id: userId } });
  } catch (error) {
    console.error('Error creating CRM meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to create CRM meeting' });
  }
});

router.put('/crm-meetings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { meeting_date, meeting_type, location, notes, outcome, next_steps } = req.body;
    
    await db.execute(
      `UPDATE crm_meetings 
       SET meeting_date = ?, meeting_type = ?, location = ?, notes = ?, outcome = ?, next_steps = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [meeting_date, meeting_type || 'Initial', location || null, notes || null, outcome || null, next_steps || null, id]
    );
    
    res.json({ success: true, message: 'CRM meeting updated successfully' });
  } catch (error) {
    console.error('Error updating CRM meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to update CRM meeting' });
  }
});

router.delete('/crm-meetings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM crm_meetings WHERE id = ?', [id]);
    res.json({ success: true, message: 'CRM meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting CRM meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to delete CRM meeting' });
  }
});

// ==============================================
// GLOSSARY TERMS CRUD OPERATIONS
// ==============================================

// Public endpoint for glossary terms (for m-index page)
router.get('/glossary/public', async (req, res) => {
  try {
    const { limit = 500, search, category } = req.query;
    
    console.log('[Glossary Public API] Request received:', { limit, search, category });
    
    let query = 'SELECT term, definition, category FROM glossary_terms WHERE is_active = 1';
    const params = [];
    
    if (search) {
      query += ' AND (term LIKE ? OR definition LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY category, term';
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    
    console.log('[Glossary Public API] Executing query:', query);
    console.log('[Glossary Public API] Params:', params);
    
    const [data] = await db.execute(query, params);
    
    console.log('[Glossary Public API] Found', data.length, 'terms');
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('[Glossary Public API] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch glossary terms',
      error: error.message 
    });
  }
});

router.get('/glossary', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM glossary_terms WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND (term LIKE ? OR definition LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY category, term LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [data] = await db.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM glossary_terms WHERE 1=1';
    const countParams = [];
    if (search) {
      countQuery += ' AND (term LIKE ? OR definition LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching glossary terms:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch glossary terms' });
  }
});

router.get('/glossary/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM glossary_terms WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Glossary term not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching glossary term:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch glossary term' });
  }
});

router.post('/glossary', authenticateToken, async (req, res) => {
  try {
    const { term, definition, category, related_terms, examples, source } = req.body;
    
    if (!term || !definition || !category) {
      return res.status(400).json({ success: false, message: 'Term, definition, and category are required' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO glossary_terms (term, definition, category, related_terms, examples, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [term, definition, category, related_terms ? JSON.stringify(related_terms) : null, examples || null, source || null]
    );
    
    res.json({ success: true, data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating glossary term:', error);
    res.status(500).json({ success: false, message: 'Failed to create glossary term' });
  }
});

router.put('/glossary/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { term, definition, category, related_terms, examples, source, is_active } = req.body;
    
    await db.execute(
      `UPDATE glossary_terms 
       SET term = ?, definition = ?, category = ?, related_terms = ?, examples = ?, source = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [term, definition, category, related_terms ? JSON.stringify(related_terms) : null, examples || null, source || null, is_active !== undefined ? is_active : true, id]
    );
    
    res.json({ success: true, message: 'Glossary term updated successfully' });
  } catch (error) {
    console.error('Error updating glossary term:', error);
    res.status(500).json({ success: false, message: 'Failed to update glossary term' });
  }
});

router.delete('/glossary/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM glossary_terms WHERE id = ?', [id]);
    res.json({ success: true, message: 'Glossary term deleted successfully' });
  } catch (error) {
    console.error('Error deleting glossary term:', error);
    res.status(500).json({ success: false, message: 'Failed to delete glossary term' });
  }
});

export default router;


