import { Router } from 'express';
import { query } from '../db/index.js';
import { randomUUID } from 'crypto';

const router = Router();
const SERVICE_FEE_RATE = 0.08;

// Sandbox: simulate payment initiation and instant success
router.post('/initiate', async (req, res) => {
  const { session_id, provider, phone, amount_rwf } = req.body;
  if (!session_id || !provider || !phone || !amount_rwf) {
    return res.status(400).json({ error: 'session_id, provider, phone, amount_rwf required' });
  }
  try {
    const providerRef = `SANDBOX-${randomUUID().slice(0, 8).toUpperCase()}`;
    const { rows } = await query(
      `INSERT INTO payments (session_id, provider, provider_ref, amount_rwf, status)
       VALUES ($1, $2, $3, $4, 'success') RETURNING *`,
      [session_id, provider, providerRef, amount_rwf]
    );
    // In production: call MTN/Airtel sandbox here and set status = 'pending'
    res.status(201).json({ payment: rows[0], message: 'Payment successful (sandbox)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/estimate', (req, res) => {
  const { price_per_kwh, kwh = 25 } = req.query;
  if (!price_per_kwh) return res.status(400).json({ error: 'price_per_kwh required' });
  const subtotal = Math.round(Number(price_per_kwh) * Number(kwh));
  const fee = Math.round(subtotal * SERVICE_FEE_RATE);
  res.json({ subtotal_rwf: subtotal, fee_rwf: fee, total_rwf: subtotal + fee, kwh: Number(kwh) });
});

export default router;
