import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a simulated CME/IME grant reviewer for a pharmaceutical company. Your task is to review the user's grant proposal draft and provide structured, professional, and critical feedback.

Your response must include:

1. Scored evaluation (1–5 scale) for:
   - Strategic Fit / RFP Alignment  
   - Needs Assessment Quality  
   - Educational Design & Format Strategy  
   - Outcomes Planning & Metrics  
   - Clarity & Tone

2. Summary of strengths  
3. Summary of weaknesses or red flags  
4. Actionable recommendations  
5. Overall confidence rating: High / Medium / Low

Use a clinical and direct tone. No fluff or sugarcoating. If something is vague or weak, say so and explain how to improve it.

End the response with:

→ This concludes the review. You may now return to the Master GPT to revise or finalize the proposal.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { proposal_text, rfp_context, section_name, proposal_content } = req.body;

    // Enhanced validation with multiple field support
    let actualProposalText = proposal_text;
    
    // Check multiple possible field names
    if (!actualProposalText && proposal_content) {
      actualProposalText = proposal_content;
    }
    
    // If still no text, check if it's in a nested object
    if (!actualProposalText && req.body.proposal && req.body.proposal.text) {
      actualProposalText = req.body.proposal.text;
    }

    // Validate required fields with detailed error messages
    if (!actualProposalText) {
      return res.status(400).json({ 
        error: 'Proposal text field is required but was not provided. Please ensure the proposal content is included in the request.',
        received_fields: Object.keys(req.body),
        suggestion: 'Try using "proposal_text" or "proposal_content" as the field name'
      });
    }
    
    if (typeof actualProposalText !== 'string') {
      return res.status(400).json({ 
        error: `Proposal text must be a string, but received: ${typeof actualProposalText}`,
        received_value: actualProposalText
      });
    }
    
    if (actualProposalText.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Proposal text field is required and must be a non-empty string (received empty or whitespace-only text)',
        text_length: actualProposalText.length,
        trimmed_length: actualProposalText.trim().length
      });
    }

    // Log for debugging (remove in production)
    console.log('Proposal review request received:', {
      text_length: actualProposalText.length,
      has_rfp_context: !!rfp_context,
      has_section_name: !!section_name
    });

    // Build user message with proposal text and optional context
    let userMessage = `Proposal Text to Review:\n\n${actualProposalText}`;

    if (rfp_context && typeof rfp_context === 'string' && rfp_context.trim().length > 0) {
      userMessage += `\n\nRFP Context: ${rfp_context}`;
    }

    if (section_name && typeof section_name === 'string' && section_name.trim().length > 0) {
      userMessage += `\n\nSection Name: ${section_name}`;
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
        temperature: 0.2,
        max_tokens: 3500
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Proposal review timeout')), 20000)
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
    console.error('Enhanced Proposal Reviewer Error:', error);
    
    if (error.message === 'Proposal review timeout') {
      return res.status(408).json({ 
        error: 'Proposal review timeout - please try again' 
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