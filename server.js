require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files (index.html)

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bike_theft_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// API Routes

// Get all bike thefts (with optional pagination and filters)
app.get('/api/thefts', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10000,
      startDate,
      endDate,
      district,
      bikeType,
      minDamage,
      maxDamage
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 0;

    // Build WHERE clause dynamically
    if (startDate) {
      paramCount++;
      conditions.push(`tatzzeit_anfang_datum >= $${paramCount}`);
      values.push(startDate);
    }

    if (endDate) {
      paramCount++;
      conditions.push(`tatzzeit_anfang_datum <= $${paramCount}`);
      values.push(endDate);
    }

    if (district) {
      paramCount++;
      conditions.push(`lor LIKE $${paramCount}`);
      values.push(`${district}%`);
    }

    if (bikeType) {
      paramCount++;
      conditions.push(`art_des_fahrrads = $${paramCount}`);
      values.push(bikeType);
    }

    if (minDamage) {
      paramCount++;
      conditions.push(`schadenshoehe >= $${paramCount}`);
      values.push(parseFloat(minDamage));
    }

    if (maxDamage) {
      paramCount++;
      conditions.push(`schadenshoehe <= $${paramCount}`);
      values.push(parseFloat(maxDamage));
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    paramCount++;
    values.push(parseInt(limit));
    paramCount++;
    values.push(parseInt(offset));

    const query = `
      SELECT 
        id,
        angelegt_am as "ANGELEGT_AM",
        tatzzeit_anfang_datum as "TATZEIT_ANFANG_DATUM",
        tatzzeit_anfang_stunde as "TATZEIT_ANFANG_STUNDE",
        tatzzeit_ende_datum as "TATZEIT_ENDE_DATUM",
        tatzzeit_ende_stunde as "TATZEIT_ENDE_STUNDE",
        lor as "LOR",
        schadenshoehe as "SCHADENSHOEHE",
        versuch as "VERSUCH",
        art_des_fahrrads as "ART_DES_FAHRRADS",
        delikt as "DELIKT",
        erfassungsgrund as "ERFASSUNGSGRUND"
      FROM bike_thefts
      ${whereClause}
      ORDER BY tatzzeit_anfang_datum DESC, tatzzeit_anfang_stunde DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM bike_thefts ${whereClause}`;
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(query, values);
    
    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching thefts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get statistics/aggregations
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_thefts,
        AVG(schadenshoehe) as avg_damage,
        SUM(schadenshoehe) as total_damage,
        MIN(tatzzeit_anfang_datum) as earliest_date,
        MAX(tatzzeit_anfang_datum) as latest_date
      FROM bike_thefts
      WHERE schadenshoehe IS NOT NULL
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unique bike types
app.get('/api/bike-types', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT art_des_fahrrads
      FROM bike_thefts
      WHERE art_des_fahrrads IS NOT NULL
      ORDER BY art_des_fahrrads
    `);
    
    res.json(result.rows.map(row => row.art_des_fahrrads));
  } catch (error) {
    console.error('Error fetching bike types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});

