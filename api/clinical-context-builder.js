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

    // Simple, fast call like RFP analyzer
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a medical education specialist. Create a comprehensive clinical background and needs assessment (1000-1500 words) with 10-12 peer-reviewed citations for the given therapeutic area. Include clinical landscape, recent advances, practice gaps, and educational needs.'
        },
        {
          role: 'user',
          content: `Create a medical education needs assessment for: ${therapeutic_area.trim()}`
        }
      ],
      max_tokens: 2500,
      temperature: 0.2
    });

    const output = completion.choices[0]?.message?.content;

    if (!output) {
      throw new Error('No response from OpenAI');
    }

    return res.status(200).json({
      output: output.trim() + '\n\n→ Next step: Format Recommender. Are you ready to continue?'
    });

  } catch (error) {
    console.error('Clinical Context Builder Error:', error);
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded - please try again in a moment' 
      });
    }
    
    if (error.status) {
      return res.status(500).json({ 
        error: `OpenAI API Error (${error.status}): ${error.message}` 
      });
    }

    return res.status(500).json({ 
      error: `Internal server error: ${error.message}`,
      type: error.constructor.name
    });
  }
} 