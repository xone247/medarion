import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all grants
router.get('/', async (req, res) => {
  try {
    const { grantType, status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM grants WHERE 1=1';
    const params = [];

    if (grantType) {
      query += ' AND grant_type = ?';
      params.push(grantType);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [grants] = await pool.execute(query, params);

    res.json({
      grants,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: grants.length
      }
    });
  } catch (error) {
    console.error('Get grants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get grant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [grants] = await pool.execute(
      'SELECT * FROM grants WHERE id = ?',
      [id]
    );

    if (grants.length === 0) {
      return res.status(404).json({ error: 'Grant not found' });
    }

    res.json({ grant: grants[0] });
  } catch (error) {
    console.error('Get grant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new grant (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, fundingAgency, amount, grantType, applicationDeadline, awardDate, status, requirements, contactEmail, website } = req.body;

    if (!title || !fundingAgency) {
      return res.status(400).json({ error: 'Title and funding agency are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO grants (title, description, funding_agency, amount, grant_type, application_deadline, award_date, status, requirements, contact_email, website) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, fundingAgency, amount, grantType || 'research', applicationDeadline, awardDate, status || 'open', requirements, contactEmail, website]
    );

    res.status(201).json({
      message: 'Grant created successfully',
      grant: {
        id: result.insertId,
        title,
        description,
        fundingAgency,
        amount,
        grantType: grantType || 'research',
        applicationDeadline,
        awardDate,
        status: status || 'open',
        requirements,
        contactEmail,
        website
      }
    });
  } catch (error) {
    console.error('Create grant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update grant (authenticated)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, fundingAgency, amount, grantType, applicationDeadline, awardDate, status, requirements, contactEmail, website } = req.body;

    const [result] = await pool.execute(
      `UPDATE grants SET 
       title = ?, description = ?, funding_agency = ?, amount = ?, grant_type = ?, 
       application_deadline = ?, award_date = ?, status = ?, requirements = ?, 
       contact_email = ?, website = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, description, fundingAgency, amount, grantType, applicationDeadline, awardDate, status, requirements, contactEmail, website, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Grant not found' });
    }

    res.json({ message: 'Grant updated successfully' });
  } catch (error) {
    console.error('Update grant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete grant (authenticated)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM grants WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Grant not found' });
    }

    res.json({ message: 'Grant deleted successfully' });
  } catch (error) {
    console.error('Delete grant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
