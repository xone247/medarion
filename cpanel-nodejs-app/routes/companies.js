import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all companies
router.get('/', async (req, res) => {
  try {
    const { industry, stage, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM companies WHERE 1=1';
    const params = [];

    if (industry) {
      query += ' AND industry = ?';
      params.push(industry);
    }

    if (stage) {
      query += ' AND stage = ?';
      params.push(stage);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [companies] = await pool.execute(query, params);

    res.json({
      companies,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: companies.length
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [companies] = await pool.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ company: companies[0] });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new company (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, website, industry, stage, foundedYear, employeesCount, headquarters, fundingStage, totalFunding, logoUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO companies (name, description, website, industry, stage, founded_year, employees_count, headquarters, funding_stage, total_funding, logo_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, website, industry, stage, foundedYear, employeesCount, headquarters, fundingStage, totalFunding, logoUrl]
    );

    res.status(201).json({
      message: 'Company created successfully',
      company: {
        id: result.insertId,
        name,
        description,
        website,
        industry,
        stage,
        foundedYear,
        employeesCount,
        headquarters,
        fundingStage,
        totalFunding,
        logoUrl
      }
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update company (authenticated)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, website, industry, stage, foundedYear, employeesCount, headquarters, fundingStage, totalFunding, logoUrl } = req.body;

    const [result] = await pool.execute(
      `UPDATE companies SET 
       name = ?, description = ?, website = ?, industry = ?, stage = ?, founded_year = ?, 
       employees_count = ?, headquarters = ?, funding_stage = ?, total_funding = ?, logo_url = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, description, website, industry, stage, foundedYear, employeesCount, headquarters, fundingStage, totalFunding, logoUrl, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ message: 'Company updated successfully' });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete company (authenticated)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM companies WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
