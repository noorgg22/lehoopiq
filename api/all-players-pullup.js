import { setCors } from './_nba.js';
import { getPool, poolResponse } from './_pool.js';

export default async function handler(req, res) {
  setCors(res);
  try {
    const pool = await getPool();
    res.json(poolResponse(pool));
  } catch (e) {
    console.error('pool error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
