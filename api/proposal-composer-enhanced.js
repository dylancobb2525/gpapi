import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert medical education grant writer creating COMPREHENSIVE grant proposal sections. Generate complete, detailed grant proposal content optimized for timely delivery.

MANDATORY REQUIREMENTS:
✓ Generate complete grant proposal sections (1,500-2,000 words total)
✓ Include ALL requested sections with substantial detail
✓ Use the summarized clinical research and context provided
✓ Professional grant proposal formatting with clear section headers
✓ Comprehensive paragraphs, not bullet points or brief summaries
✓ Stay within token limits while maintaining quality

REQUIRED SECTIONS TO INCLUDE (based on sections_requested):

**EXECUTIVE SUMMARY** (300-350 words)
- Project overview, target audience, educational approach, anticipated outcomes
- Key statistics and compelling rationale for funding

**NEEDS ASSESSMENT** (400-500 words)
- Clinical background from provided context
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

Generate a complete, professional grant proposal suitable for submission to medical education funders. Use all provided summarized context to create compelling, evidence-based content.

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
      sections_requested,
      use_summarization = true
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

    let processedRfpSummary = rfp_summary;
    let processedClinicalContext = clinical_context;
    let processedFormatRecommendations = format_recommendations;

    // Use summarization if enabled and content is long
    if (use_summarization && (rfp_summary.length > 800 || clinical_context.length > 1000 || format_recommendations.length > 600)) {
      try {
        // Call the summarization endpoint
        const summaryResponse = await fetch(`${req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000'}/api/content-summarizer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rfp_analysis: rfp_summary,
            clinical_context: clinical_context,
            format_recommendations: format_recommendations,
            content_type: 'proposal_input'
          })
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          processedRfpSummary = summaryData.output.substring(0, 600);
          processedClinicalContext = summaryData.output.substring(0, 800);
          processedFormatRecommendations = summaryData.output.substring(0, 500);
        }
      } catch (summaryError) {
        console.warn('Summarization failed, using original content:', summaryError);
        // Fall back to truncated original content
        processedRfpSummary = rfp_summary.substring(0, 600);
        processedClinicalContext = clinical_context.substring(0, 800);
        processedFormatRecommendations = format_recommendations.substring(0, 500);
      }
    } else {
      // Apply strict truncation if summarization is disabled
      processedRfpSummary = rfp_summary.substring(0, 600);
      processedClinicalContext = clinical_context.substring(0, 800);
      processedFormatRecommendations = format_recommendations.substring(0, 500);
    }

    // Build user message with processed context
    let userMessage = `RFP Summary: ${processedRfpSummary}\n\nClinical Context: ${processedClinicalContext}\n\nFormat Recommendations: ${processedFormatRecommendations}\n\nSections Requested: ${sections_requested.join(', ')}`;

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
        temperature: 0.1, // Low temperature for professional, consistent proposal writing
        max_tokens: 3000  // Optimized for reliability and to prevent token overflow
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Proposal generation timeout')), 25000)
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
    console.error('Enhanced Proposal Composer Error:', error);
    
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