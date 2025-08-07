import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paper_url, extraction_type } = body

    // Use real backend in production, mock in development
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (isProduction) {
      // Production: Call real backend
      const response = await fetch('https://resyft-production-c00e.up.railway.app/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    }
    
    // Development: Use mock data
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock response based on extraction type
    const mockResponse = {
      id: `extract_${Date.now()}`,
      status: 'completed',
      paper_url,
      extraction_type,
      results: {
        summary: extraction_type === 'all' || extraction_type === 'details' 
          ? "This research paper investigates the application of machine learning techniques in medical diagnosis. The study demonstrates significant improvements in diagnostic accuracy using a novel CNN architecture, achieving 94.2% accuracy in early disease detection."
          : null,
        numerical_data: extraction_type === 'all' || extraction_type === 'numerical'
          ? [
              { type: 'accuracy', value: '94.2%', context: 'Overall diagnostic accuracy' },
              { type: 'sample_size', value: '5,432', context: 'Number of patients in study' },
              { type: 'p_value', value: '< 0.001', context: 'Statistical significance' },
              { type: 'sensitivity', value: '96.7%', context: 'True positive rate' },
              { type: 'specificity', value: '91.8%', context: 'True negative rate' }
            ]
          : [],
        quotes: extraction_type === 'all' || extraction_type === 'quotes'
          ? [
              "Our proposed CNN architecture demonstrated a 94.2% accuracy rate in tumor detection, representing a substantial improvement over conventional radiological assessment.",
              "The integration of machine learning with traditional diagnostic methods shows promise for revolutionizing medical practice.",
              "Early detection capabilities are crucial for improving patient outcomes and reducing healthcare costs."
            ]
          : [],
        metadata: {
          title: "Machine Learning Applications in Medical Diagnosis",
          authors: ["Dr. Smith", "Dr. Johnson"],
          journal: "Nature Medicine",
          year: "2024",
          pages: 15,
          processing_time: 2.1
        }
      },
      created_at: new Date().toISOString()
    }

    return NextResponse.json(mockResponse)
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze paper' },
      { status: 500 }
    )
  }
}