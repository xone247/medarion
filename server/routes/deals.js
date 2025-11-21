import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all deals
router.get('/', async (req, res) => {
  try {
    const { companyId, dealType, status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT d.*, c.name as company_name, c.industry 
      FROM deals d 
      LEFT JOIN companies c ON d.company_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (companyId) {
      query += ' AND d.company_id = ?';
      params.push(companyId);
    }

    if (dealType) {
      query += ' AND d.deal_type = ?';
      params.push(dealType);
    }

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    query += ' ORDER BY d.deal_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [deals] = await pool.execute(query, params);

    res.json({
      deals,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: deals.length
      }
    });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get deal by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [deals] = await pool.execute(
      `SELECT d.*, c.name as company_name, c.industry 
       FROM deals d 
       LEFT JOIN companies c ON d.company_id = c.id 
       WHERE d.id = ?`,
      [id]
    );

    if (deals.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json({ deal: deals[0] });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new deal (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { companyId, dealType, amount, valuation, leadInvestor, participants, dealDate, status, description } = req.body;

    if (!companyId || !dealType) {
      return res.status(400).json({ error: 'Company ID and deal type are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO deals (company_id, deal_type, amount, valuation, lead_investor, participants, deal_date, status, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, dealType, amount, valuation, leadInvestor, participants, dealDate, status || 'announced', description]
    );

    res.status(201).json({
      message: 'Deal created successfully',
      deal: {
        id: result.insertId,
        companyId,
        dealType,
        amount,
        valuation,
        leadInvestor,
        participants,
        dealDate,
        status: status || 'announced',
        description
      }
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update deal (authenticated)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, dealType, amount, valuation, leadInvestor, participants, dealDate, status, description } = req.body;

    const [result] = await pool.execute(
      `UPDATE deals SET 
       company_id = ?, deal_type = ?, amount = ?, valuation = ?, lead_investor = ?, 
       participants = ?, deal_date = ?, status = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [companyId, dealType, amount, valuation, leadInvestor, participants, dealDate, status, description, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json({ message: 'Deal updated successfully' });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete deal (authenticated)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM deals WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
