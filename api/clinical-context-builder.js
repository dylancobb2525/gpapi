import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { therapeutic_area } = req.body;

    if (!therapeutic_area || typeof therapeutic_area !== 'string' || therapeutic_area.trim().length === 0) {
      return res.status(400).json({ error: 'Therapeutic area is required' });
    }

    // Ultra-fast minimal call
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Create a medical education needs assessment (800-1000 words) with clinical background, practice gaps, and 8-10 citations for the given therapeutic area.'
          },
          {
            role: 'user',
            content: `Therapeutic area: ${therapeutic_area.trim()}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.2
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 8000)
      )
    ]);

    const output = completion.choices[0]?.message?.content;
    
    if (!output) {
      throw new Error('No response from OpenAI');
    }

    return res.status(200).json({
      output: output.trim() + '\n\n→ Next step: Format Recommender. Ready to continue?'
    });

  } catch (error) {
    console.error('API Error:', error);
    
    if (error.message === 'Timeout') {
      return res.status(408).json({ 
        error: 'Request timeout - please try again' 
      });
    }
    
    return res.status(500).json({ 
      error: `Error: ${error.message}`
    });
  }
} 