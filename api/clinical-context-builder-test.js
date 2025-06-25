export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { therapeutic_area } = req.body;

    if (!therapeutic_area) {
      return res.status(400).json({ error: 'Therapeutic area is required' });
    }

    const output = `Clinical Background for ${therapeutic_area}:

This therapeutic area represents an important focus for medical education initiatives. Current treatment approaches involve evidence-based protocols with demonstrated clinical efficacy.

Recent clinical trials have shown promising results with novel therapeutic interventions. Healthcare providers require ongoing education to implement best practices and optimize patient outcomes.

Practice gaps exist in clinical implementation, requiring targeted educational interventions to address knowledge deficits and improve adherence to evidence-based guidelines.

Educational programs have shown measurable impact on clinical practice patterns and patient outcomes, supporting continued investment in medical education initiatives.

→ Next step: Format Recommender. Are you ready to continue?`;

    return res.status(200).json({ output });

  } catch (error) {
    return res.status(500).json({ 
      error: `Error: ${error.message}` 
    });
  }
} 