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

    if (!therapeutic_area) {
      return res.status(400).json({ error: 'Therapeutic area required' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Create a medical education needs assessment (800-1200 words) with clinical background, practice gaps, and 8-10 citations.'
        },
        {
          role: 'user',
          content: `Therapeutic area: ${therapeutic_area}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.2
    });

    const output = completion.choices[0]?.message?.content;

    return res.status(200).json({
      output: output || 'No response generated'
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message || 'Unknown error'
    });
  }
} 