import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a medical education strategist specializing in independent grant proposal development. Your task is to read and analyze either:

- An RFP issued by a pharmaceutical company, or  
- A meeting note or recap from a pharma representative discussion  

From this input, extract and clearly label the following:
- Therapeutic Area  
- Stated Strategic Goals  
- Educational Gaps and Needs  
- Target Audience (specialties, roles, regions)  
- Preferred Formats or Delivery Methods  
- Relevant Stage in the Product Life Cycle (e.g., pre-launch, launch, post-launch, mature)  
- Budget Range or Funding Constraints  
- Timeline and Submission Requirements  
- Compliance Requirements or Red Flags  
- Any Additional Notes or Constraints  

Your output must be formatted as clean bullet points or a YAML-style block, with each section clearly labeled.

If any category is not mentioned in the input, explicitly label it as "Not Specified". Do not guess or infer information. Only return what's explicitly stated.

Do NOT include summaries, closing questions, or transitions. Just clearly end with:

→ Next step: Clinical Context Builder. Are you ready to continue?`;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rfp_text, text, context } = req.body;

    // Accept either 'rfp_text' or 'text' parameter for flexibility
    const inputText = rfp_text || text;

    // Validate required text field
    if (!inputText || typeof inputText !== 'string' || inputText.trim().length === 0) {
      return res.status(400).json({ error: 'RFP text field is required and must be a non-empty string' });
    }

    // Prepare user message with optional context
    let userMessage = inputText;
    if (context && typeof context === 'string' && context.trim().length > 0) {
      userMessage = `Context: ${context}\n\nText to analyze: ${inputText}`;
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
        temperature: 0.1, // Low temperature for consistent, focused analysis
        max_tokens: 1500
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RFP analysis timeout')), 15000)
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
    console.error('RFP Analyzer Error:', error);
    
    // Handle timeout specifically
    if (error.message === 'RFP analysis timeout') {
      return res.status(408).json({ 
        error: 'RFP analysis timeout - please try again' 
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