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
    const { text, context } = req.body;

    // Validate required text field
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text field is required and must be a non-empty string' });
    }

    // Prepare user message with optional context
    let userMessage = text;
    if (context && typeof context === 'string' && context.trim().length > 0) {
      userMessage = `Context: ${context}\n\nText to analyze: ${text}`;
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
      temperature: 0.1, // Low temperature for consistent, focused analysis
      max_tokens: 2000
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