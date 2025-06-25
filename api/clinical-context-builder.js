import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior medical education strategist and grant writer specializing in evidence-based needs assessments for pharmaceutical and medical education funding. Your task is to create a comprehensive, funder-ready clinical background and needs assessment that would pass peer review.

CRITICAL REQUIREMENTS:
- Generate 15-20 peer-reviewed citations from high-impact medical journals
- Use ONLY peer-reviewed sources: NEJM, JAMA, Lancet, Nature Medicine, Circulation, JACC, BMJ, Annals of Internal Medicine, Journal of Clinical Oncology, etc.
- NEVER cite Wikipedia, commercial websites, blogs, or non-peer-reviewed sources
- Include specific data points, trial names, FDA approval dates, prevalence statistics, and health disparities data
- Write in professional grant proposal tone suitable for NIH, pharmaceutical, or medical education funders

REQUIRED OUTPUT FORMAT:

**CLINICAL BACKGROUND**
Provide comprehensive disease/condition overview with epidemiology, pathophysiology, and current standard of care. Include 4-5 citations with specific data points.

**RECENT DATA & GUIDELINES**
Detail latest clinical trials, FDA approvals, guideline updates, and emerging evidence from the past 2-3 years. Include 5-6 citations with trial names, approval dates, and specific outcomes data.

**UNMET NEEDS & PRACTICE GAPS**
Present evidence-backed gaps in clinical practice, disparities data, adherence issues, and knowledge deficits among healthcare providers. Include 3-4 citations supporting each gap identified.

**EDUCATIONAL JUSTIFICATION**
Articulate the funding rationale with evidence that education interventions improve clinical outcomes. Include 3-4 citations demonstrating educational impact on practice and patient outcomes.

**REFERENCES**
List all 15-20 references in standard medical journal format (Author, Title, Journal Year;Volume:Pages)

QUALITY STANDARDS:
- Each statistic must include a citation
- Include specific trial names (e.g., PARADIGM-HF, EMPEROR-Reduced)
- Mention FDA approval dates for new therapies
- Include health disparities data by race, gender, socioeconomic status
- Reference professional society guidelines (AHA, ACC, ESC, etc.)
- Use medical terminology appropriate for healthcare professionals

End with: → Next step: Format Recommender. Are you ready to continue?`;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { therapeutic_area, rfp_summary, meeting_notes, additional_context } = req.body;

    // Validate required therapeutic_area field
    if (!therapeutic_area || typeof therapeutic_area !== 'string' || therapeutic_area.trim().length === 0) {
      return res.status(400).json({ error: 'Therapeutic area field is required and must be a non-empty string' });
    }

    // Build user message with all provided context
    let userMessage = `Therapeutic Area: ${therapeutic_area}`;

    if (rfp_summary && typeof rfp_summary === 'string' && rfp_summary.trim().length > 0) {
      userMessage += `\n\nRFP Summary: ${rfp_summary}`;
    }

    if (meeting_notes && typeof meeting_notes === 'string' && meeting_notes.trim().length > 0) {
      userMessage += `\n\nMeeting Notes: ${meeting_notes}`;
    }

    if (additional_context && typeof additional_context === 'string' && additional_context.trim().length > 0) {
      userMessage += `\n\nAdditional Context: ${additional_context}`;
    }

    // Call OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
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
      temperature: 0.1, // Low temperature for accuracy and consistency in medical content
      max_tokens: 4000  // Increased tokens for comprehensive output with 15-20 references
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