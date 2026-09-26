import pool from '../db/database.js';
import { analyzeLeadWithAI } from '../services/aiService.js';
import { triggerLeadWorkflow } from '../services/n8nService.js';

export async function createLead(req, res) {
  try {
    const {
      name,
      email,
      phone,
      company,
      jobTitle,
      website,
      budget,
      timeline,
      industry,
      message,
    } = req.body;

    // 1. Run AI Qualification
    console.log(`Analyzing lead for: ${name} (${company || 'No company'})...`);
    const aiResult = await analyzeLeadWithAI({
      name,
      email,
      phone,
      company,
      jobTitle,
      budget,
      timeline,
      industry,
      message,
    });

    // 2. Persist to PostgreSQL
    const queryText = `
      INSERT INTO leads (
        name, email, phone, company, job_title, website,
        budget, timeline, industry, message,
        score, category, summary, need, intent, ai_raw_response
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, name, email, phone, company, job_title, budget, timeline, score, category, summary, need, intent, created_at;
    `;

    const values = [
      name.trim(),
      email.trim(),
      phone || null,
      company || null,
      jobTitle || null,
      website || null,
      budget ? Number(budget) : null,
      timeline || null,
      industry || null,
      message.trim(),
      aiResult.score,
      aiResult.category,
      aiResult.summary,
      aiResult.need,
      aiResult.intent,
      JSON.stringify(aiResult.raw),
    ];

    const result = await pool.query(queryText, values);
    const savedLead = result.rows[0];

    console.log(`✅ Lead #${savedLead.id} saved in DB as [${savedLead.category.toUpperCase()}]`);

    // 3. Trigger n8n Automation (Non-blocking background call)
    triggerLeadWorkflow(savedLead).catch((err) => {
      console.error('Background automation trigger error:', err.message);
    });

    // 4. Return instant response to client
    return res.status(201).json({
      success: true,
      message: 'Lead captured and qualified successfully!',
      lead: savedLead,
    });
  } catch (error) {
    console.error('Error in createLead controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while qualifying and saving lead.',
    });
  }
}

// Fetch all leads with optional filtering and search
export async function getLeads(req, res) {
  try {
    const { category, search } = req.query;

    let queryText = `
      SELECT id, name, email, phone, company, job_title, budget, timeline, 
             score, category, summary, need, intent, created_at
      FROM leads
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      queryText += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      queryText += ` AND (name ILIKE $${params.length} OR company ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY created_at DESC LIMIT 50;`;

    const result = await pool.query(queryText, params);
    return res.status(200).json({
      success: true,
      leads: result.rows,
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve leads.',
    });
  }
}

// Fetch single lead details by ID
export async function getLeadById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found.' });
    }

    return res.status(200).json({
      success: true,
      lead: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching lead by ID:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve lead details.',
    });
  }
}