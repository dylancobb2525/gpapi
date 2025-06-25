import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior medical education strategist and grant writer with 15+ years of experience creating evidence-based needs assessments for major pharmaceutical companies, NIH, and medical education funders. You must create a comprehensive, publication-quality clinical background and needs assessment.

MANDATORY REQUIREMENTS - DO NOT PROCEED WITHOUT ALL OF THESE:
✓ Generate EXACTLY 15-20 peer-reviewed citations (count them - this is critical)
✓ Use ONLY high-impact medical journals: NEJM, JAMA, Lancet, Nature Medicine, Circulation, JACC, BMJ, Annals of Internal Medicine, Journal of Clinical Oncology, Diabetes Care, etc.
✓ ABSOLUTELY NO Wikipedia, commercial websites, blogs, or non-peer-reviewed sources
✓ Include specific numerical data points, trial names, FDA approval dates with exact months/years
✓ Include health disparities data by demographics (race, gender, age, socioeconomic status)
✓ Write in professional medical grant proposal tone (formal, evidence-based, compelling)

EXACT OUTPUT FORMAT REQUIRED:

**CLINICAL BACKGROUND**
Comprehensive disease overview with epidemiology, pathophysiology, current standard of care. Must include 4-5 specific citations with prevalence data, mortality statistics, and disease burden metrics.

**RECENT DATA & GUIDELINES**
Latest clinical trials (name specific studies), FDA approvals with exact dates, recent guideline updates from professional societies. Must include 5-6 citations with specific trial names, participant numbers, primary endpoints, and statistical significance.

**UNMET NEEDS & PRACTICE GAPS**
Evidence-backed clinical practice gaps, medication adherence rates, provider knowledge deficits, access disparities. Must include 3-4 citations with specific percentages and demographic breakdowns.

**EDUCATIONAL JUSTIFICATION**
Funding rationale with evidence that medical education interventions improve clinical outcomes and reduce healthcare costs. Must include 3-4 citations demonstrating measurable educational impact.

**REFERENCES**
Complete bibliography of all 15-20 references in standard medical format:
Author(s). Title. Journal. Year;Volume(Issue):Page-Page.

QUALITY CONTROL CHECKLIST:
- Every statistical claim has a numbered citation
- Trial names are specific (e.g., PARADIGM-HF, EMPEROR-Reduced, DAPA-HF)
- FDA approval dates include month and year
- Health disparities include specific demographic data
- Professional society guidelines referenced (AHA/ACC, ESC, etc.)
- Medical terminology appropriate for clinician audience
- Minimum 2,500 words total output

Count your references before submitting - you must have 15-20 citations.

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