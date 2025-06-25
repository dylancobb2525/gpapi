# Medical Grant Proposal API

Complete 5-Step Medical Education Grant Proposal Backend System

🚀 **Status**: Ready for deployment

## Overview

This serverless API system provides specialized endpoints for medical education grant proposal development:
- **Step 1**: RFP Analyzer - Analyzes RFPs and meeting notes 
- **Step 2**: Clinical Context Builder - Builds clinical justification and context
- **Step 3**: Format Recommender - Recommends GLC-branded educational formats
- **Step 4**: Proposal Composer - Writes formal grant proposal sections
- **Step 5**: Proposal Reviewer - Simulates funder review and provides feedback

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

**Response**:
```json
{
  "output": "[clinical context and justification from GPT-4]"
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

### Step 4: Proposal Composer

**Endpoint**: `POST /api/proposal-composer`

**Request Body**:
```json
{
  "rfp_summary": "string (required) – summary from RFP analysis",
  "clinical_context": "string (required) – clinical background and justification",
  "format_recommendations": "string (required) – recommended educational formats",
  "custom_notes": "string (optional) – additional custom instructions",
  "sections_requested": ["array of strings (required) – proposal sections to generate"]
}
```

**Available Sections**:
- Executive Summary
- Needs Assessment / Gaps / Barriers
- Design & Methods
- Outcomes / Evaluation
- Target Audience & Recruitment
- Innovation / Differentiation
- Faculty (optional)

**Response**:
```json
{
  "output": "[formal proposal sections from GPT-4]"
}
```

**Example**:
```bash
curl -X POST https://your-vercel-app.vercel.app/api/proposal-composer \
  -H "Content-Type: application/json" \
  -d '{
    "rfp_summary": "Focus on cardiovascular education for post-launch product...",
    "clinical_context": "Recent guidelines show gaps in post-MI management...",
    "format_recommendations": "DecisionSim™ and Expert Interview formats recommended...",
    "sections_requested": ["Executive Summary", "Needs Assessment / Gaps / Barriers", "Design & Methods"]
  }'
```

### Step 5: Proposal Reviewer

**Endpoint**: `POST /api/proposal-reviewer`

**Request Body**:
```json
{
  "proposal_text": "string (required) – proposal content to review",
  "rfp_context": "string (optional) – RFP context for alignment review",
  "section_name": "string (optional) – specific section being reviewed"
}
```

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
curl -X POST https://your-vercel-app.vercel.app/api/proposal-reviewer \
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

## Development

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:3000/api/rfp-analyzer` 