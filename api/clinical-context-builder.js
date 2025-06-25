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

    // Temporary: Return static content to test ChatGPT connector
    const staticOutput = `**CLINICAL BACKGROUND**

${cleanTherapeuticArea} represents a significant therapeutic area requiring comprehensive medical education initiatives. The current treatment landscape involves multiple therapeutic modalities with varying efficacy profiles and safety considerations. Healthcare providers require ongoing education to optimize patient outcomes and implement evidence-based treatment protocols.

Current prevalence data indicates substantial patient populations affected by conditions within this therapeutic area, with associated healthcare costs representing significant economic burden. Treatment guidelines from professional medical societies provide evidence-based recommendations, though implementation gaps persist across healthcare systems.

**RECENT ADVANCES & GUIDELINES**

Recent clinical trials have demonstrated improved outcomes with novel therapeutic approaches. FDA approvals within the past 24 months have expanded treatment options for patients in this therapeutic area. Professional society guidelines have been updated to reflect emerging evidence and clinical best practices.

Registry data and real-world evidence studies continue to inform clinical decision-making and highlight areas for continued research and development. Healthcare providers require regular updates on evolving treatment paradigms and emerging therapeutic options.

**PRACTICE GAPS & UNMET NEEDS**

Clinical practice variations exist across healthcare settings, with documented disparities in treatment access and outcomes. Provider knowledge gaps have been identified through professional surveys and continuing education needs assessments.

Quality metrics indicate opportunities for improvement in adherence to evidence-based guidelines and optimization of patient monitoring protocols. Educational interventions targeting these gaps can improve clinical outcomes and patient satisfaction.

**EDUCATIONAL RATIONALE**

Medical education programs have demonstrated measurable impact on clinical practice patterns and patient outcomes. Evidence supports the effectiveness of targeted educational interventions in addressing identified knowledge gaps and improving adherence to clinical guidelines.

Cost-effectiveness analyses indicate positive return on investment for well-designed continuing medical education programs. Educational initiatives should focus on practical implementation strategies and evidence-based approaches to optimize clinical care.

**REFERENCES**

[1] Smith A, et al. Clinical outcomes in therapeutic area management. N Engl J Med. 2023;388(12):1095-1103.
[2] Johnson B, et al. Healthcare provider education effectiveness. JAMA. 2023;329(8):645-652.
[3] Williams C, et al. Treatment guidelines implementation. Lancet. 2023;401(10385):1234-1241.
[4] Brown D, et al. Real-world evidence in clinical practice. Ann Intern Med. 2023;176(4):456-463.
[5] Davis E, et al. Professional development impact assessment. J Clin Oncol. 2023;41(15):2789-2796.

→ Next step: Format Recommender. Are you ready to continue?`;

    // Return static response for testing
    return res.status(200).json({
      output: staticOutput
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