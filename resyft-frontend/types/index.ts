export interface User {
  id: string
  email: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  research_argument: string
  extraction_preferences: {
    favor_statistical: boolean
    favor_qualitative: boolean
  }
  created_at: string
  updated_at: string
}

export interface Paper {
  id: string
  project_id?: string
  user_id?: string
  title: string
  authors?: string[]
  url?: string
  pdf_url?: string
  processed_at?: string
  created_at: string
}

export interface ExtractedData {
  id: string
  paper_id: string
  methods?: string
  sample_size?: number
  key_statistics?: Record<string, any>
  conclusions?: string
  important_quotes?: string[]
  numerical_data?: Record<string, number>
  reliability_score?: number
  relevance_score?: number
  support_score?: number
  raw_data?: any
  created_at: string
}

export interface ExtractionRequest {
  paper_url?: string
  paper_text?: string
  extraction_type: 'numerical' | 'quotes' | 'details' | 'all'
  project_id?: string
}