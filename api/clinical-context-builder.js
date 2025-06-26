import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a leading medical education specialist tasked with creating comprehensive clinical context and needs assessments for grant proposals. Your output will be used by pharmaceutical companies and medical education organizations to justify funding for continuing medical education programs.

MANDATORY REQUIREMENTS:
✓ Generate 1,500-2,500 word comprehensive clinical background
✓ Include exactly 15-20 peer-reviewed citations from high-impact medical journals
✓ Cover clinical background, recent advances, practice gaps, and educational needs
✓ Use proper medical journal citation format: [Author et al. Journal Name. Year;Volume(Issue):Pages]
✓ Focus on real clinical trials, FDA approvals, and evidence-based medicine
✓ Address health disparities and population-specific considerations
✓ Identify specific knowledge gaps requiring educational intervention

CONTENT STRUCTURE:
1. Clinical Background & Current Landscape
2. Recent Medical Advances & Breakthrough Therapies
3. Practice Gaps & Educational Needs
4. Target Audience Considerations
5. Educational Rationale & Justification

CITATION REQUIREMENTS:
- Minimum 15-20 peer-reviewed sources
- High-impact journals (NEJM, Lancet, JAMA, JCO, etc.)
- Recent publications (last 5 years preferred)
- Include specific trial names, FDA approval dates
- NO Wikipedia or non-peer-reviewed sources

Generate professional, grant-ready content with comprehensive medical research backing.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { therapeutic_area, rfp_summary, meeting_notes, additional_context } = req.body;

    // Validate therapeutic_area field - accept any reasonable medical string
    if (!therapeutic_area) {
      return res.status(400).json({ error: 'Therapeutic area field is required' });
    }
    
    if (typeof therapeutic_area !== 'string') {
      return res.status(400).json({ error: 'Therapeutic area must be a string' });
    }

    // Clean and prepare the therapeutic area input
    const cleanTherapeuticArea = therapeutic_area.trim();
    
    // Very permissive validation - just ensure it's not empty after trimming
    if (cleanTherapeuticArea.length === 0) {
      return res.status(400).json({ error: 'Therapeutic area cannot be empty' });
    }

    // Build comprehensive user message
    let userMessage = `Create a comprehensive medical education needs assessment for: ${cleanTherapeuticArea}`;

    if (rfp_summary && typeof rfp_summary === 'string' && rfp_summary.trim().length > 0) {
      userMessage += `\n\nRFP Context: ${rfp_summary}`;
    }

    if (meeting_notes && typeof meeting_notes === 'string' && meeting_notes.trim().length > 0) {
      userMessage += `\n\nMeeting Notes: ${meeting_notes}`;
    }

    if (additional_context && typeof additional_context === 'string' && additional_context.trim().length > 0) {
      userMessage += `\n\nAdditional Context: ${additional_context}`;
    }

    // Call OpenAI with timeout protection
    const completion = await Promise.race([
      openai.chat.completions.create({
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
        temperature: 0.2,
        max_tokens: 4000
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Clinical context generation timeout')), 25000)
      )
    ]);

    const output = completion.choices[0]?.message?.content;
    
    if (!output) {
      throw new Error('No response received from OpenAI');
    }

    return res.status(200).json({
      output: output.trim() + '\n\n→ Next step: Format Recommender. Are you ready to continue?'
    });

  } catch (error) {
    console.error('Clinical Context Builder Error:', error);
    
    if (error.message === 'Clinical context generation timeout') {
      return res.status(408).json({ 
        error: 'Clinical context generation timeout - please try again' 
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