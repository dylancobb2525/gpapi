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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { proposal_text, rfp_context, section_name } = req.body;

    // Validate required fields
    if (!proposal_text || typeof proposal_text !== 'string' || proposal_text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Proposal text field is required and must be a non-empty string' 
      });
    }

    // Build user message with proposal text and optional context
    let userMessage = `Proposal Text to Review:\n\n${proposal_text}`;

    if (rfp_context && typeof rfp_context === 'string' && rfp_context.trim().length > 0) {
      userMessage += `\n\nRFP Context: ${rfp_context}`;
    }

    if (section_name && typeof section_name === 'string' && section_name.trim().length > 0) {
      userMessage += `\n\nSection Name: ${section_name}`;
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
      temperature: 0.2, // Balanced temperature for critical but fair review
      max_tokens: 3500  // Sufficient for comprehensive review with scores and recommendations
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