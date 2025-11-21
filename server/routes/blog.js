import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize blog categories table and ensure blog_posts has category columns
async function ensureBlogCategoryStructure() {
  try {
    // Create blog_categories table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(120) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Ensure blog_posts has category column
    try {
      await pool.execute(`
        ALTER TABLE blog_posts 
        ADD COLUMN category VARCHAR(50) NULL
      `);
    } catch (e) {
      // Column already exists, ignore
    }

    // Ensure blog_posts has category_id column
    try {
      await pool.execute(`
        ALTER TABLE blog_posts 
        ADD COLUMN category_id INT NULL
      `);
      await pool.execute(`
        ALTER TABLE blog_posts 
        ADD INDEX idx_category_id (category_id)
      `);
      try {
        await pool.execute(`
          ALTER TABLE blog_posts 
          ADD CONSTRAINT fk_blog_category 
          FOREIGN KEY (category_id) REFERENCES blog_categories(id) 
          ON DELETE SET NULL
        `);
      } catch (e) {
        // Constraint might already exist, ignore
      }
    } catch (e) {
      // Column already exists, ignore
    }

    // Ensure blog_posts has video_url column
    try {
      await pool.execute(`
        ALTER TABLE blog_posts 
        ADD COLUMN video_url VARCHAR(500) NULL
      `);
    } catch (e) {
      // Column already exists, ignore
    }

    // Migrate existing category strings to blog_categories table
    const [existingCategories] = await pool.execute(`
      SELECT DISTINCT category 
      FROM blog_posts 
      WHERE category IS NOT NULL AND category <> ''
    `);

    for (const row of existingCategories) {
      const categoryName = row.category;
      if (!categoryName) continue;

      const slug = categoryName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Insert category if it doesn't exist
      await pool.execute(`
        INSERT IGNORE INTO blog_categories (name, slug) 
        VALUES (?, ?)
      `, [categoryName, slug]);

      // Update category_id for posts with this category
      const [catRow] = await pool.execute(`
        SELECT id FROM blog_categories WHERE name = ? LIMIT 1
      `, [categoryName]);

      if (catRow && catRow[0]) {
        await pool.execute(`
          UPDATE blog_posts 
          SET category_id = ? 
          WHERE category = ? AND category_id IS NULL
        `, [catRow[0].id, categoryName]);
      }
    }
  } catch (error) {
    console.error('Error ensuring blog category structure:', error);
    // Don't throw - allow the endpoint to continue
  }
}

// Get all categories (MUST be before /:id route)
router.get('/categories', async (req, res) => {
  try {
    await ensureBlogCategoryStructure();

    // Seed default categories if none exist
    const [existingCategories] = await pool.execute(`SELECT COUNT(*) as count FROM blog_categories`);
    if (existingCategories[0]?.count === 0) {
      const defaultCategories = [
        { name: 'Healthcare Innovation', slug: 'healthcare-innovation' },
        { name: 'Clinical Trials', slug: 'clinical-trials' },
        { name: 'Regulatory Updates', slug: 'regulatory-updates' },
        { name: 'Investment News', slug: 'investment-news' },
        { name: 'Company Spotlight', slug: 'company-spotlight' },
        { name: 'Research & Development', slug: 'research-development' },
        { name: 'Market Analysis', slug: 'market-analysis' },
        { name: 'General', slug: 'general' }
      ];
      
      for (const cat of defaultCategories) {
        try {
          await pool.execute(`INSERT INTO blog_categories (name, slug) VALUES (?, ?)`, [cat.name, cat.slug]);
        } catch (err) {
          // Ignore duplicate errors
          if (err.code !== 'ER_DUP_ENTRY') {
            console.error('Error seeding category:', err);
          }
        }
      }
    }

    // Get categories from blog_categories table
    const [categories] = await pool.execute(`
      SELECT id, name, slug, 
             (SELECT COUNT(*) FROM blog_posts WHERE category_id = bc.id OR category = bc.name) as post_count
      FROM blog_categories bc
      ORDER BY name
    `);

    // Also get distinct categories from blog_posts.category (for backward compatibility)
    const [postCategories] = await pool.execute(`
      SELECT DISTINCT category as name
      FROM blog_posts
      WHERE category IS NOT NULL AND category <> ''
      AND category NOT IN (SELECT name FROM blog_categories)
    `);

    // Combine and deduplicate
    const allCategories = [...categories];
    for (const pc of postCategories) {
      if (!allCategories.find(c => c.name === pc.name)) {
        allCategories.push({
          id: null,
          name: pc.name,
          slug: pc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          post_count: 0
        });
      }
    }

    res.json({
      success: true,
      categories: allCategories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    // Ensure database structure exists
    await ensureBlogCategoryStructure();

    const { status = 'published', limit = 10, offset = 0, search, category } = req.query;
    
    // Build WHERE conditions
    const conditions = ['bp.status = ?'];
    const params = [status];
    
    // Add category filter if provided
    if (category && category !== 'All') {
      // Try to match by category name first, then by category_id via JOIN
      conditions.push('(bp.category = ? OR bc.name = ?)');
      params.push(category, category);
    }
    
    // Add search filter if provided
    if (search && search.trim()) {
      conditions.push('(bp.title LIKE ? OR bp.excerpt LIKE ? OR bp.content LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count for pagination
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM blog_posts bp 
       LEFT JOIN blog_categories bc ON bp.category_id = bc.id
       ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;
    
    // Get posts with pagination
    const [posts] = await pool.execute(
      `SELECT bp.*, u.username as author_name, u.first_name, u.last_name,
              bc.name as category_name, bc.slug as category_slug
       FROM blog_posts bp 
       LEFT JOIN users u ON bp.author_id = u.id 
       LEFT JOIN blog_categories bc ON bp.category_id = bc.id
       ${whereClause}
       ORDER BY bp.published_at DESC, bp.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    
    // Ensure featured_image and video_url are included in response
    const postsWithFields = posts.map(post => ({
      ...post,
      featured_image: post.featured_image || null,
      video_url: post.video_url || null
    }));

    // Ensure category field is populated (use category_name from JOIN or category from bp)
    const postsWithCategory = postsWithFields.map(post => ({
      ...post,
      category: post.category_name || post.category || 'General',
      slug: post.slug || null,
      featured_image: post.featured_image || null,
      video_url: post.video_url || null
    }));

    res.json({
      posts: postsWithCategory,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: total,
        has_more: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      posts: [] // Return empty array on error so frontend doesn't break
    });
  }
});

// Alias for /get_posts (for frontend compatibility)
router.get('/get_posts', async (req, res) => {
  try {
    const { status = 'published', limit = 10, offset = 0 } = req.query;
    
    const [posts] = await pool.execute(
      `SELECT bp.*, u.username as author_name, u.first_name, u.last_name 
       FROM blog_posts bp 
       LEFT JOIN users u ON bp.author_id = u.id 
       WHERE bp.status = ? 
       ORDER BY bp.published_at DESC 
       LIMIT ? OFFSET ?`,
      [status, parseInt(limit), parseInt(offset)]
    );

    res.json({
      posts,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: posts.length
      }
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public announcements
// Get all active videos (public endpoint) - MUST be before /:id route
router.get('/videos', async (req, res) => {
  try {
    const [videos] = await pool.execute(`
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
    // If table doesn't exist yet, return empty array
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ success: true, videos: [] });
    }
    console.error('Error fetching videos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
});

router.get('/announcements/public', async (req, res) => {
  try {
    // Ensure announcements table exists
    try {
      await pool.execute('SELECT 1 FROM announcements LIMIT 1');
    } catch (tableError) {
      // Table doesn't exist, create it
      await pool.execute(`
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
    }
    
    const { placement = 'blog_sidebar', limit = 3 } = req.query;
    
    const [announcements] = await pool.execute(
      `SELECT id, title, message, image_url, action_url, action_text, placement, expires_at, created_at
       FROM announcements 
       WHERE is_active = 1 
         AND placement = ?
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC 
       LIMIT ?`,
      [placement, parseInt(limit)]
    );
    
    res.json({
      success: true,
      announcements: announcements || []
    });
  } catch (error) {
    console.error('Error fetching public announcements:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get blog post by slug (must be before /:id)
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [posts] = await pool.execute(
      `SELECT bp.*, u.username as author_name, u.first_name, u.last_name,
              bc.name as category_name, bc.slug as category_slug
       FROM blog_posts bp 
       LEFT JOIN users u ON bp.author_id = u.id 
       LEFT JOIN blog_categories bc ON bp.category_id = bc.id
       WHERE bp.slug = ?`,
      [slug]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const post = posts[0];
    post.category = post.category_name || post.category || 'General';
    post.featured_image = post.featured_image || null;
    post.video_url = post.video_url || null;

    res.json({ post });
  } catch (error) {
    console.error('Get blog post by slug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get blog post by ID or slug (must be last - matches any remaining paths)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = !isNaN(Number(id)) && Number(id) > 0;

    let posts;
    if (isNumeric) {
      // Try ID first
      [posts] = await pool.execute(
        `SELECT bp.*, u.username as author_name, u.first_name, u.last_name,
                bc.name as category_name, bc.slug as category_slug
         FROM blog_posts bp 
         LEFT JOIN users u ON bp.author_id = u.id 
         LEFT JOIN blog_categories bc ON bp.category_id = bc.id
         WHERE bp.id = ?`,
        [id]
      );
    } else {
      // Try slug - use LOWER() for case-insensitive matching
      [posts] = await pool.execute(
        `SELECT bp.*, u.username as author_name, u.first_name, u.last_name,
                bc.name as category_name, bc.slug as category_slug
         FROM blog_posts bp 
         LEFT JOIN users u ON bp.author_id = u.id 
         LEFT JOIN blog_categories bc ON bp.category_id = bc.id
         WHERE LOWER(bp.slug) = LOWER(?)`,
        [id]
      );
      
      // If no match with case-insensitive, try exact match
      if (posts.length === 0) {
        [posts] = await pool.execute(
          `SELECT bp.*, u.username as author_name, u.first_name, u.last_name,
                  bc.name as category_name, bc.slug as category_slug
           FROM blog_posts bp 
           LEFT JOIN users u ON bp.author_id = u.id 
           LEFT JOIN blog_categories bc ON bp.category_id = bc.id
           WHERE bp.slug = ?`,
          [id]
        );
      }
      
      // Log for debugging
      if (posts.length === 0) {
        console.log(`[Blog Route] No post found for slug: "${id}"`);
        // Try to find similar slugs for debugging
        const [similar] = await pool.execute(
          `SELECT id, title, slug FROM blog_posts WHERE slug LIKE ? LIMIT 5`,
          [`%${id.substring(0, 20)}%`]
        );
        if (similar.length > 0) {
          console.log(`[Blog Route] Similar slugs found:`, similar.map(s => ({id: s.id, slug: s.slug})));
        }
      }
    }

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const post = posts[0];
    post.category = post.category_name || post.category || 'General';
    post.featured_image = post.featured_image || null;
    post.video_url = post.video_url || null;

    res.json({ post });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create blog post (requires authentication)
router.post('/', authenticateToken, async (req, res) => {
  try {
    await ensureBlogCategoryStructure();

    const { title, slug, content, excerpt, featuredImage, status, category } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ error: 'Title and slug are required' });
    }

    // Handle category
    let categoryId = null;
    let categoryName = category || null;

    if (category && category.trim()) {
      const categorySlug = category.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Insert category if it doesn't exist
      await pool.execute(`
        INSERT IGNORE INTO blog_categories (name, slug) 
        VALUES (?, ?)
      `, [category.trim(), categorySlug]);

      // Get category ID
      const [catRow] = await pool.execute(`
        SELECT id FROM blog_categories WHERE name = ? LIMIT 1
      `, [category.trim()]);

      if (catRow && catRow[0]) {
        categoryId = catRow[0].id;
      }
    }

    const finalSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const [result] = await pool.execute(
      `INSERT INTO blog_posts (title, slug, content, excerpt, author_id, featured_image, category, category_id, status, published_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        finalSlug,
        content || '',
        excerpt || '',
        req.user.id,
        featuredImage || '',
        categoryName,
        categoryId,
        status || 'draft',
        status === 'published' ? new Date() : null
      ]
    );

    res.json({
      success: true,
      id: result.insertId,
      featuredImage,
      category: categoryName
    });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update blog post (requires authentication)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    await ensureBlogCategoryStructure();

    const { id } = req.params;
    const { title, slug, content, excerpt, featuredImage, status, category } = req.body;

    // Handle category
    let categoryId = null;
    let categoryName = category || null;

    if (category && category.trim()) {
      const categorySlug = category.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Insert category if it doesn't exist
      await pool.execute(`
        INSERT IGNORE INTO blog_categories (name, slug) 
        VALUES (?, ?)
      `, [category.trim(), categorySlug]);

      // Get category ID
      const [catRow] = await pool.execute(`
        SELECT id FROM blog_categories WHERE name = ? LIMIT 1
      `, [category.trim()]);

      if (catRow && catRow[0]) {
        categoryId = catRow[0].id;
      }
    }

    await pool.execute(
      `UPDATE blog_posts 
       SET title = ?, slug = ?, content = ?, excerpt = ?, featured_image = ?, category = ?, category_id = ?, status = ?, 
           published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END
       WHERE id = ?`,
      [title, slug, content, excerpt, featuredImage, categoryName, categoryId, status, status, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete blog post (requires authentication)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM blog_posts WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create category (requires authentication)
router.post('/categories', authenticateToken, async (req, res) => {
  try {
    await ensureBlogCategoryStructure();

    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO blog_categories (name, slug) VALUES (?, ?)`,
      [name.trim(), slug.trim()]
    );

    res.json({
      success: true,
      id: result.insertId,
      name: name.trim(),
      slug: slug.trim()
    });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category with this name or slug already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category (requires authentication)
router.put('/categories/:id', authenticateToken, async (req, res) => {
  try {
    await ensureBlogCategoryStructure();

    const { id } = req.params;
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    await pool.execute(
      `UPDATE blog_categories SET name = ?, slug = ? WHERE id = ?`,
      [name.trim(), slug.trim(), id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category with this name or slug already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category (requires authentication)
router.delete('/categories/:id', authenticateToken, async (req, res) => {
  try {
    await ensureBlogCategoryStructure();

    const { id } = req.params;

    // Check if any posts use this category
    const [posts] = await pool.execute(
      `SELECT COUNT(*) as count FROM blog_posts WHERE category_id = ? OR category = (SELECT name FROM blog_categories WHERE id = ?)`,
      [id, id]
    );

    if (posts[0]?.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category: posts are using it. Remove posts or change their category first.' 
      });
    }

    await pool.execute('DELETE FROM blog_categories WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
