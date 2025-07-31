import pkg from 'pg';
const { Pool } = pkg;

console.log('Postgres URL:', process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS usuarios (
    steamid TEXT PRIMARY KEY,
    argentums INTEGER DEFAULT 0,
    password TEXT
  );
`);

export default pool;
