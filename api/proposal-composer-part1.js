import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Generate Part 1 of a medical education grant proposal (800-1000 words). Include:

1. EXECUTIVE SUMMARY (250 words)
2. NEEDS ASSESSMENT (400 words) 
3. PROGRAM DESIGN (200 words)

Professional formatting, evidence-based content. End with: → Part 1 Complete. Ready for Part 2?`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      rfp_summary, 
      clinical_context, 
      format_recommendations, 
      custom_notes
    } = req.body;

    // Quick validation
    if (!rfp_summary || !clinical_context || !format_recommendations) {
      return res.status(400).json({ 
        error: 'RFP summary, clinical context, and format recommendations are required' 
      });
    }

    // Minimal user message
    let userMessage = `RFP: ${rfp_summary.substring(0, 400)}\nClinical: ${clinical_context.substring(0, 600)}\nFormat: ${format_recommendations.substring(0, 300)}`;

    if (custom_notes) {
      userMessage += `\nNotes: ${custom_notes.substring(0, 200)}`;
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
        max_tokens: 1500
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
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
    console.error('Part 1 Error:', error);
    
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