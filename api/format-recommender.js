import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a strategist at GLC tasked with recommending educational formats (GLC-branded products) for an independent medical education grant. Based on the provided educational gaps, therapeutic area, lifecycle stage, and timeline/budget context, recommend a mix of formats.

Return:

1. A recommended mix of formats (e.g., Expert Interview, DecisionSim™, MinuteCE®)
2. Rationale for each format, tied to:
    - Target learner needs
    - Lifecycle stage
    - Gaps and strategy
3. Optional alternate plan for low-budget or fast-turnaround situations
4. Mapping to GLC's Journey to Adoption (e.g., Know → Understand → Apply)

Only suggest formats that clearly fit the strategy. Use a clear and concise structure with bolded format names and bulleted rationale.

Do NOT include a summary or copy-paste handoff section.

End with:

→ Next step: Proposal Composer. Are you ready to continue?`;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      therapeutic_area, 
      clinical_context, 
      educational_gaps, 
      product_lifecycle_stage, 
      timeline_or_budget_notes 
    } = req.body;

    // Validate required fields
    if (!educational_gaps || !Array.isArray(educational_gaps) || educational_gaps.length === 0) {
      return res.status(400).json({ 
        error: 'Educational gaps field is required and must be a non-empty array' 
      });
    }

    if (!product_lifecycle_stage || typeof product_lifecycle_stage !== 'string' || product_lifecycle_stage.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Product lifecycle stage field is required and must be a non-empty string' 
      });
    }

    // Build user message with all provided context
    let userMessage = `Product Lifecycle Stage: ${product_lifecycle_stage}\n\nEducational Gaps: ${educational_gaps.join(', ')}`;

    if (therapeutic_area && typeof therapeutic_area === 'string' && therapeutic_area.trim().length > 0) {
      userMessage += `\n\nTherapeutic Area: ${therapeutic_area}`;
    }

    if (clinical_context && typeof clinical_context === 'string' && clinical_context.trim().length > 0) {
      userMessage += `\n\nClinical Context: ${clinical_context}`;
    }

    if (timeline_or_budget_notes && typeof timeline_or_budget_notes === 'string' && timeline_or_budget_notes.trim().length > 0) {
      userMessage += `\n\nTimeline/Budget Notes: ${timeline_or_budget_notes}`;
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
      temperature: 0.3, // Balanced creativity for format recommendations
      max_tokens: 2500  // Sufficient for detailed format recommendations
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