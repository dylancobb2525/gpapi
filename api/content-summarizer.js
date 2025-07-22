import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a content summarizer specialized in condensing medical education grant development content. Your task is to create concise, essential summaries that preserve all critical information while dramatically reducing length.

MANDATORY REQUIREMENTS:
✓ Condense content to 20-30% of original length
✓ Preserve ALL key facts, statistics, and critical details
✓ Maintain professional tone and accuracy
✓ Remove redundancy and verbose language
✓ Keep essential citations and references
✓ Ensure summaries are immediately usable for grant proposal development

SUMMARIZATION GUIDELINES:
- Extract core facts, figures, and key points
- Preserve therapeutic areas, target audiences, and educational gaps
- Keep essential clinical context and research findings
- Maintain format recommendations and strategic insights
- Remove repetitive language and unnecessary explanations
- Focus on actionable information for proposal development

Your output should be a clean, professional summary that can be directly used as input for the next step in the grant development process.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      rfp_analysis, 
      clinical_context, 
      format_recommendations,
      content_type 
    } = req.body;

    // Validate that at least one content field is provided
    if (!rfp_analysis && !clinical_context && !format_recommendations) {
      return res.status(400).json({ 
        error: 'At least one content field (rfp_analysis, clinical_context, or format_recommendations) is required' 
      });
    }

    // Build user message with content to summarize
    let userMessage = `Please summarize the following content for grant proposal development:\n\n`;
    
    if (rfp_analysis && typeof rfp_analysis === 'string' && rfp_analysis.trim().length > 0) {
      userMessage += `RFP ANALYSIS:\n${rfp_analysis}\n\n`;
    }
    
    if (clinical_context && typeof clinical_context === 'string' && clinical_context.trim().length > 0) {
      userMessage += `CLINICAL CONTEXT:\n${clinical_context}\n\n`;
    }
    
    if (format_recommendations && typeof format_recommendations === 'string' && format_recommendations.trim().length > 0) {
      userMessage += `FORMAT RECOMMENDATIONS:\n${format_recommendations}\n\n`;
    }

    if (content_type && typeof content_type === 'string' && content_type.trim().length > 0) {
      userMessage += `CONTENT TYPE: ${content_type}`;
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
        temperature: 0.1, // Very low temperature for consistent summarization
        max_tokens: 2000  // Reasonable limit for summaries
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Summarization timeout')), 15000)
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
    console.error('Content Summarizer Error:', error);
    
    if (error.message === 'Summarization timeout') {
      return res.status(408).json({ 
        error: 'Summarization timeout - please try again' 
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