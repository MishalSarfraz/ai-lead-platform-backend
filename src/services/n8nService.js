import dotenv from 'dotenv';

dotenv.config();

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;

/**
 * Triggers the n8n automation webhook with qualified lead data
 * @param {Object} lead - The saved lead object from PostgreSQL
 */
export async function triggerLeadWorkflow(lead) {
  if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL === 'https://your-n8n-instance/webhook/new-lead') {
    console.log('ℹ️ n8n webhook URL not configured. Skipping workflow trigger.');
    return { skipped: true, reason: 'URL_NOT_CONFIGURED' };
  }

  const payload = {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    jobTitle: lead.job_title || lead.jobTitle,
    budget: lead.budget,
    timeline: lead.timeline,
    score: lead.score,
    category: lead.category,
    need: lead.need,
    intent: lead.intent,
    summary: lead.summary,
    submittedAt: lead.created_at || new Date().toISOString(),
  };

  try {
    console.log(`📡 Dispatching lead #${lead.id} [${lead.category}] to n8n webhook...`);

    const headers = {
      'Content-Type': 'application/json',
    };

    if (N8N_WEBHOOK_SECRET) {
      headers['X-Webhook-Secret'] = N8N_WEBHOOK_SECRET;
    }

    // Set a 5-second timeout so the server doesn't hang if n8n is unresponsive
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`n8n responded with HTTP status ${response.status}`);
    }

    console.log(`✅ n8n workflow triggered successfully for lead #${lead.id}`);
    return { success: true };
  } catch (error) {
    // Log failure but do not throw, protecting the saved database record
    console.error(`⚠️ Failed to trigger n8n for lead #${lead.id}:`, error.message);
    return { success: false, error: error.message };
  }
}