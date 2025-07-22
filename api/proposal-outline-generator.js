import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert medical education grant writer creating a structured outline for a comprehensive grant proposal. Generate a detailed, professional outline that will guide the full proposal development.

MANDATORY REQUIREMENTS:
✓ Generate a complete proposal outline (500-800 words)
✓ Include all major sections with key points and sub-points
✓ Use the provided context to create relevant outline content
✓ Professional outline formatting with clear hierarchy
✓ Focus on structure and key points, not detailed content
✓ Ensure outline is actionable for proposal development

REQUIRED OUTLINE STRUCTURE:

**1. EXECUTIVE SUMMARY**
- Project overview and key objectives
- Target audience and educational approach
- Anticipated outcomes and impact
- Funding request and rationale

**2. NEEDS ASSESSMENT**
- Clinical background and current landscape
- Identified educational gaps and barriers
- Evidence-based justification
- Target audience needs analysis

**3. PROGRAM DESIGN & METHODOLOGY**
- Educational format and delivery approach
- Learning objectives and curriculum structure
- Implementation timeline and milestones
- Faculty and resource requirements

**4. OUTCOMES & EVALUATION**
- Specific learning outcomes and metrics
- Assessment strategies and tools
- Data collection and analysis plans
- Quality improvement framework

**5. TARGET AUDIENCE & RECRUITMENT**
- Audience demographics and characteristics
- Recruitment strategies and channels
- Participation estimates and engagement plans

**6. INNOVATION & IMPACT**
- Unique educational approaches
- Differentiation from existing programs
- Expected clinical practice improvements

**7. BUDGET JUSTIFICATION**
- Budget rationale and allocation
- Cost-effectiveness analysis
- Resource requirements

Generate a comprehensive, well-structured outline that will serve as the foundation for detailed proposal development. Focus on logical flow and completeness.

End with: → Outline Complete. Ready to proceed with detailed proposal development.`;

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

    // Build user message with summarized context to prevent token overflow
    let userMessage = `RFP Summary: ${rfp_summary.substring(0, 600)}\n\nClinical Context: ${clinical_context.substring(0, 800)}\n\nFormat Recommendations: ${format_recommendations.substring(0, 500)}`;

    if (custom_notes && typeof custom_notes === 'string' && custom_notes.trim().length > 0) {
      userMessage += `\n\nCustom Notes: ${custom_notes.substring(0, 200)}`;
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
        temperature: 0.1, // Low temperature for consistent, structured output
        max_tokens: 1500  // Appropriate for outline generation
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Outline generation timeout')), 15000)
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
    console.error('Proposal Outline Generator Error:', error);
    
    if (error.message === 'Outline generation timeout') {
      return res.status(408).json({ 
        error: 'Outline generation timeout - please try again' 
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