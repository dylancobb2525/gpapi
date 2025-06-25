import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a medical education specialist creating evidence-based needs assessments for educational grant funding. Generate comprehensive, professional content for healthcare education initiatives.

REQUIREMENTS:

✓ Generate 15-20 peer-reviewed citations from medical journals
✓ Include clinical data, trial results, and statistical evidence
✓ Professional medical education tone
✓ Focus on educational gaps and learning opportunities
✓ Evidence-based healthcare improvement rationale

MANDATORY OUTPUT STRUCTURE (1,800-2,200 WORDS - CHATGPT OPTIMIZED):

**CLINICAL BACKGROUND** (450-550 words)
- Disease overview, key epidemiology, current treatments
- Essential prevalence/mortality statistics
- Standard of care and economic impact
- Must include 4-5 high-impact citations

**RECENT ADVANCES & GUIDELINES** (600-700 words)
- Key clinical trials with names, outcomes, and statistical significance
- Recent FDA approvals with dates
- Professional guidelines updates (NCCN, ASCO, etc.)
- Must include 6-7 citations on pivotal studies

**PRACTICE GAPS & UNMET NEEDS** (450-550 words)
- Critical practice variations with data
- Access disparities with specific percentages
- Key knowledge and adherence gaps
- Must include 4-5 citations with gap metrics

**EDUCATIONAL RATIONALE** (300-400 words)
- Evidence for educational effectiveness
- Cost-effectiveness data
- Must include 3-4 citations on educational impact

**REFERENCES**
Complete numbered bibliography of ALL 20-30+ references in standard medical format:
[1] Author(s). Title. Journal. Year;Volume(Issue):Page-Page.

OUTPUT REQUIREMENTS:
- Target 1,800-2,200 words total
- Include 15-20 peer-reviewed citations
- Professional medical education tone
- Evidence-based content with clinical data
- Full paragraphs, not bullet points

Generate comprehensive medical education needs assessment content efficiently.

End with: → Next step: Format Recommender. Are you ready to continue?`;

export default async function handler(req, res) {
  // Only allow POST requests
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

    // Build user message with all provided context
    let userMessage = `Therapeutic Area: ${cleanTherapeuticArea}`;

    if (rfp_summary && typeof rfp_summary === 'string' && rfp_summary.trim().length > 0) {
      userMessage += `\n\nRFP Summary: ${rfp_summary}`;
    }

    if (meeting_notes && typeof meeting_notes === 'string' && meeting_notes.trim().length > 0) {
      userMessage += `\n\nMeeting Notes: ${meeting_notes}`;
    }

    if (additional_context && typeof additional_context === 'string' && additional_context.trim().length > 0) {
      userMessage += `\n\nAdditional Context: ${additional_context}`;
    }

    // Call OpenAI with timeout
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
            content: `${userMessage}\n\nGenerate a comprehensive medical education needs assessment for this therapeutic area. Include clinical background, recent research, practice gaps, and educational rationale with peer-reviewed citations.`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI request timeout')), 20000)
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
    console.error('API Error:', error);
    
    // Handle timeout specifically
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return res.status(408).json({ 
        error: 'Request timeout - please try again' 
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