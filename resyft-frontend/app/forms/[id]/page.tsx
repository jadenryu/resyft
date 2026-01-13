'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { PDFViewer } from '../../../components/pdf-viewer'
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

interface Segment {
  text: string
  type: string
  page_number: number
  top: number
  left: number
  width: number
  height: number
  page_width: number
  page_height: number
}

interface ExtractedField {
  name: string
  value: string
  type: string
  confidence: number
}

export default function FormDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1]
        setPdfBase64(base64)

        // Analyze PDF
        setAnalyzing(true)
        await analyzePDF(file)
        setAnalyzing(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const analyzePDF = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Call the AI service to analyze the PDF
      const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001'
      console.log('Calling AI service at:', aiServiceUrl)

      const response = await fetch(`${aiServiceUrl}/analyze-form`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSegments(data.segments || [])
          setExtractedFields(data.fields || [])
          if (data.form_type) {
            setExtractedFields(prev => [
              { name: 'Form Type', value: data.form_type, type: 'text', confidence: 0.95 },
              ...prev
            ])
          }
        } else {
          console.error('Analysis failed:', data.error)
          setExtractedFields([
            { name: 'Error', value: data.error || 'Analysis failed', type: 'error', confidence: 0 }
          ])
        }
      } else {
        console.error('Response not OK:', response.status, response.statusText)
        setExtractedFields([
          { name: 'Error', value: `Server error: ${response.status}`, type: 'error', confidence: 0 }
        ])
      }
    } catch (error) {
      console.error('Analysis error:', error)
      // Show helpful message about AI service
      const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001'
      setSegments([])
      setExtractedFields([
        { name: 'Connection Error', value: `Could not connect to AI service at ${aiServiceUrl}`, type: 'error', confidence: 0 },
        { name: 'Note', value: 'Make sure NEXT_PUBLIC_AI_SERVICE_URL is set in environment variables', type: 'info', confidence: 0 }
      ])
    }
  }

  const handleSegmentClick = (segment: Segment, index: number) => {
    setSelectedSegment(segment)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-lg font-semibold">Form Viewer</h1>
          {analyzing && (
            <Badge className="bg-blue-100 text-blue-700">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Analyzing...
            </Badge>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* PDF Viewer */}
        <div className="flex-1 border-r">
          {!pdfBase64 ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-100">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Upload a form to analyze</p>
              <label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload PDF
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <PDFViewer
              pdfBase64={pdfBase64}
              segments={segments}
              onSegmentClick={handleSegmentClick}
            />
          )}
        </div>

        {/* Sidebar - Extracted Fields */}
        <div className="w-96 bg-white overflow-auto">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Extracted Fields</h2>
            <p className="text-sm text-gray-500">
              {extractedFields.length} fields detected
            </p>
          </div>

          {extractedFields.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Upload a form to see extracted fields</p>
            </div>
          ) : (
            <div className="divide-y">
              {extractedFields.map((field, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{field.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{field.value || '(empty)'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {field.confidence > 0.8 ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {field.type}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {Math.round(field.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Segment Info */}
          {selectedSegment && (
            <div className="p-4 border-t bg-blue-50">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Segment</h3>
              <p className="text-sm text-blue-800">{selectedSegment.text}</p>
              <Badge className="mt-2 bg-blue-100 text-blue-700">
                {selectedSegment.type}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
