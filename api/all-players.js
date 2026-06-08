// Single endpoint replacing all 8 all-players-* endpoints
// Use ?type=traditional|advanced|hustle|defense|catchshoot|pullup|passing|rebounding|tracking
import { setCors } from './_nba.js';
import { getPool, poolResponse } from './_pool.js';

export default async function handler(req, res) {
  setCors(res);
  try {
    const pool = await getPool();
    res.json(poolResponse(pool));
  } catch (e) {
    console.error('all-players error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
