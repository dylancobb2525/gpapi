import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert medical education grant writer creating COMPREHENSIVE grant proposal sections. Generate complete, detailed grant proposal content with minimal input context.

MANDATORY REQUIREMENTS:
✓ Generate complete grant proposal sections (1,500-2,000 words total)
✓ Include ALL requested sections with substantial detail
✓ Use the minimal context provided to create evidence-based content
✓ Professional grant proposal formatting with clear section headers
✓ Comprehensive paragraphs, not bullet points or brief summaries
✓ Focus on generating high-quality content rather than relying on extensive input context

REQUIRED SECTIONS TO INCLUDE (based on sections_requested):

**EXECUTIVE SUMMARY** (300-350 words)
- Project overview, target audience, educational approach, anticipated outcomes
- Key statistics and compelling rationale for funding

**NEEDS ASSESSMENT** (400-500 words)
- Clinical background and current landscape
- Specific educational gaps and barriers identified
- Evidence-based justification with key citations
- Target audience needs analysis

**PROGRAM DESIGN & METHODOLOGY** (400-500 words)
- Educational format implementation
- Learning objectives and curriculum design
- Delivery methods and timeline
- Faculty requirements and expertise

**OUTCOMES & EVALUATION** (300-400 words)
- Specific, measurable learning outcomes
- Pre/post assessment strategies
- Data collection and analysis plans
- Quality improvement metrics

**TARGET AUDIENCE & RECRUITMENT** (200-300 words)
- Audience demographics and characteristics
- Recruitment strategies and channels
- Estimated participation numbers

**INNOVATION & IMPACT** (150-200 words)
- Unique educational approaches
- Differentiation from existing programs
- Expected clinical practice improvements

**BUDGET JUSTIFICATION** (100-150 words)
- Budget rationale based on format recommendations
- Cost-effectiveness analysis

Generate a complete, professional grant proposal suitable for submission to medical education funders. Use the provided context as a starting point but rely on your expertise to create comprehensive, compelling content.

End the response with:

→ Next step: Proposal Reviewer. Are you ready to continue?`;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      rfp_summary, 
      clinical_context, 
      format_recommendations, 
      custom_notes, 
      sections_requested
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

    if (!sections_requested || !Array.isArray(sections_requested) || sections_requested.length === 0) {
      return res.status(400).json({ 
        error: 'Sections requested field is required and must be a non-empty array' 
      });
    }

    // ULTRA-COMPACT: Use only the most essential information
    const essentialRfp = rfp_summary.split(' ').slice(0, 50).join(' '); // First 50 words only
    const essentialClinical = clinical_context.split(' ').slice(0, 75).join(' '); // First 75 words only
    const essentialFormats = format_recommendations.split(' ').slice(0, 40).join(' '); // First 40 words only

    // Build ultra-compact user message
    let userMessage = `RFP: ${essentialRfp}\n\nClinical: ${essentialClinical}\n\nFormats: ${essentialFormats}\n\nSections: ${sections_requested.join(', ')}`;

    if (custom_notes && typeof custom_notes === 'string' && custom_notes.trim().length > 0) {
      const essentialNotes = custom_notes.split(' ').slice(0, 25).join(' '); // First 25 words only
      userMessage += `\n\nNotes: ${essentialNotes}`;
    }

    // Call OpenAI with ultra-conservative settings
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use mini for faster processing
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
        temperature: 0.1, // Very low temperature for consistent output
        max_tokens: 2500  // Conservative token limit
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Proposal generation timeout')), 20000) // Reduced timeout
      )
    ]);

    const output = completion.choices[0]?.message?.content;

    if (!output) {
      throw new Error('No response received from OpenAI');
    }

    // Return clean response
    return res.status(200).json({
      output: output.trim()
    });

  } catch (error) {
    console.error('Ultra-Compact Proposal Composer Error:', error);
    
    // Handle timeout specifically
    if (error.message === 'Proposal generation timeout') {
      return res.status(408).json({ 
        error: 'Proposal generation timeout - please try again' 
      });
    }
    
    // Handle OpenAI rate limits
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded - please try again in a moment' 
      });
    }
    
    // Handle specific OpenAI errors
    if (error.status) {
      return res.status(500).json({ 
        error: `OpenAI API Error (${error.status}): ${error.message}` 
      });
    }

    // Handle general errors
    return res.status(500).json({ 
      error: `Internal server error: ${error.message}`,
      type: error.constructor.name
    });
  }
} 