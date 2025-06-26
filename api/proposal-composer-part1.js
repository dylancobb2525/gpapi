import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert medical education grant writer creating the FIRST HALF of a comprehensive grant proposal. Generate Part 1 of a complete grant proposal with detailed content.

MANDATORY REQUIREMENTS:
✓ Generate Part 1 of grant proposal (1,200-1,500 words)
✓ Professional grant proposal formatting with clear section headers
✓ Use provided clinical research and context for evidence-based content
✓ Comprehensive paragraphs, not bullet points

PART 1 SECTIONS TO INCLUDE:

**EXECUTIVE SUMMARY** (350-400 words)
- Project overview, target audience, educational approach, anticipated outcomes
- Key statistics and compelling rationale for funding
- Clear value proposition for the medical education initiative

**NEEDS ASSESSMENT** (600-700 words)
- Clinical background from provided context
- Specific educational gaps and barriers identified
- Evidence-based justification with key citations
- Target audience needs analysis
- Current state of knowledge and practice gaps

**PROGRAM DESIGN & METHODOLOGY** (300-400 words)
- Educational format implementation overview
- Learning objectives and curriculum design approach
- Delivery methods and general timeline

Generate compelling, evidence-based content for Part 1. This will be followed by Part 2 with additional sections.

End with: → Part 1 Complete. Ready for Part 2: Implementation Details & Outcomes?`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      rfp_summary, 
      clinical_context, 
      format_recommendations, 
      custom_notes
    } = req.body;

    // Validate required fields
    if (!rfp_summary || typeof rfp_summary !== 'string' || rfp_summary.trim().length === 0) {
      return res.status(400).json({ 
        error: 'RFP summary field is required and must be a non-empty string' 
      });
    }

    if (!clinical_context || typeof clinical_context !== 'string' || clinical_context.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Clinical context field is required and must be a non-empty string' 
      });
    }

    if (!format_recommendations || typeof format_recommendations !== 'string' || format_recommendations.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Format recommendations field is required and must be a non-empty string' 
      });
    }

    // Build concise user message for Part 1
    let userMessage = `RFP Summary: ${rfp_summary.substring(0, 800)}\n\nClinical Context: ${clinical_context.substring(0, 1200)}\n\nFormat Strategy: ${format_recommendations.substring(0, 600)}`;

    if (custom_notes && typeof custom_notes === 'string' && custom_notes.trim().length > 0) {
      userMessage += `\n\nNotes: ${custom_notes.substring(0, 300)}`;
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
        max_tokens: 3000
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Part 1 generation timeout')), 20000)
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
    console.error('Proposal Composer Part 1 Error:', error);
    
    if (error.message === 'Part 1 generation timeout') {
      return res.status(408).json({ 
        error: 'Part 1 generation timeout - please try again' 
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