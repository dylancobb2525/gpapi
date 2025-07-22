import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert medical education grant writer creating the SECOND HALF of a comprehensive grant proposal. You will build upon Part 1 content to complete a full, cohesive grant proposal.

MANDATORY REQUIREMENTS:
✓ Generate Part 2 of grant proposal (1,000-1,300 words)
✓ Professional grant proposal formatting with clear section headers
✓ Reference and build upon the Part 1 content provided for consistency
✓ Use all provided context to create evidence-based content
✓ Comprehensive paragraphs, not bullet points

PART 2 SECTIONS TO INCLUDE:

**OUTCOMES & EVALUATION** (400-500 words)
- Specific, measurable learning outcomes aligned with Part 1 objectives
- Pre/post assessment strategies and tools
- Data collection and analysis plans
- Quality improvement metrics and KPIs
- Success criteria and benchmarks

**TARGET AUDIENCE & RECRUITMENT** (300-400 words)
- Detailed audience demographics consistent with Part 1 needs assessment
- Recruitment strategies and channels
- Estimated participation numbers and engagement rates
- Audience segmentation and targeting approach

**INNOVATION & IMPACT** (200-250 words)
- Unique educational approaches building on Part 1 methodology
- Differentiation from existing programs
- Expected clinical practice improvements
- Long-term impact on patient outcomes

**BUDGET JUSTIFICATION** (100-150 words)
- Budget rationale based on format recommendations and Part 1 design
- Cost-effectiveness analysis
- Resource allocation overview

Generate compelling, professional content for Part 2 that seamlessly continues from Part 1 to create one complete, cohesive grant proposal.

End with: → Complete Grant Proposal Generated! Next step: Proposal Reviewer. Are you ready to continue?`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      format_recommendations, 
      part1_content,
      rfp_summary,
      clinical_context,
      custom_notes
    } = req.body;

    // Validate required fields
    if (!format_recommendations || typeof format_recommendations !== 'string' || format_recommendations.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Format recommendations field is required and must be a non-empty string' 
      });
    }

    if (!part1_content || typeof part1_content !== 'string' || part1_content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Part 1 content is required to generate Part 2' 
      });
    }

    // Build comprehensive user message for Part 2 that references Part 1 with strict token limits
    let userMessage = `PART 1 CONTENT (to build upon):\n${part1_content.substring(0, 800)}\n\nFORMAT STRATEGY: ${format_recommendations.substring(0, 500)}`;

    if (rfp_summary && typeof rfp_summary === 'string' && rfp_summary.trim().length > 0) {
      userMessage += `\n\nRFP CONTEXT: ${rfp_summary.substring(0, 400)}`;
    }

    if (clinical_context && typeof clinical_context === 'string' && clinical_context.trim().length > 0) {
      userMessage += `\n\nCLINICAL CONTEXT: ${clinical_context.substring(0, 500)}`;
    }

    if (custom_notes && typeof custom_notes === 'string' && custom_notes.trim().length > 0) {
      userMessage += `\n\nADDITIONAL NOTES: ${custom_notes.substring(0, 200)}`;
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
        max_tokens: 2000
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