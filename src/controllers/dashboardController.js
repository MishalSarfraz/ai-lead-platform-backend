import pool from '../db/database.js';

export async function getDashboardStats(req, res) {
  try {
    const queryText = `
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE category = 'Hot')::int AS hot,
        COUNT(*) FILTER (WHERE category = 'Warm')::int AS warm,
        COUNT(*) FILTER (WHERE category = 'Cold')::int AS cold
      FROM leads;
    `;

    const result = await pool.query(queryText);
    const stats = result.rows[0];

    return res.status(200).json({
      success: true,
      stats: {
        total: stats.total || 0,
        hot: stats.hot || 0,
        warm: stats.warm || 0,
        cold: stats.cold || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard statistics.',
    });
  }
}