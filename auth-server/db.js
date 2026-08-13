const { Pool } = require('pg');

// DATABASE_URL comes from Neon.tech (or any Postgres host), set in .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // wymagane przez Neon.tech
});

// Initialize table on startup
async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    verification_token TEXT,
    reset_token TEXT,
    created_at BIGINT
  )`);
}

module.exports = { pool, init };
