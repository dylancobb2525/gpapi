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

    // ULTRA-MINIMAL call - fastest possible
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Create a brief medical education needs assessment (400-600 words) with clinical background and 5-8 citations.'
          },
          {
            role: 'user',
            content: therapeutic_area.trim()
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]);

    const output = completion.choices[0]?.message?.content;
    
    if (!output) {
      throw new Error('No response from OpenAI');
    }

    return res.status(200).json({
      output: output.trim() + '\n\n→ Ready for Step 3: Format Recommender?'
    });

  } catch (error) {
    console.error('Error:', error);
    
    if (error.message === 'Timeout') {
      return res.status(408).json({ 
        error: 'Timeout - please retry' 
      });
    }
    
    return res.status(500).json({ 
      error: error.message || 'Server error'
    });
  }
} 