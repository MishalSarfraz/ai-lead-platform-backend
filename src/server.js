import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { query } from './db/database.js';
import leadRoutes from './routes/leadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Mount API Routes
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('AI Lead Platform Backend is running. Visit /api/health for system status.');
});

app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await query('SELECT NOW() as db_time');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      dbTime: dbResult.rows[0].db_time,
    });
  } catch (err) {
    res.status(500).json({ status: 'degraded', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});