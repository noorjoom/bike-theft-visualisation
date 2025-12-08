require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default database first
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up database...');
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'bike_theft_db';
    await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName])
      .then(result => {
        if (result.rows.length === 0) {
          console.log(`Creating database ${dbName}...`);
          // Note: CREATE DATABASE cannot be run in a transaction
          return client.query(`CREATE DATABASE ${dbName}`);
        } else {
          console.log(`Database ${dbName} already exists.`);
        }
      });
    
    await client.release();
    
    // Connect to the new database
    const dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
    
    const dbClient = await dbPool.connect();
    
    try {
      // Create table
      await dbClient.query(`
        CREATE TABLE IF NOT EXISTS bike_thefts (
          id SERIAL PRIMARY KEY,
          angelegt_am DATE,
          tatzzeit_anfang_datum DATE,
          tatzzeit_anfang_stunde INTEGER,
          tatzzeit_ende_datum DATE,
          tatzzeit_ende_stunde INTEGER,
          lor VARCHAR(20),
          schadenshoehe DECIMAL(10, 2),
          versuch VARCHAR(10),
          art_des_fahrrads VARCHAR(100),
          delikt VARCHAR(100),
          erfassungsgrund TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes for better query performance
      await dbClient.query(`
        CREATE INDEX IF NOT EXISTS idx_lor ON bike_thefts(lor);
        CREATE INDEX IF NOT EXISTS idx_tatzzeit_anfang_datum ON bike_thefts(tatzzeit_anfang_datum);
        CREATE INDEX IF NOT EXISTS idx_art_des_fahrrads ON bike_thefts(art_des_fahrrads);
        CREATE INDEX IF NOT EXISTS idx_tatzzeit_anfang_stunde ON bike_thefts(tatzzeit_anfang_stunde);
      `);
      
      console.log('Database schema created successfully!');
      
    } finally {
      await dbClient.release();
      await dbPool.end();
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();

