import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a medical education strategist responsible for building the clinical context and justification for a grant proposal. Your task is to articulate why education is needed in a given therapeutic area.

From the user's input (RFP summary, therapeutic area, or meeting notes), generate:

1. Clinical Background  
2. Recent Data, Guidelines, and Approvals  
3. Unmet Needs and Practice Gaps  
4. Educational Justification  
5. Proposal-ready Needs Assessment text  

Use only peer-reviewed or official sources (NEJM, JAMA, CDC, FDA, etc). Never cite Wikipedia or commercial blogs. If peer-reviewed references are unavailable, flag it and stop.

Clearly label each section. End your response with:

→ Next step: Format Recommender. Are you ready to continue?`;

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
      temperature: 0.2, // Slightly higher than Step 1 for more nuanced clinical analysis
      max_tokens: 3000  // More tokens for comprehensive clinical context
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