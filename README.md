# Medical Grant Proposal API

Complete 5-Step Medical Education Grant Proposal Backend System

🚀 **Status**: Ready for deployment

## Overview

This serverless API system provides specialized endpoints for medical education grant proposal development:
- **Step 1**: RFP Analyzer - Analyzes RFPs and meeting notes 
- **Step 2**: Clinical Context Builder - Builds clinical justification and context
- **Step 3**: Format Recommender - Recommends GLC-branded educational formats
- **Step 4A**: Proposal Composer Part 1 - Writes first half of grant proposal
- **Step 4B**: Proposal Composer Part 2 - Completes grant proposal
- **Step 5**: Proposal Reviewer - Simulates funder review and provides feedback

**NEW: Token Overflow Prevention System**
- **Content Summarizer** - Condenses previous outputs to prevent token limits
- **Proposal Outline Generator** - Creates structured outlines before detailed writing
- **Enhanced Proposal Composer** - Automatically uses summarization layer

## Deployment

### 1. Deploy to Vercel

1. Push this code to your GitHub repository: `https://github.com/dylancobb2525/gpapi.git`
2. Connect the repository to Vercel
3. Add environment variable in Vercel dashboard:
   - `OPENAI_API_KEY`: Your OpenAI API key

### 2. Environment Variables

Set the following in your Vercel project settings:
- `OPENAI_API_KEY`: Your OpenAI API key with GPT-4 access

## API Usage

### Step 1: RFP Analyzer

**Endpoint**: `POST /api/rfp-analyzer`

**Request Body**:
```json
{
  "text": "string (required) – full RFP or meeting note text",
  "context": "string (optional) – additional user notes"
}
```

**Response**:
```json
{
  "output": "[structured RFP analysis from GPT-4]"
}
```

**Example**:
```bash
curl -X POST https://your-vercel-app.vercel.app/api/rfp-analyzer \
  -H "Content-Type: application/json" \
  -d '{
    "text": "We are seeking proposals for continuing medical education programs focusing on cardiovascular disease management...",
    "context": "Meeting with pharma rep on Jan 15, 2024"
  }'
```

### Step 2: Clinical Context Builder

**Endpoint**: `POST /api/clinical-context-builder`

**Request Body**:
```json
{
  "therapeutic_area": "string (required) – therapeutic area focus",
  "rfp_summary": "string (optional) – RFP analysis summary",
  "meeting_notes": "string (optional) – meeting notes",
  "additional_context": "string (optional) – additional context"
}
```

**Enhanced Features**:
- **15-20 peer-reviewed citations** (increased from 8-12)
- **Full URLs/DOIs** for all citations with clickable links
- **Recent research focus** (within last 5 years when possible)
- **Comprehensive content** (1500-2000 words vs 1000-1500)
- **High-impact sources** including guidelines, systematic reviews, and clinical trials

**Citation Format**:
- [Author et al. (Year) - Title](URL/DOI)
- Example: [Smith et al. (2023) - Clinical Management of Cardiovascular Disease](https://doi.org/10.1000/example)

**Response**:
```json
{
  "output": "[comprehensive clinical context with 15-20 linked citations from GPT-4]"
}
```

**Example**:
```bash
curl -X POST https://your-vercel-app.vercel.app/api/clinical-context-builder \
  -H "Content-Type: application/json" \
  -d '{
    "therapeutic_area": "Cardiovascular Disease",
    "rfp_summary": "Focus on continuing education for cardiologists...",
    "additional_context": "Target post-MI patient management"
  }'
```

### Step 3: Format Recommender

**Endpoint**: `POST /api/format-recommender`

**Request Body**:
```json
{
  "therapeutic_area": "string (optional) – therapeutic area focus",
  "clinical_context": "string (optional) – clinical background context",
  "educational_gaps": ["array of strings (required) – identified learning gaps"],
  "product_lifecycle_stage": "string (required) – lifecycle stage (pre-launch, launch, post-launch, mature)",
  "timeline_or_budget_notes": "string (optional) – timing or budget constraints"
}
```

**Response**:
```json
{
  "output": "[GLC format recommendations from GPT-4]"
}
```

**Example**:
```bash
curl -X POST https://your-vercel-app.vercel.app/api/format-recommender \
  -H "Content-Type: application/json" \
  -d '{
    "therapeutic_area": "Cardiovascular Disease",
    "educational_gaps": ["Lack of awareness about new guidelines", "Poor adherence to treatment protocols"],
    "product_lifecycle_stage": "post-launch",
    "timeline_or_budget_notes": "Fast turnaround needed, moderate budget"
  }'
```

### Step 4A: Proposal Composer Part 1

**Endpoint**: `POST /api/proposal-composer-part1`

**Request Body**:
```json
{
  "rfp_summary": "string (required) – summary from RFP analysis",
  "clinical_context": "string (required) – clinical background and justification",
  "format_recommendations": "string (required) – recommended educational formats",
  "custom_notes": "string (optional) – additional custom instructions"
}
```

**Generates**:
- Executive Summary (350-400 words)
- Needs Assessment (600-700 words)
- Program Design & Methodology (300-400 words)

**Response**:
```json
{
  "output": "[Part 1 of grant proposal from GPT-4]"
}
```

### Step 4B: Proposal Composer Part 2

**Endpoint**: `POST /api/proposal-composer-part2`

**Request Body**:
```json
{
  "format_recommendations": "string (required) – recommended educational formats",
  "part1_content": "string (required) – content from Part 1",
  "rfp_summary": "string (optional) – RFP context",
  "clinical_context": "string (optional) – clinical background",
  "custom_notes": "string (optional) – additional notes"
}
```

**Generates**:
- Outcomes & Evaluation (400-500 words)
- Target Audience & Recruitment (300-400 words)
- Innovation & Impact (200-250 words)
- Budget Justification (100-150 words)

**Response**:
```json
{
  "output": "[Part 2 of grant proposal from GPT-4]"
}
```

### Enhanced Proposal Composer (Alternative)

**Endpoint**: `POST /api/proposal-composer-enhanced`

**Request Body**:
```json
{
  "rfp_summary": "string (required) – summary from RFP analysis",
  "clinical_context": "string (required) – clinical background and justification",
  "format_recommendations": "string (required) – recommended educational formats",
  "custom_notes": "string (optional) – additional custom instructions",
  "sections_requested": ["array of strings (required) – proposal sections to generate"],
  "use_summarization": "boolean (optional) – default true, enables automatic summarization"
}
```

**Features**:
- Automatic content summarization to prevent token overflow
- Configurable summarization on/off
- Optimized for reliability and consistency

### Content Summarizer

**Endpoint**: `POST /api/content-summarizer`

**Request Body**:
```json
{
  "rfp_analysis": "string (optional) – RFP analysis to summarize",
  "clinical_context": "string (optional) – clinical context to summarize",
  "format_recommendations": "string (optional) – format recommendations to summarize",
  "content_type": "string (optional) – type of content being summarized"
}
```

**Response**:
```json
{
  "output": "[condensed summary preserving all critical information]"
}
```

### Proposal Outline Generator

**Endpoint**: `POST /api/proposal-outline-generator`

**Request Body**:
```json
{
  "rfp_summary": "string (required) – summary from RFP analysis",
  "clinical_context": "string (required) – clinical background and justification",
  "format_recommendations": "string (required) – recommended educational formats",
  "custom_notes": "string (optional) – additional custom instructions"
}
```

**Response**:
```json
{
  "output": "[structured proposal outline with all major sections]"
}
```

### Step 5: Proposal Reviewer

**Endpoint**: `POST /api/proposal-reviewer` or `POST /api/proposal-reviewer-enhanced`

**Request Body**:
```json
{
  "proposal_text": "string (required) – proposal content to review",
  "rfp_context": "string (optional) – RFP context for alignment review",
  "section_name": "string (optional) – specific section being reviewed"
}
```

**Enhanced Features**:
- **Multiple field support**: Accepts `proposal_text`, `proposal_content`, or nested objects
- **Better error handling**: Detailed error messages for debugging
- **Enhanced validation**: Checks for empty strings and invalid types
- **Debugging support**: Logs request details for troubleshooting

**Review Includes**:
- Scored evaluation (1-5 scale) for 5 key criteria
- Summary of strengths
- Summary of weaknesses or red flags
- Actionable recommendations
- Overall confidence rating (High/Medium/Low)

**Response**:
```json
{
  "output": "[structured review feedback from GPT-4]"
}
```

**Example**:
```bash
curl -X POST https://your-vercel-app.vercel.app/api/proposal-reviewer-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "proposal_text": "Executive Summary: This proposal aims to address critical gaps in cardiovascular care...",
    "rfp_context": "RFP focused on post-launch education for cardiology specialists",
    "section_name": "Executive Summary"
  }'
```

### Error Responses
- `400`: Missing or invalid required fields
- `405`: Method not allowed (only POST supported)
- `500`: OpenAI API error or internal server error

## Token Overflow Prevention

This API includes several mechanisms to prevent token limit issues that commonly occur in multi-step grant proposal development:

### 1. Content Summarization
- **Automatic summarization** of previous step outputs before passing to proposal composers
- **Preserves all critical information** while reducing length by 70-80%
- **Configurable** - can be enabled/disabled per request

### 2. Structured Approach
- **Part 1/Part 2 proposal generation** - splits large proposals into manageable chunks
- **Outline-first approach** - generates structured outlines before detailed content
- **Strict token limits** - enforced at each step to prevent overflow

### 3. Enhanced Endpoints
- **Enhanced Proposal Composer** - automatically handles summarization
- **Content Summarizer** - standalone summarization service
- **Proposal Outline Generator** - creates structured outlines

### 4. Best Practices
- Use the **Part 1/Part 2 approach** for large proposals
- Enable **automatic summarization** for complex projects
- Generate **outlines first** for better structure
- Monitor **token usage** in your requests

## Development

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:3000/api/rfp-analyzer` 