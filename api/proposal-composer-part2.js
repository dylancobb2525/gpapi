import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Generate Part 2 of a medical education grant proposal (600-800 words). Include:

1. OUTCOMES & EVALUATION (300 words)
2. TARGET AUDIENCE (200 words)
3. INNOVATION & BUDGET (200 words)

Build on Part 1. Professional formatting. End with: → Complete Grant Proposal Generated!`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      format_recommendations, 
      part1_content,
      rfp_summary,
      clinical_context,
      custom_notes
    } = req.body;

    // Quick validation
    if (!format_recommendations || !part1_content) {
      return res.status(400).json({ 
        error: 'Format recommendations and Part 1 content are required' 
      });
    }

    // Minimal user message
    let userMessage = `Part 1: ${part1_content.substring(0, 500)}\nFormat: ${format_recommendations.substring(0, 300)}`;

    if (rfp_summary) {
      userMessage += `\nRFP: ${rfp_summary.substring(0, 200)}`;
    }

    // Ultra-fast OpenAI call
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 1200
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 8000)
      )
    ]);

    const output = completion.choices[0]?.message?.content;

    if (!output) {
      throw new Error('No response received');
    }

    return res.status(200).json({
      output: output.trim()
    });

  } catch (error) {
    console.error('Part 2 Error:', error);
    
    if (error.message === 'Timeout') {
      return res.status(408).json({ 
        error: 'Generation timeout - please try again' 
      });
    }
    
    return res.status(500).json({ 
      error: `Error: ${error.message}`
    });
  }
} 