import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('--- Starting Database Migration ---');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log('Reading schema from:', schemaPath);
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing SQL queries on Neon database...');
    await pool.query(schemaSql);
    
    console.log('✅ SUCCESS: `leads` table and indexes created in Neon!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
    console.log('--- Migration Finished ---');
    process.exit(0);
  }
}

// Make sure this line is present to actually invoke the function!
runMigration();