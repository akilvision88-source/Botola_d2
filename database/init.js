/* =========================================================
   BOTOLA D2 — database/init.js
   Creates the database schema from schema.sql, then seeds
   from seed.sql. Safe to run multiple times.
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

const SCHEMA_FILE = path.join(__dirname, 'schema.sql');
const SEED_FILE = path.join(__dirname, 'seed.sql');

async function run() {
  console.log('🔧 BOTOLA D2 — Database initializer');
  console.log(`   Host: ${DB_HOST}:${DB_PORT}  User: ${DB_USER}  DB: ${DB_NAME}`);

  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error('❌ schema.sql not found at', SCHEMA_FILE);
    process.exit(1);
  }
  if (!fs.existsSync(SEED_FILE)) {
    console.error('❌ seed.sql not found at', SEED_FILE);
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true
  });

  try {
    console.log('➡️  Applying schema.sql ...');
    const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
    await connection.query(schema);
    console.log('✅ Schema applied');

    // Use the DB
    await connection.query(`USE \`${DB_NAME}\``);

    // Check if already seeded
    const [usersRows] = await connection.query(
      "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = ? AND table_name = 'users'",
      [DB_NAME]
    );
    if (usersRows[0].c === 0) {
      console.error('❌ users table missing after schema init');
      process.exit(1);
    }

    const [existing] = await connection.query('SELECT COUNT(*) AS c FROM users');
    if (existing[0].c > 0) {
      console.log(`ℹ️  Users already present (${existing[0].c}). Skipping seed to avoid duplicates.`);
      console.log('   Delete data manually or drop DB to reseed.');
    } else {
      console.log('➡️  Applying seed.sql ...');
      const seed = fs.readFileSync(SEED_FILE, 'utf8');
      await connection.query(seed);
      console.log('✅ Seed applied');
    }

    console.log('\n🎉 Database ready!');
    console.log('   Admin login: superadmin@botolad2.com / Admin@123');
    console.log('   User login:  user@botolad2.com / Admin@123');
    console.log('');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();