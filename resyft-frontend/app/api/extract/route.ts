import { NextRequest, NextResponse } from 'next/server'

interface PaperAnalysisResult {
  methods: string
  sample_size: number | null
  key_statistics: any
  conclusions: string
  important_quotes: string[]
  reliability_score: number
  relevance_score: number
  suggested_text: string
}

export async function POST(request: NextRequest) {
  try {
    const { paper_url = '', paper_text = '', extraction_type = 'all', custom_prompt } = await request.json()

    const apiKey = process.env.OPEN_ROUTER_API_KEY
    const model = process.env.OPEN_ROUTER_MODEL || 'google/gemini-2.5-flash-lite'
    
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured')
    }
    
    // Validate input
    if (!paper_text && !paper_url) {
      return NextResponse.json(
        { error: 'Either paper_text or paper_url must be provided' },
        { status: 400 }
      )
    }

    // For URL analysis, return error for now (can be implemented later)
    if (paper_url && !paper_text) {
      return NextResponse.json({
        error: 'URL analysis not yet implemented. Please paste the paper text directly.',
        suggestion: 'Copy and paste the research paper content into the text field.'
      }, { status: 400 })
    }

    // Validate text length
    if (paper_text && paper_text.length < 100) {
      return NextResponse.json(
        { error: 'Paper text too short. Please provide at least 100 characters of research content.' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert research analyst specialized in extracting key information from academic papers. Your task is to analyze the provided research paper and extract structured information with high accuracy.

ANALYSIS REQUIREMENTS:
1. Extract methodology details and research approach
2. Identify sample sizes and participant demographics
3. Extract all statistical findings, p-values, effect sizes
4. Summarize key conclusions and findings
5. Extract 3-5 most important quotes that support main findings
6. Assess reliability and relevance (0.0-1.0 scale)
7. Generate citation-ready summary text

EXTRACTION FOCUS:
${custom_prompt || 'Extract key findings, methods, sample size, and conclusions with supporting statistics'}

IMPORTANT: Provide specific, accurate information extracted directly from the text. If information is not available, state "Not specified in the paper" rather than making assumptions.`

    const userPrompt = `Please analyze this research paper and extract key information:

${paper_text.slice(0, 15000)}${paper_text.length > 15000 ? '... (truncated)' : ''}

Return your analysis in this exact JSON format:
{
  "methods": "detailed methodology description",
  "sample_size": number_or_null,
  "key_statistics": "statistical findings with p-values and effect sizes",
  "conclusions": "main conclusions and findings",
  "important_quotes": ["quote1", "quote2", "quote3"],
  "reliability_score": 0.85,
  "relevance_score": 0.90,
  "suggested_text": "citation-ready text summarizing key findings"
}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://resyft.com',
        'X-Title': 'Resyft Paper Analysis',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()

    // Extract JSON from response
    let analysisResult: PaperAnalysisResult
    try {
      // Find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      analysisResult = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      // Fallback: create structured response from text
      analysisResult = {
        methods: extractSection(content, 'methods') || 'Methods not clearly specified in the analysis',
        sample_size: extractNumber(content, ['sample', 'participants', 'subjects']) || null,
        key_statistics: extractSection(content, 'statistics') || 'Statistical information not extracted',
        conclusions: extractSection(content, 'conclusions') || content.slice(0, 300) + '...',
        important_quotes: extractQuotes(content) || ['Analysis completed - see detailed results above'],
        reliability_score: 0.7,
        relevance_score: 0.8,
        suggested_text: content.slice(0, 200) + '...'
      }
    }

    // Ensure all required fields are present
    const result = {
      methods: analysisResult.methods || 'No methodology information extracted',
      sample_size: analysisResult.sample_size,
      key_statistics: analysisResult.key_statistics || 'No statistical data extracted',
      conclusions: analysisResult.conclusions || 'No conclusions extracted from the paper',
      important_quotes: Array.isArray(analysisResult.important_quotes) 
        ? analysisResult.important_quotes 
        : ['No quotes extracted from the paper'],
      reliability_score: Math.max(0, Math.min(1, analysisResult.reliability_score || 0.7)),
      relevance_score: Math.max(0, Math.min(1, analysisResult.relevance_score || 0.8)),
      suggested_text: analysisResult.suggested_text || 'Analysis completed successfully',
      _full_result: {
        suggested_text: analysisResult.suggested_text
      }
    }

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Paper Analysis Error:', error)
    
    // Return meaningful error response
    return NextResponse.json({
      methods: 'Analysis failed due to technical error',
      sample_size: null,
      key_statistics: 'Unable to extract statistics',
      conclusions: 'Analysis could not be completed',
      important_quotes: ['Technical error prevented quote extraction'],
      reliability_score: 0,
      relevance_score: 0,
      suggested_text: 'Analysis unavailable due to system error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      _full_result: {
        suggested_text: 'Please try again or contact support if the issue persists'
      }
    }, { status: 200 }) // Return 200 to show results even on error
  }
}

// Helper functions for fallback parsing
function extractSection(text: string, section: string): string | null {
  const regex = new RegExp(`${section}[:\s]*(.*?)(?=\n\n|$)`, 'i')
  const match = text.match(regex)
  return match ? match[1].trim() : null
}

function extractNumber(text: string, keywords: string[]): number | null {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\s]*(\d+)`, 'i')
    const match = text.match(regex)
    if (match) {
      return parseInt(match[1])
    }
  }
  return null
}

function extractQuotes(text: string): string[] | null {
  const quotes = text.match(/"([^"]+)"/g)
  return quotes ? quotes.slice(0, 3).map(q => q.replace(/"/g, '')) : null
}