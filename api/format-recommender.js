import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { educational_gaps, product_lifecycle_stage, clinical_context } = req.body;

    if (!educational_gaps || !product_lifecycle_stage) {
      return res.status(400).json({ 
        error: 'Educational gaps and product lifecycle stage are required' 
      });
    }

    // Minimal prompt for speed
    const userMessage = `Educational gaps: ${JSON.stringify(educational_gaps).substring(0, 300)}\nProduct stage: ${product_lifecycle_stage}\nClinical context: ${clinical_context ? clinical_context.substring(0, 400) : 'Not provided'}`;

    // Ultra-fast call
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Recommend the optimal medical education format based on gaps and product stage. Include format type, audience size, duration, and key features. Be concise but comprehensive (400-600 words).'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
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
      output: output.trim() + '\n\n→ Next step: Grant Proposal Composer. Ready to continue?'
    });

  } catch (error) {
    console.error('Format Recommender Error:', error);
    
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