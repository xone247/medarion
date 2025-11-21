/**
 * Investors API Routes
 * CRUD operations for investor profiles
 */

import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all investors (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { type, headquarters, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM investors WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (headquarters) {
      query += ' AND headquarters LIKE ?';
      params.push(`%${headquarters}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [investors] = await pool.execute(query, params);

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

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM investors WHERE 1=1';
    const countParams = [];
    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }
    if (headquarters) {
      countQuery += ' AND headquarters LIKE ?';
      countParams.push(`%${headquarters}%`);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      investors: parsedInvestors,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + investors.length < total
      }
    });
  } catch (error) {
    console.error('Get investors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single investor by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [investors] = await pool.execute(
      'SELECT * FROM investors WHERE id = ? OR slug = ?',
      [id, id]
    );

    if (investors.length === 0) {
      return res.status(404).json({ error: 'Investor not found' });
    }

    const investor = investors[0];

    // Parse JSON fields
    const parsedInvestor = {
      ...investor,
      focus_sectors: investor.focus_sectors ? JSON.parse(investor.focus_sectors) : [],
      investment_stages: investor.investment_stages ? JSON.parse(investor.investment_stages) : [],
      countries: investor.countries ? JSON.parse(investor.countries) : [],
      social_media: investor.social_media ? JSON.parse(investor.social_media) : {},
      recent_investments: investor.recent_investments ? JSON.parse(investor.recent_investments) : [],
      investment_criteria: investor.investment_criteria ? JSON.parse(investor.investment_criteria) : []
    };

    res.json({ investor: parsedInvestor });
  } catch (error) {
    console.error('Get investor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new investor (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name, logo, description, type, headquarters, founded,
      assets_under_management, website, focus_sectors, investment_stages,
      portfolio_companies, total_investments, average_investment, countries,
      team_size, contact_email, social_media, recent_investments,
      investment_criteria, portfolio_exits
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const [result] = await pool.execute(
      `INSERT INTO investors (
        name, slug, logo, description, type, headquarters, founded,
        assets_under_management, website, focus_sectors, investment_stages,
        portfolio_companies, total_investments, average_investment, countries,
        team_size, contact_email, social_media, recent_investments,
        investment_criteria, portfolio_exits
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, slug, logo, description, type, headquarters, founded,
        assets_under_management, website,
        JSON.stringify(focus_sectors || []),
        JSON.stringify(investment_stages || []),
        portfolio_companies || 0,
        total_investments || 0,
        average_investment || 0,
        JSON.stringify(countries || []),
        team_size, contact_email,
        JSON.stringify(social_media || {}),
        JSON.stringify(recent_investments || []),
        JSON.stringify(investment_criteria || []),
        portfolio_exits || 0
      ]
    );

    res.status(201).json({
      message: 'Investor created successfully',
      investor: { id: result.insertId, name, slug }
    });
  } catch (error) {
    console.error('Create investor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update investor (authenticated)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = [
      'name', 'logo', 'description', 'type', 'headquarters', 'founded',
      'assets_under_management', 'website', 'portfolio_companies',
      'total_investments', 'average_investment', 'team_size',
      'contact_email', 'portfolio_exits'
    ];

    const jsonFields = [
      'focus_sectors', 'investment_stages', 'countries',
      'social_media', 'recent_investments', 'investment_criteria'
    ];

    const setStatements = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setStatements.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    for (const field of jsonFields) {
      if (updates[field] !== undefined) {
        setStatements.push(`${field} = ?`);
        values.push(JSON.stringify(updates[field]));
      }
    }

    if (setStatements.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    setStatements.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await pool.execute(
      `UPDATE investors SET ${setStatements.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Investor updated successfully' });
  } catch (error) {
    console.error('Update investor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete investor (authenticated, admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && !req.user.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    await pool.execute('DELETE FROM investors WHERE id = ?', [id]);

    res.json({ message: 'Investor deleted successfully' });
  } catch (error) {
    console.error('Delete investor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

