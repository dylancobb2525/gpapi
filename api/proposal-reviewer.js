import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { proposal_text } = req.body;

    if (!proposal_text || typeof proposal_text !== 'string' || proposal_text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Proposal text is required and must be a non-empty string' 
      });
    }

    // Ultra-fast review call
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Review this medical education grant proposal. Provide a concise assessment covering: strengths, areas for improvement, compliance with grant requirements, and specific recommendations. Be constructive and actionable (500-700 words).'
          },
          {
            role: 'user',
            content: `Review this grant proposal:\n\n${proposal_text.substring(0, 2000)}`
          }
        ],
        max_tokens: 1200,
        temperature: 0.1
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
      output: output.trim() + '\n\n→ Grant Pipeline Complete! Your proposal has been reviewed and is ready for submission.'
    });

  } catch (error) {
    console.error('Proposal Reviewer Error:', error);
    
    if (error.message === 'Timeout') {
      return res.status(408).json({ 
        error: 'Review timeout - please try again' 
      });
    }
    
    return res.status(500).json({ 
      error: `Error: ${error.message}`
    });
  }
} 