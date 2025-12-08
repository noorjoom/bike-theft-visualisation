require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bike_theft_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Helper function to parse German date format (DD.MM.YYYY)
function parseGermanDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return null;
}

// Helper function to parse numeric values
function parseNumeric(value) {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

async function importCSV() {
  const csvPath = process.argv[2] || path.join(__dirname, '..', 'bike.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  console.log(`Reading CSV file: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing data (optional - comment out if you want to append)
    console.log('Clearing existing data...');
    await client.query('TRUNCATE TABLE bike_thefts RESTART IDENTITY');
    
    // Parse CSV
    console.log('Parsing CSV...');
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      encoding: 'ISO-8859-1',
    });
    
    console.log(`Found ${parseResult.data.length} rows to import`);
    
    // Batch insert
    const batchSize = 1000;
    let inserted = 0;
    
    for (let i = 0; i < parseResult.data.length; i += batchSize) {
      const batch = parseResult.data.slice(i, i + batchSize);
      const values = [];
      const placeholders = [];
      
      batch.forEach((row, idx) => {
        const baseIdx = idx * 12;
        placeholders.push(
          `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, $${baseIdx + 6}, $${baseIdx + 7}, $${baseIdx + 8}, $${baseIdx + 9}, $${baseIdx + 10}, $${baseIdx + 11}, $${baseIdx + 12})`
        );
        values.push(
          parseGermanDate(row.ANGELEGT_AM),
          parseGermanDate(row.TATZEIT_ANFANG_DATUM),
          parseNumeric(row.TATZEIT_ANFANG_STUNDE),
          parseGermanDate(row.TATZEIT_ENDE_DATUM),
          parseNumeric(row.TATZEIT_ENDE_STUNDE),
          row.LOR || null,
          parseNumeric(row.SCHADENSHOEHE),
          row.VERSUCH || null,
          row.ART_DES_FAHRRADS || null,
          row.DELIKT || null,
          row.ERFASSUNGSGRUND || null,
          new Date()
        );
      });
      
      const query = `
        INSERT INTO bike_thefts (
          angelegt_am, tatzzeit_anfang_datum, tatzzeit_anfang_stunde,
          tatzzeit_ende_datum, tatzzeit_ende_stunde, lor, schadenshoehe,
          versuch, art_des_fahrrads, delikt, erfassungsgrund, created_at
        ) VALUES ${placeholders.join(', ')}
      `;
      
      await client.query(query, values);
      inserted += batch.length;
      console.log(`Imported ${inserted}/${parseResult.data.length} rows...`);
    }
    
    await client.query('COMMIT');
    console.log(`\n✅ Successfully imported ${inserted} rows!`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing CSV:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

importCSV();

