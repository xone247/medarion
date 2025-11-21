import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all clinical trials
router.get('/', async (req, res) => {
  try {
    const { phase, status, medicalCondition, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM clinical_trials WHERE 1=1';
    const params = [];

    if (phase) {
      query += ' AND phase = ?';
      params.push(phase);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (medicalCondition) {
      query += ' AND medical_condition LIKE ?';
      params.push(`%${medicalCondition}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [trials] = await pool.execute(query, params);

    res.json({
      trials,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: trials.length
      }
    });
  } catch (error) {
    console.error('Get clinical trials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get clinical trial by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [trials] = await pool.execute(
      'SELECT * FROM clinical_trials WHERE id = ?',
      [id]
    );

    if (trials.length === 0) {
      return res.status(404).json({ error: 'Clinical trial not found' });
    }

    res.json({ trial: trials[0] });
  } catch (error) {
    console.error('Get clinical trial error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new clinical trial (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, phase, medicalCondition, intervention, sponsor, location, startDate, endDate, status, nctNumber } = req.body;

    if (!title || !phase) {
      return res.status(400).json({ error: 'Title and phase are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO clinical_trials (title, description, phase, medical_condition, intervention, sponsor, location, start_date, end_date, status, nct_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, phase, medicalCondition, intervention, sponsor, location, startDate, endDate, status || 'recruiting', nctNumber]
    );

    res.status(201).json({
      message: 'Clinical trial created successfully',
      trial: {
        id: result.insertId,
        title,
        description,
        phase,
        medicalCondition,
        intervention,
        sponsor,
        location,
        startDate,
        endDate,
        status: status || 'recruiting',
        nctNumber
      }
    });
  } catch (error) {
    console.error('Create clinical trial error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update clinical trial (authenticated)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, phase, medicalCondition, intervention, sponsor, location, startDate, endDate, status, nctNumber } = req.body;

    const [result] = await pool.execute(
      `UPDATE clinical_trials SET 
       title = ?, description = ?, phase = ?, medical_condition = ?, intervention = ?, 
       sponsor = ?, location = ?, start_date = ?, end_date = ?, status = ?, 
       nct_number = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, description, phase, medicalCondition, intervention, sponsor, location, startDate, endDate, status, nctNumber, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Clinical trial not found' });
    }

    res.json({ message: 'Clinical trial updated successfully' });
  } catch (error) {
    console.error('Update clinical trial error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete clinical trial (authenticated)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM clinical_trials WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Clinical trial not found' });
    }

    res.json({ message: 'Clinical trial deleted successfully' });
  } catch (error) {
    console.error('Delete clinical trial error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
