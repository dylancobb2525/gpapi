import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a leading medical education specialist. Create a comprehensive clinical context and needs assessment for grant proposals (1,200-1,800 words).

REQUIREMENTS:
✓ Comprehensive clinical background and current treatment landscape
✓ Include 12-15 peer-reviewed citations from high-impact journals (NEJM, Lancet, JAMA, JCO)
✓ Cover recent advances, practice gaps, and educational needs
✓ Use proper citation format: [Author et al. Journal. Year;Volume:Pages]
✓ Focus on real trials, FDA approvals, and evidence-based medicine
✓ Address population-specific considerations and health disparities

STRUCTURE:
1. Clinical Background & Current Landscape
2. Recent Advances & Breakthrough Therapies  
3. Practice Gaps & Educational Needs
4. Target Audience & Educational Rationale

Generate professional, grant-ready content with strong medical research backing.`;

export default async function handler(req, res) {
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  console.log(`[${requestId}] === CLINICAL CONTEXT BUILDER START ===`);
  console.log(`[${requestId}] Method: ${req.method}`);

  if (req.method !== 'POST') {
    console.log(`[${requestId}] ERROR: Method not allowed - ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { therapeutic_area, rfp_summary, meeting_notes, additional_context } = req.body;

    console.log(`[${requestId}] Validating therapeutic_area: "${therapeutic_area}"`);

    if (!therapeutic_area || typeof therapeutic_area !== 'string' || therapeutic_area.trim().length === 0) {
      console.log(`[${requestId}] ERROR: Invalid therapeutic_area`);
      return res.status(400).json({ error: 'Therapeutic area is required and must be a non-empty string' });
    }

    const cleanTherapeuticArea = therapeutic_area.trim();
    console.log(`[${requestId}] Validation passed. Clean therapeutic area: "${cleanTherapeuticArea}"`);

    // Build user message
    let userMessage = `Create a comprehensive medical education needs assessment for: ${cleanTherapeuticArea}`;

    if (rfp_summary) userMessage += `\n\nRFP Context: ${rfp_summary.substring(0, 500)}`;
    if (meeting_notes) userMessage += `\n\nMeeting Notes: ${meeting_notes.substring(0, 500)}`;
    if (additional_context) userMessage += `\n\nAdditional Context: ${additional_context.substring(0, 300)}`;

    console.log(`[${requestId}] User message length: ${userMessage.length} chars`);
    console.log(`[${requestId}] Starting OpenAI call with GPT-4o-mini`);

    // Faster model with shorter timeout
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2,
        max_tokens: 3000
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      )
    ]);

    const processingTime = Date.now() - startTime;
    console.log(`[${requestId}] OpenAI call completed in ${processingTime}ms`);

    const output = completion.choices[0]?.message?.content;
    
    if (!output) {
      console.log(`[${requestId}] ERROR: No response from OpenAI`);
      throw new Error('No response received from OpenAI');
    }

    console.log(`[${requestId}] Response length: ${output.length} characters`);
    console.log(`[${requestId}] === SUCCESS - Total time: ${processingTime}ms ===`);

    return res.status(200).json({
      output: output.trim() + '\n\n→ Next step: Format Recommender. Are you ready to continue?'
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] === ERROR after ${processingTime}ms ===`);
    console.error(`[${requestId}] Error: ${error.message}`);
    
    if (error.message === 'Timeout') {
      console.log(`[${requestId}] 15-second timeout reached`);
      return res.status(408).json({ 
        error: 'Generation timeout - please try again',
        requestId: requestId,
        processingTime: processingTime
      });
    }
    
    return res.status(500).json({ 
      error: `Error: ${error.message}`,
      requestId: requestId,
      processingTime: processingTime
    });
  }
} 