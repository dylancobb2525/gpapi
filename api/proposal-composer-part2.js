import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert medical education grant writer creating the SECOND HALF of a comprehensive grant proposal. Generate Part 2 to complete the grant proposal with detailed content.

MANDATORY REQUIREMENTS:
✓ Generate Part 2 of grant proposal (1,000-1,300 words)
✓ Professional grant proposal formatting with clear section headers
✓ Use provided context to create evidence-based content
✓ Comprehensive paragraphs, not bullet points

PART 2 SECTIONS TO INCLUDE:

**OUTCOMES & EVALUATION** (400-500 words)
- Specific, measurable learning outcomes
- Pre/post assessment strategies and tools
- Data collection and analysis plans
- Quality improvement metrics and KPIs
- Success criteria and benchmarks

**TARGET AUDIENCE & RECRUITMENT** (300-400 words)
- Detailed audience demographics and characteristics
- Recruitment strategies and channels
- Estimated participation numbers and engagement rates
- Audience segmentation and targeting approach

**INNOVATION & IMPACT** (200-250 words)
- Unique educational approaches and methodologies
- Differentiation from existing programs
- Expected clinical practice improvements
- Long-term impact on patient outcomes

**BUDGET JUSTIFICATION** (100-150 words)
- Budget rationale based on format recommendations
- Cost-effectiveness analysis
- Resource allocation overview

Generate compelling, professional content for Part 2 that complements Part 1 to create a complete grant proposal.

End with: → Grant Proposal Complete. Next step: Proposal Reviewer. Are you ready to continue?`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      format_recommendations, 
      custom_notes,
      part1_content
    } = req.body;

    // Validate required fields
    if (!format_recommendations || typeof format_recommendations !== 'string' || format_recommendations.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Format recommendations field is required and must be a non-empty string' 
      });
    }

    // Build focused user message for Part 2
    let userMessage = `Format Strategy: ${format_recommendations}`;

    if (custom_notes && typeof custom_notes === 'string' && custom_notes.trim().length > 0) {
      userMessage += `\n\nAdditional Notes: ${custom_notes}`;
    }

    if (part1_content && typeof part1_content === 'string' && part1_content.trim().length > 0) {
      userMessage += `\n\nPart 1 Context: ${part1_content.substring(0, 500)}`;
    }

    // Call OpenAI with timeout protection
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.1,
        max_tokens: 2500
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Part 2 generation timeout')), 15000)
      )
    ]);

    const output = completion.choices[0]?.message?.content;

    if (!output) {
      throw new Error('No response received from OpenAI');
    }

    return res.status(200).json({
      output: output.trim()
    });

  } catch (error) {
    console.error('Proposal Composer Part 2 Error:', error);
    
    if (error.message === 'Part 2 generation timeout') {
      return res.status(408).json({ 
        error: 'Part 2 generation timeout - please try again' 
      });
    }
    
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