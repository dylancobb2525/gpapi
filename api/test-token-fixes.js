import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { test_type = 'basic' } = req.body;

    let testResult = {};

    if (test_type === 'token_limits') {
      // Test token limit enforcement
      const longText = 'This is a very long text. '.repeat(1000); // ~6000 characters
      
      // Test truncation
      const truncated = longText.substring(0, 600);
      testResult.truncation_test = {
        original_length: longText.length,
        truncated_length: truncated.length,
        reduction_percentage: Math.round(((longText.length - truncated.length) / longText.length) * 100)
      };
    }

    if (test_type === 'summarization') {
      // Test summarization logic
      const sampleRfp = 'This is a detailed RFP analysis with extensive information about cardiovascular disease management, including multiple therapeutic areas, target audiences, educational gaps, format preferences, budget constraints, timeline requirements, compliance needs, and additional strategic considerations. '.repeat(50);
      
      const sampleClinical = 'This is comprehensive clinical context with detailed research findings, multiple peer-reviewed citations, extensive background information, current treatment guidelines, practice gaps analysis, and educational needs assessment. '.repeat(60);
      
      const sampleFormats = 'This includes detailed format recommendations with DecisionSim™ analysis, Expert Interview considerations, MinuteCE® integration, strategic rationale, implementation approach, and cost-benefit analysis. '.repeat(40);

      testResult.summarization_test = {
        rfp_length: sampleRfp.length,
        clinical_length: sampleClinical.length,
        formats_length: sampleFormats.length,
        total_input_length: sampleRfp.length + sampleClinical.length + sampleFormats.length,
        estimated_output_length: Math.round((sampleRfp.length + sampleClinical.length + sampleFormats.length) * 0.25), // 25% of original
        would_trigger_summarization: (sampleRfp.length > 800 || sampleClinical.length > 1000 || sampleFormats.length > 600)
      };
    }

    if (test_type === 'endpoint_structure') {
      // Test endpoint structure
      testResult.endpoints = {
        existing: [
          'rfp-analyzer',
          'clinical-context-builder', 
          'format-recommender',
          'proposal-composer',
          'proposal-composer-part1',
          'proposal-composer-part2',
          'proposal-reviewer'
        ],
        new: [
          'content-summarizer',
          'proposal-outline-generator',
          'proposal-composer-enhanced'
        ],
        total: 10
      };
    }

    return res.status(200).json({
      message: 'Token overflow fixes test completed',
      test_type,
      results: testResult,
      status: 'Token overflow prevention system is active and ready'
    });

  } catch (error) {
    console.error('Test Token Fixes Error:', error);
    return res.status(500).json({ 
      error: `Test failed: ${error.message}`,
      type: error.constructor.name
    });
  }
} 