import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('--- Database Diagnostic Check ---');

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is missing or empty in your server/.env file!');
  console.error('Check if your .env file is inside the "server" folder.');
  process.exit(1);
}

// Safely display the connection target (hiding password)
const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
console.log('Found DATABASE_URL:', maskedUrl);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000, // Stop waiting after 10 seconds
});

try {
  console.log('Connecting to Neon PostgreSQL...');
  const res = await pool.query('SELECT NOW() as current_time');
  console.log('✅ SUCCESS! Connected to Neon database.');
  console.log('Database server time:', res.rows[0].current_time);
  await pool.end();
} catch (err) {
  console.error('\n❌ Connection Failed!');
  console.error('Error Code:', err.code || 'NO_CODE');
  console.error('Error Message:', err.message);
  await pool.end();
}