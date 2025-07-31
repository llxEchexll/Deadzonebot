import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saldos (
      steamid VARCHAR(32) PRIMARY KEY,
      cantidad INTEGER DEFAULT 0
    );
  `);
}

export async function sumarSaldo(steamid, cantidad) {
  await pool.query(
    `INSERT INTO saldos (steamid, cantidad) VALUES ($1, $2)
     ON CONFLICT (steamid) DO UPDATE SET cantidad = saldos.cantidad + $2`,
    [steamid, cantidad]
  );
}

export async function consultarSaldo(steamid) {
  const res = await pool.query('SELECT cantidad FROM saldos WHERE steamid = $1', [steamid]);
  return res.rows[0]?.cantidad || 0;
}