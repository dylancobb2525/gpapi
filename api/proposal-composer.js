import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert medical education grant writer creating COMPREHENSIVE, MULTI-PAGE grant proposals for independent medical education funding. Generate complete, detailed grant proposal content.

MANDATORY REQUIREMENTS:
✓ Generate a COMPLETE grant proposal (3,000-5,000 words minimum)
✓ Include ALL major sections with substantial detail
✓ Use the clinical research and context provided to create evidence-based content
✓ Professional grant proposal formatting with clear section headers
✓ Comprehensive paragraphs, not bullet points or brief summaries

REQUIRED SECTIONS TO INCLUDE:

**EXECUTIVE SUMMARY** (400-500 words)
- Project overview, target audience, educational approach, anticipated outcomes
- Key statistics and compelling rationale for funding

**NEEDS ASSESSMENT** (800-1000 words)
- Detailed clinical background from provided context
- Specific educational gaps and barriers identified
- Evidence-based justification with citations
- Target audience needs analysis

**PROGRAM DESIGN & METHODOLOGY** (800-1000 words)
- Detailed educational format implementation
- Learning objectives and curriculum design
- Delivery methods and timeline
- Faculty requirements and expertise

**OUTCOMES & EVALUATION** (500-600 words)
- Specific, measurable learning outcomes
- Pre/post assessment strategies
- Data collection and analysis plans
- Quality improvement metrics

**TARGET AUDIENCE & RECRUITMENT** (400-500 words)
- Detailed audience demographics and characteristics
- Recruitment strategies and channels
- Estimated participation numbers and engagement

**INNOVATION & IMPACT** (300-400 words)
- Unique educational approaches
- Differentiation from existing programs
- Expected clinical practice improvements

**BUDGET JUSTIFICATION** (200-300 words)
- High-level budget rationale based on format recommendations
- Cost-effectiveness analysis

Generate a complete, professional grant proposal suitable for submission to medical education funders. Use all provided clinical context and research to create compelling, evidence-based content.

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

    // Build user message with all provided context
    let userMessage = `RFP Summary: ${rfp_summary}\n\nClinical Context: ${clinical_context}\n\nFormat Recommendations: ${format_recommendations}\n\nSections Requested: ${sections_requested.join(', ')}`;

    if (custom_notes && typeof custom_notes === 'string' && custom_notes.trim().length > 0) {
      userMessage += `\n\nCustom Notes: ${custom_notes}`;
    }

    // Call OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
      temperature: 0.1, // Low temperature for professional, consistent proposal writing
      max_tokens: 8000  // Maximum tokens for comprehensive multi-page grant proposals
    });

    const output = completion.choices[0]?.message?.content;

    if (!output) {
      throw new Error('No response received from OpenAI');
    }

    // Return clean response
    return res.status(200).json({
      output: output.trim()
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific OpenAI errors
    if (error.status) {
      return res.status(500).json({ 
        error: `OpenAI API Error: ${error.message}` 
      });
    }

    // Handle general errors
    return res.status(500).json({ 
      error: `Internal server error: ${error.message}` 
    });
  }
} 