import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.LLM_API_KEY;
const baseURL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
const model = process.env.LLM_MODEL || 'gpt-4o-mini';

let openai = null;
if (apiKey && apiKey !== 'your_api_key_here') {
  openai = new OpenAI({ apiKey, baseURL });
}

/**
 * Fallback scoring algorithm if LLM key is absent or network fails
 */
function heuristicFallbackAnalysis(lead) {
  const budget = Number(lead.budget) || 0;
  const timeline = (lead.timeline || '').toLowerCase();
  const message = (lead.message || '').toLowerCase();

  let score = 30; // base score

  // Budget factor
  if (budget >= 20000) score += 35;
  else if (budget >= 5000) score += 20;
  else if (budget > 0) score += 10;

  // Urgency factor
  if (timeline.includes('urgent') || timeline.includes('1-2 weeks')) score += 25;
  else if (timeline.includes('month')) score += 15;

  // Clarity / Intent factor
  if (message.length > 50) score += 10;

  score = Math.min(Math.max(score, 10), 98);

  let category = 'Cold';
  let intent = 'Low';

  if (score >= 80) {
    category = 'Hot';
    intent = 'High';
  } else if (score >= 50) {
    category = 'Warm';
    intent = 'Medium';
  }

  return {
    score,
    category,
    summary: `Heuristic qualification: Client has a budget of $${budget.toLocaleString()} with a ${lead.timeline || 'flexible'} timeline.`,
    need: lead.message.slice(0, 80) + '...',
    intent,
    raw: { mode: 'fallback_heuristic' },
  };
}

/**
 * Main AI Qualification Service
 */
export async function analyzeLeadWithAI(lead) {
  if (!openai) {
    console.log('⚡ No LLM API key configured — using heuristic evaluation engine.');
    return heuristicFallbackAnalysis(lead);
  }

  const prompt = `
You are an expert enterprise B2B sales qualification AI.
Analyze the following lead inquiry and evaluate purchase intent, budget suitability, and project urgency.

Lead Information:
- Name: ${lead.name}
- Email: ${lead.email}
- Company: ${lead.company || 'Not provided'}
- Job Title: ${lead.jobTitle || 'Not provided'}
- Budget (USD): ${lead.budget ? `$${lead.budget}` : 'Unspecified'}
- Timeline: ${lead.timeline || 'Flexible'}
- Message / Requirements: "${lead.message}"

Qualification Criteria:
- Score: Integer from 0 to 100 based on budget, urgency, and requirement clarity.
- Category: "Hot" (80-100), "Warm" (50-79), or "Cold" (0-49).
- Need: A concise summary of their core business problem (max 10 words).
- Intent: "High", "Medium", or "Low".
- Summary: A 1-2 sentence executive summary for the sales team.

Return strictly a valid JSON object matching this exact schema:
{
  "score": number,
  "category": "Hot" | "Warm" | "Cold",
  "need": "string",
  "intent": "High" | "Medium" | "Low",
  "summary": "string"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI sales assistant that outputs strictly valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const rawContent = response.choices[0].message.content;
    const aiData = JSON.parse(rawContent);

    // Backend scoring validation
    let finalScore = Number(aiData.score) || 50;
    finalScore = Math.min(Math.max(finalScore, 0), 100);

    let finalCategory = 'Cold';
    if (finalScore >= 80) finalCategory = 'Hot';
    else if (finalScore >= 50) finalCategory = 'Warm';

    return {
      score: finalScore,
      category: finalCategory,
      need: aiData.need || 'General Inquiry',
      intent: aiData.intent || 'Medium',
      summary: aiData.summary || 'Lead submitted for qualification.',
      raw: aiData,
    };
  } catch (error) {
    console.error('LLM API call failed, falling back to heuristic:', error.message);
    return heuristicFallbackAnalysis(lead);
  }
}