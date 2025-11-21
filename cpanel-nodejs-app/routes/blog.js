import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all blog posts
router.get('/', async (req, res) => {
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

// Get blog post by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [posts] = await pool.execute(
      `SELECT bp.*, u.username as author_name, u.first_name, u.last_name 
       FROM blog_posts bp 
       LEFT JOIN users u ON bp.author_id = u.id 
       WHERE bp.id = ?`,
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({ post: posts[0] });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get blog post by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [posts] = await pool.execute(
      `SELECT bp.*, u.username as author_name, u.first_name, u.last_name 
       FROM blog_posts bp 
       LEFT JOIN users u ON bp.author_id = u.id 
       WHERE bp.slug = ? AND bp.status = 'published'`,
      [slug]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({ post: posts[0] });
  } catch (error) {
    console.error('Get blog post by slug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new blog post (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, slug, content, excerpt, featuredImage, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Generate slug if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const [result] = await pool.execute(
      `INSERT INTO blog_posts (title, slug, content, excerpt, author_id, featured_image, status, published_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, finalSlug, content, excerpt, req.user.id, featuredImage, status || 'draft', status === 'published' ? new Date() : null]
    );

    res.status(201).json({
      message: 'Blog post created successfully',
      post: {
        id: result.insertId,
        title,
        slug: finalSlug,
        content,
        excerpt,
        authorId: req.user.id,
        featuredImage,
        status: status || 'draft'
      }
    });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update blog post (authenticated)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, content, excerpt, featuredImage, status } = req.body;

    // Check if user owns the post or is admin
    const [existingPosts] = await pool.execute(
      'SELECT author_id FROM blog_posts WHERE id = ?',
      [id]
    );

    if (existingPosts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    if (existingPosts[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const [result] = await pool.execute(
      `UPDATE blog_posts SET 
       title = ?, slug = ?, content = ?, excerpt = ?, featured_image = ?, 
       status = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, slug, content, excerpt, featuredImage, status, status === 'published' ? new Date() : null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({ message: 'Blog post updated successfully' });
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete blog post (authenticated)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns the post or is admin
    const [existingPosts] = await pool.execute(
      'SELECT author_id FROM blog_posts WHERE id = ?',
      [id]
    );

    if (existingPosts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    if (existingPosts[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    const [result] = await pool.execute(
      'DELETE FROM blog_posts WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
