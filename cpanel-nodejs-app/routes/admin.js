import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all blog posts
router.get('/blog-posts', authenticateToken, async (req, res) => {
  try {
    const [posts] = await db.execute(`
      SELECT id, title, slug, content, excerpt, author_id, featured_image, category, status, published_at, created_at, updated_at
      FROM blog_posts 
      ORDER BY created_at DESC
    `);
    
    res.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blog posts' });
  }
});

// Create blog post
router.post('/blog-posts', authenticateToken, async (req, res) => {
  try {
    const { title, excerpt, content, author, category, readTime, imageUrl, featured } = req.body;
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const [result] = await db.execute(`
      INSERT INTO blog_posts (title, slug, content, excerpt, author_id, featured_image, category, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', NOW())
    `, [title, slug, content, excerpt, author || 'Admin', imageUrl, category || 'General']);
    
    res.json({ success: true, post: { id: result.insertId, title, slug, content, excerpt, author, category, featured } });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ success: false, message: 'Failed to create blog post' });
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

// Get all advertisements
router.get('/advertisements', authenticateToken, async (req, res) => {
  try {
    const [ads] = await db.execute(`
      SELECT id, title, advertiser, image_url, cta_text, target_url, category, placements, is_active, priority, created_at, updated_at
      FROM advertisements 
      ORDER BY priority ASC, created_at DESC
    `);
    
    res.json({ success: true, ads });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advertisements' });
  }
});

// Create advertisement
router.post('/advertisements', authenticateToken, async (req, res) => {
  try {
    const { title, advertiser, imageUrl, ctaText, targetUrl, category, placements } = req.body;
    
    const [result] = await db.execute(`
      INSERT INTO advertisements (title, advertiser, image_url, cta_text, target_url, category, placements)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, advertiser, imageUrl, ctaText, targetUrl, category, JSON.stringify(placements)]);
    
    res.json({ success: true, ad: { id: result.insertId, title, advertiser, imageUrl, ctaText, targetUrl, category, placements } });
  } catch (error) {
    console.error('Error creating advertisement:', error);
    res.status(500).json({ success: false, message: 'Failed to create advertisement' });
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

// Get user overrides
router.get('/user-overrides', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT id, email, role, account_tier, full_name, company_name, is_admin, app_roles, created_at, updated_at
      FROM user_overrides 
      ORDER BY created_at DESC
    `);
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching user overrides:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user overrides' });
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

// Get module configuration for user
router.get('/module-config/:email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    
    const [configs] = await db.execute(`
      SELECT modules, module_order
      FROM module_configurations 
      WHERE user_email = ?
    `, [email]);
    
    if (configs.length === 0) {
      return res.json({ success: true, modules: [], moduleOrder: [] });
    }
    
    const config = configs[0];
    res.json({ 
      success: true, 
      modules: JSON.parse(config.modules), 
      moduleOrder: JSON.parse(config.module_order) 
    });
  } catch (error) {
    console.error('Error fetching module config:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch module config' });
  }
});

// Save module configuration for user
router.post('/module-config', authenticateToken, async (req, res) => {
  try {
    const { email, modules, moduleOrder } = req.body;
    
    await db.execute(`
      INSERT INTO module_configurations (user_email, modules, module_order) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE modules = VALUES(modules), module_order = VALUES(module_order)
    `, [email, JSON.stringify(modules), JSON.stringify(moduleOrder)]);
    
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

export default router;


