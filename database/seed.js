/* =========================================================
   BOTOLA D2 — database/seed.js
   Runs seed.sql directly (useful when DB already exists).
   ========================================================= */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT, 10) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'botola_d2';

const SEED_FILE = path.join(__dirname, 'seed.sql');

async function run() {
  if (!fs.existsSync(SEED_FILE)) {
    console.error('❌ seed.sql not found');
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true
  });

  try {
    console.log(`➡️  Seeding ${DB_NAME} from seed.sql ...`);
    const seed = fs.readFileSync(SEED_FILE, 'utf8');
    await connection.query(seed);
    console.log('✅ Seed applied');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();