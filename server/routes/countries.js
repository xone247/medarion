import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all African countries data (for m-index map)
router.get('/africa', async (req, res) => {
  try {
    // Check if africa_countries table exists
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'africa_countries'
    `);

    if (tables.length === 0) {
      // Table doesn't exist, return static data structure
      return res.json({
        success: true,
        data: [],
        message: 'Table not found, using static data'
      });
    }

    const [countries] = await pool.execute(`
      SELECT 
        name,
        capital,
        currency_name as currency,
        currency_code as currencyCode,
        flag_emoji as flag,
        population,
        official_languages as languages,
        gdp,
        gdp_per_capita as gdpPerCapita,
        area_sq_km as area,
        iso_code as isoCode,
        longitude,
        latitude
      FROM africa_countries
      WHERE is_active = 1
      ORDER BY name
    `);

    // Parse languages if stored as JSON
    const formattedCountries = countries.map((country) => ({
      ...country,
      languages: typeof country.languages === 'string' 
        ? JSON.parse(country.languages || '[]')
        : country.languages || [],
      coordinates: [country.longitude, country.latitude],
      id: country.name.toLowerCase().replace(/\s+/g, '-')
    }));

    res.json({
      success: true,
      data: formattedCountries
    });
  } catch (error) {
    console.error('Error fetching African countries:', error);
    res.json({
      success: true,
      data: [],
      message: 'Error fetching data, using static data'
    });
  }
});

// Get country investment data for map visualization
router.get('/investment', async (req, res) => {
  try {
    // Aggregate investment data by country from deals table
    const [countryData] = await pool.execute(`
      SELECT 
        country,
        COUNT(*) as deal_count,
        SUM(amount) as total_investment,
        AVG(amount) as avg_investment,
        MAX(amount) as max_investment,
        CASE 
          WHEN SUM(amount) > 50000000 THEN 'high'
          WHEN SUM(amount) > 10000000 THEN 'medium'
          ELSE 'low'
        END as investment_level
      FROM deals
      WHERE country IS NOT NULL AND country != ''
      GROUP BY country
      ORDER BY total_investment DESC
    `);

    res.json({
      success: true,
      data: countryData.map(row => ({
        country: row.country,
        deal_count: row.deal_count,
        total_investment: parseFloat(row.total_investment || 0),
        avg_investment: parseFloat(row.avg_investment || 0),
        max_investment: parseFloat(row.max_investment || 0),
        investment_level: row.investment_level
      }))
    });
  } catch (error) {
    console.error('Error fetching country investment data:', error);
    // Return empty data structure if table doesn't exist or query fails
    res.json({
      success: true,
      data: []
    });
  }
});

export default router;

