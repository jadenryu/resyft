'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useMutation } from '@tanstack/react-query'
// Define ExtractionRequest interface locally
interface ExtractionRequest {
  paper_url?: string
  paper_text?: string
  extraction_type: 'all' | 'statistics' | 'quotes' | 'summary' | 'methodology' | 'quality'
}

export function PaperUpload() {
  const [paperUrl, setPaperUrl] = useState('')
  const [extractionType, setExtractionType] = useState<ExtractionRequest['extraction_type']>('all')
  
  const extractMutation = useMutation({
    mutationFn: async (data: ExtractionRequest) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Extraction failed')
      return response.json()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!paperUrl) return
    
    extractMutation.mutate({
      paper_url: paperUrl,
      extraction_type: extractionType,
    })
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 mb-12">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="paper-url" className="block text-sm font-medium text-gray-700 mb-2">
            Research Paper URL
          </label>
          <Textarea
            id="paper-url"
            placeholder="Paste the URL to a research paper..."
            value={paperUrl}
            onChange={(e) => setPaperUrl(e.target.value)}
            className="w-full"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="extraction-type" className="block text-sm font-medium text-gray-700 mb-2">
            What information do you need?
          </label>
          <Select
            value={extractionType}
            onValueChange={(value) => setExtractionType(value as ExtractionRequest['extraction_type'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Information</SelectItem>
              <SelectItem value="numerical">Numerical Data</SelectItem>
              <SelectItem value="quotes">Important Quotes</SelectItem>
              <SelectItem value="details">Key Details</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={!paperUrl || extractMutation.isPending}
        >
          {extractMutation.isPending ? 'Analyzing...' : 'Analyze Paper'}
        </Button>
      </form>

      {extractMutation.isSuccess && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Extraction Results</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(extractMutation.data, null, 2)}
          </pre>
        </div>
      )}

      {extractMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
          Error: Failed to extract information. Please try again.
        </div>
      )}
    </div>
  )
}