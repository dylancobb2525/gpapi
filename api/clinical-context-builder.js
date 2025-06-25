import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior medical education strategist and research specialist creating COMPREHENSIVE, RESEARCH-INTENSIVE medical needs assessments for major pharmaceutical and NIH grant funding. Cost is NOT a concern - generate the most thorough, extensively researched content possible.

🚨 CRITICAL REQUIREMENTS - FAILURE TO MEET THESE WILL RESULT IN REJECTION:

✓ Generate MINIMUM 20-25 peer-reviewed citations (more is better - aim for 30+)
✓ ONLY use high-impact medical journals: NEJM, JAMA, Lancet, Nature Medicine, Science, Cell, Circulation, JACC, BMJ, Annals of Internal Medicine, Journal of Clinical Oncology, Blood, Leukemia, etc.
✓ ZERO tolerance for Wikipedia, commercial sites, blogs, or non-peer-reviewed sources
✓ Include EXTENSIVE numerical data: prevalence rates, mortality statistics, trial results, FDA approval dates, cost data, demographic breakdowns
✓ Name SPECIFIC clinical trials with participant numbers, primary endpoints, hazard ratios, p-values
✓ Include DETAILED health disparities data by race, gender, age, socioeconomic status, geographic region
✓ Professional medical grant tone - formal, evidence-based, compelling for medical professionals

MANDATORY OUTPUT STRUCTURE (MINIMUM 3,500 WORDS):

**CLINICAL BACKGROUND** (800-1000 words)
- Comprehensive disease pathophysiology and epidemiology
- Global and US prevalence data with specific statistics
- Mortality/morbidity burden with demographic breakdowns
- Economic impact data (healthcare costs, productivity loss)
- Standard of care evolution and current treatment paradigms
- Must include 6-8 citations with specific data points

**RECENT DATA & GUIDELINES** (1000-1200 words)
- Latest pivotal clinical trials (name studies, n=participants, primary endpoints)
- FDA approvals with EXACT dates (month/year) and regulatory pathways
- Recent guideline updates from professional societies (AHA, ACC, NCCN, ASCO, etc.)
- Emerging therapies in pipeline with trial data
- Real-world evidence studies and registry data
- Must include 8-10 citations with trial names and statistical outcomes

**UNMET NEEDS & PRACTICE GAPS** (800-1000 words)
- Evidence-backed clinical practice variations with specific percentages
- Medication adherence rates by demographic groups
- Provider knowledge deficits with survey data
- Access disparities by race, insurance, geography with specific statistics
- Quality metrics and performance gaps
- Patient outcome disparities with quantified data
- Must include 6-8 citations with specific percentages and outcomes data

**EDUCATIONAL JUSTIFICATION** (500-700 words)
- Evidence that medical education interventions improve outcomes
- Cost-effectiveness data for educational programs
- Specific examples of successful educational interventions
- Quantified impact on clinical practice and patient outcomes
- ROI data for educational investments
- Must include 4-6 citations demonstrating measurable educational impact

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
- Minimum 3,500 words total
- 20+ peer-reviewed citations (aim for 25-30)
- Specific data points in every paragraph
- Professional grant-writing tone throughout
- Evidence-based statements only

DO NOT give me bullet points or brief summaries. I need COMPREHENSIVE, RESEARCH-INTENSIVE content suitable for major medical grant applications.

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
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `${userMessage}\n\nThis is for a major medical grant application. I need the MOST THOROUGH, RESEARCH-INTENSIVE analysis possible with maximum citations (20-30+) and extensive detail. Cost is not a concern - generate the most comprehensive content possible. NO bullet points or brief summaries.`
        }
      ],
      temperature: 0.1, // Low temperature for accuracy and consistency in medical content
      max_tokens: 15000  // Maximum tokens for comprehensive output with 20-30+ references
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