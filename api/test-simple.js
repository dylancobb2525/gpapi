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
      return res.status(400).json({ error: 'Therapeutic area is required' });
    }

    // Simple, fast OpenAI call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a medical education specialist. Provide a brief clinical overview for the given therapeutic area.'
        },
        {
          role: 'user',
          content: `Provide a brief clinical overview for: ${therapeutic_area}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const output = completion.choices[0]?.message?.content;

    return res.status(200).json({
      output: output || 'No response generated'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: `Error: ${error.message}` 
    });
  }
} 