import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import stationsRouter from './routes/stations.js';
import sessionsRouter from './routes/sessions.js';
import paymentsRouter from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

app.use('/api/stations', stationsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/payments', paymentsRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`ChargeRW API running on http://localhost:${PORT}`));
