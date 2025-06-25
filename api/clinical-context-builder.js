import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior medical education strategist and research specialist creating COMPREHENSIVE, RESEARCH-INTENSIVE medical needs assessments for major pharmaceutical and NIH grant funding. Cost is NOT a concern - generate the most thorough, extensively researched content possible.

🚨 CRITICAL REQUIREMENTS - FAILURE TO MEET THESE WILL RESULT IN REJECTION:

✓ Generate EXACTLY 15-20 peer-reviewed citations (ChatGPT speed optimized)
✓ ONLY use high-impact medical journals: NEJM, JAMA, Lancet, Nature Medicine, Science, Cell, Circulation, JACC, BMJ, Annals of Internal Medicine, Journal of Clinical Oncology, Blood, Leukemia, etc.
✓ ZERO tolerance for Wikipedia, commercial sites, blogs, or non-peer-reviewed sources
✓ Include EXTENSIVE numerical data: prevalence rates, mortality statistics, trial results, FDA approval dates, cost data, demographic breakdowns
✓ Name SPECIFIC clinical trials with participant numbers, primary endpoints, hazard ratios, p-values
✓ Include DETAILED health disparities data by race, gender, age, socioeconomic status, geographic region
✓ Professional medical grant tone - formal, evidence-based, compelling for medical professionals

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

RESEARCH DEPTH REQUIREMENTS:
- Every statistic MUST have a citation
- Include specific trial names, not just "studies show"
- Mention FDA approval dates, drug names, indication details
- Include demographic data breakdowns (% by race, age, gender)
- Reference professional society guidelines by name and year
- Use medical terminology appropriate for physician audience
- NO bullet points or summary format - full paragraphs with extensive detail

QUALITY STANDARDS:
- Target 1,800-2,200 words total (ChatGPT connector optimized)
- EXACTLY 15-20 peer-reviewed citations
- Key data points in every section
- Professional grant-writing tone
- Evidence-based statements only
- PRIORITIZE SPEED: Deliver comprehensive research within 15-20 seconds

Generate impactful, well-researched content optimized for ChatGPT's 30-second timeout limit.

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

    // Call OpenAI GPT-4 with maximum tokens for comprehensive research
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `${userMessage}\n\nThis is for a major medical grant application. I need COMPREHENSIVE, RESEARCH-INTENSIVE analysis with 20-25 citations optimized for both quality AND speed. Generate thorough content efficiently - focus on the most impactful research and data points. NO bullet points or brief summaries.`
        }
      ],
      temperature: 0.1, // Low temperature for accuracy and consistency in medical content
      max_tokens: 4000  // Fast generation for ChatGPT connector compatibility
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