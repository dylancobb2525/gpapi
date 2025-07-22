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
          content: `You are a medical education specialist. Create a comprehensive clinical background and needs assessment (1500-2000 words) with 15-20 REAL peer-reviewed citations for the given therapeutic area. Include clinical landscape, recent advances, practice gaps, and educational needs.

CRITICAL REQUIREMENTS:
✓ Generate EXACTLY 15-20 REAL peer-reviewed citations with ACTUAL URLs/DOIs
✓ NO placeholder citations - only real, verifiable sources
✓ Include recent research (within last 5 years when possible)
✓ Provide comprehensive clinical background (1500-2000 words)
✓ Include practice gaps, educational needs, and clinical challenges
✓ Format citations with proper links: [Author et al. (Year) - Title](URL/DOI)
✓ Use high-impact journals: NEJM, JAMA, Lancet, BMJ, Nature, Science, etc.
✓ Include guidelines, systematic reviews, and clinical trials
✓ Focus on evidence-based medicine and current best practices
✓ ALL citations must be clickable and lead to real articles

REAL CITATION EXAMPLES (use similar format):
- [Singh et al. (2023) - Management of Rheumatoid Arthritis](https://doi.org/10.1056/NEJMra2206932)
- [Johnson et al. (2022) - Treatment Guidelines for Hypertension](https://pubmed.ncbi.nlm.nih.gov/35021000)
- [Williams et al. (2023) - Systematic Review of Treatment Outcomes](https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(23)00123-4)

DO NOT use placeholder citations. DO NOT say "illustrative" or "example" citations. Generate ONLY real, verifiable citations with actual URLs that work.`
        },
        {
          role: 'user',
          content: `Create a medical education needs assessment for: ${therapeutic_area.trim()}`
        }
      ],
              max_tokens: 4000,
      temperature: 0.3
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