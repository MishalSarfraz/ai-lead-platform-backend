import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { query } from './db/database.js';
import leadRoutes from './routes/leadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins or specific frontend URL
app.use(cors({
  origin: true, // Dynamically allows the requesting origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Explicitly answer preflight requests
app.options('*', cors());

// Routes
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('AI Lead Platform Backend running on Vercel Serverless.');
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
