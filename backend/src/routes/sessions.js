import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

const SERVICE_FEE_RATE = 0.08;

router.post('/', async (req, res) => {
  const { station_id, phone, payment_method } = req.body;
  if (!station_id || !phone || !payment_method) {
    return res.status(400).json({ error: 'station_id, phone, and payment_method required' });
  }
  try {
    // Mark station busy
    await query("UPDATE stations SET status = 'busy' WHERE id = $1", [station_id]);

    const { rows } = await query(
      `INSERT INTO sessions (station_id, phone, payment_method, status)
       VALUES ($1, $2, $3, 'active') RETURNING *`,
      [station_id, phone, payment_method]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.*, st.name AS station_name, st.address, st.price_per_kwh, st.speed_kw
       FROM sessions s
       JOIN stations st ON s.station_id = st.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Session not found' });

    const session = rows[0];
    const elapsedSec = session.ended_at
      ? Math.floor((new Date(session.ended_at) - new Date(session.started_at)) / 1000)
      : Math.floor((Date.now() - new Date(session.started_at)) / 1000);

    const kwhDelivered = parseFloat(session.kwh_delivered) ||
      parseFloat(((session.speed_kw * elapsedSec) / 3600).toFixed(3));

    const subtotal = Math.round(kwhDelivered * session.price_per_kwh);
    const fee = Math.round(subtotal * SERVICE_FEE_RATE);

    res.json({ ...session, elapsed_sec: elapsedSec, kwh_delivered: kwhDelivered, subtotal_rwf: subtotal, fee_rwf: fee, total_rwf: subtotal + fee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    const sessionRes = await query(
      `SELECT s.*, st.price_per_kwh, st.speed_kw, s.station_id
       FROM sessions s JOIN stations st ON s.station_id = st.id
       WHERE s.id = $1 AND s.status = 'active'`,
      [req.params.id]
    );
    if (!sessionRes.rows.length) return res.status(404).json({ error: 'Active session not found' });

    const session = sessionRes.rows[0];
    const elapsedSec = Math.floor((Date.now() - new Date(session.started_at)) / 1000);
    const kwhDelivered = parseFloat(((session.speed_kw * elapsedSec) / 3600).toFixed(3));
    const subtotal = Math.round(kwhDelivered * session.price_per_kwh);
    const fee = Math.round(subtotal * SERVICE_FEE_RATE);

    const { rows } = await query(
      `UPDATE sessions SET status='completed', ended_at=now(), kwh_delivered=$1, cost_rwf=$2, fee_rwf=$3
       WHERE id=$4 RETURNING *`,
      [kwhDelivered, subtotal, fee, req.params.id]
    );

    await query("UPDATE stations SET status='available' WHERE id=$1", [session.station_id]);

    res.json({ ...rows[0], subtotal_rwf: subtotal, fee_rwf: fee, total_rwf: subtotal + fee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
