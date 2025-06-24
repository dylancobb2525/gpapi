import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a strategist and medical proposal writer for GLC. Your role is to convert upstream inputs into formal grant proposal sections for an independent medical education grant.

Based on the inputs (RFP summary, clinical context, format strategy), write proposal-ready content for the specified sections.

You may be asked to write one or multiple of the following:

- Executive Summary  
- Needs Assessment / Gaps / Barriers  
- Design & Methods  
- Outcomes / Evaluation  
- Target Audience & Recruitment  
- Innovation / Differentiation  
- Faculty (optional)

Be structured and professional. Use GLC-style formatting and maintain evidence-based tone. Do not invent data or cite sources unless they were explicitly passed in.

Avoid marketing buzzwords or filler. Do not restate inputs. Only generate clean, sectioned content.

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
      sections_requested 
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

    // Build user message with all provided context
    let userMessage = `RFP Summary: ${rfp_summary}\n\nClinical Context: ${clinical_context}\n\nFormat Recommendations: ${format_recommendations}\n\nSections Requested: ${sections_requested.join(', ')}`;

    if (custom_notes && typeof custom_notes === 'string' && custom_notes.trim().length > 0) {
      userMessage += `\n\nCustom Notes: ${custom_notes}`;
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
      temperature: 0.1, // Low temperature for professional, consistent proposal writing
      max_tokens: 4000  // Higher token limit for comprehensive proposal sections
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