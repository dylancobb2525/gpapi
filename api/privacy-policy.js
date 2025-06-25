export default async function handler(req, res) {
  // Allow GET requests only
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET to retrieve privacy policy.' });
  }

  try {
    const privacyPolicy = {
      title: "Grant Pipeline API - Privacy Policy",
      effectiveDate: "January 2025",
      lastUpdated: "January 2025",
      
      overview: "This Privacy Policy describes how the Grant Pipeline API collects, uses, and protects information when you use our medical education grant proposal API services.",
      
      dataCollection: {
        dataYouProvide: [
          "RFP (Request for Proposal) text and documents",
          "Therapeutic area information", 
          "Meeting notes and context",
          "Clinical data and medical information",
          "Grant proposal content"
        ],
        automaticallyCollected: [
          "API usage logs and timestamps",
          "Error logs and debugging information",
          "Request/response metadata (excluding content)",
          "IP addresses for security purposes"
        ],
        dataWeDoNotCollect: [
          "Personal identifying information (names, addresses, phone numbers)",
          "Financial information",
          "Protected health information (PHI) beyond what's necessary for content generation",
          "Login credentials or authentication data"
        ]
      },
      
      dataUsage: {
        primaryUses: [
          "Content Generation: Processing your input through our AI models to generate grant proposal content",
          "Service Improvement: Analyzing usage patterns to improve API performance", 
          "Technical Support: Troubleshooting and resolving technical issues"
        ],
        thirdPartyProcessing: "Your content is processed by OpenAI's GPT-4 model through their API. This processing is subject to OpenAI's privacy policy and terms of service. We do not store copies of your content after processing."
      },
      
      dataRetention: {
        temporaryProcessing: [
          "Input data is processed in real-time and not stored permanently",
          "Response data is generated and returned immediately", 
          "No content is retained in our databases after API response"
        ],
        logData: [
          "Technical logs are retained for 30 days for debugging purposes",
          "Logs contain metadata only, not content",
          "Logs are automatically deleted after 30 days"
        ]
      },
      
      security: {
        technicalSafeguards: [
          "HTTPS encryption for all API communications",
          "Secure server infrastructure through Vercel",
          "Regular security monitoring and updates",
          "Access controls and authentication"
        ],
        dataProtection: [
          "No persistent storage of sensitive content",
          "Minimal data retention policies", 
          "Regular security audits and assessments"
        ]
      },
      
      userRights: [
        "Request information about data processing",
        "Request deletion of any retained data",
        "Opt-out of service usage at any time"
      ],
      
      gdprRights: [
        "Right of access to your data",
        "Right to rectification of inaccurate data",
        "Right to erasure (right to be forgotten)",
        "Right to restrict processing", 
        "Right to data portability",
        "Right to object to processing"
      ],
      
      contact: {
        project: "Grant Pipeline API",
        repository: "https://github.com/dylancobb2525/gpapi",
        note: "Contact information available in repository"
      },
      
      compliance: {
        medicalInformation: [
          "We process medical information only for content generation purposes",
          "No PHI is stored or retained beyond processing time",
          "Content generation is for educational/proposal purposes only"
        ],
        internationalUsers: [
          "Service available globally",
          "Data processing occurs in accordance with applicable laws",
          "EU users: Processing is based on legitimate interest for service provision"
        ]
      },
      
      disclaimer: "This API is for educational and proposal development purposes only. Generated content should be reviewed by qualified professionals before submission to funding organizations.",
      
      fullPolicyUrl: "https://github.com/dylancobb2525/gpapi/blob/main/PRIVACY_POLICY.md"
    };

    // Return privacy policy information
    return res.status(200).json({
      privacyPolicy,
      message: "For the complete privacy policy, visit the repository or contact us using the information provided."
    });

  } catch (error) {
    console.error('Privacy Policy API Error:', error);
    
    // Handle general errors
    return res.status(500).json({ 
      error: `Internal server error: ${error.message}` 
    });
  }
} 