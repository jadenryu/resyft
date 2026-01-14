'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
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
  ChevronRight,
  AlertTriangle,
  Save,
  FolderPlus
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
  is_pii?: boolean
}

interface ExtractedField {
  name: string
  value: string
  type: string
  confidence: number
}

interface FormData {
  formName: string
  purpose: string
  accessibility: string
  isCustom?: boolean
  pdfBase64?: string
}

interface Project {
  id: string
  name: string
  description: string
  forms: FormData[]
  createdAt: string
}

export default function FormDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([])
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  // Form metadata
  const [formName, setFormName] = useState('')
  const [formPurpose, setFormPurpose] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Load projects from localStorage
      const saved = localStorage.getItem('formfiller_projects')
      if (saved) {
        setProjects(JSON.parse(saved))
      }

      // Check if projectId is in URL params
      const projectId = searchParams.get('projectId')
      if (projectId) {
        setSelectedProjectId(projectId)
      }

      setLoading(false)
    }
    checkUser()
  }, [router, supabase, searchParams])

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
      let aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001'
      // Ensure URL has protocol prefix
      if (aiServiceUrl && !aiServiceUrl.startsWith('http://') && !aiServiceUrl.startsWith('https://')) {
        aiServiceUrl = `https://${aiServiceUrl}`
      }
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

          // Fetch AI summary
          fetchAiSummary(data.segments || [], file.name, aiServiceUrl)
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
      let aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001'
      if (aiServiceUrl && !aiServiceUrl.startsWith('http://') && !aiServiceUrl.startsWith('https://')) {
        aiServiceUrl = `https://${aiServiceUrl}`
      }
      setSegments([])
      setExtractedFields([
        { name: 'Connection Error', value: `Could not connect to AI service at ${aiServiceUrl}`, type: 'error', confidence: 0 },
        { name: 'Note', value: 'Make sure NEXT_PUBLIC_AI_SERVICE_URL is set in environment variables', type: 'info', confidence: 0 }
      ])
    }
  }

  const fetchAiSummary = async (segments: Segment[], filename: string, aiServiceUrl: string) => {
    setLoadingSummary(true)
    setAiSummary(null)

    try {
      const response = await fetch(`${aiServiceUrl}/summarize-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segments: segments,
          filename: filename
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.summary) {
          setAiSummary(data.summary)
        }
      }
    } catch (error) {
      console.error('Summary fetch error:', error)
      // Silently fail - summary is optional
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleSegmentClick = (segment: Segment, index: number) => {
    setSelectedSegment(segment)
  }

  const handleSaveToProject = () => {
    if (!formName.trim()) {
      alert('Please enter a form name')
      return
    }
    if (!selectedProjectId) {
      alert('Please select a project')
      return
    }

    setSaving(true)

    const newForm: FormData = {
      formName: formName.trim(),
      purpose: formPurpose.trim() || 'Custom uploaded form',
      accessibility: formNotes.trim() || 'User uploaded document',
      isCustom: true,
      pdfBase64: pdfBase64 || undefined
    }

    // Update the project in localStorage
    const saved = localStorage.getItem('formfiller_projects')
    if (saved) {
      const allProjects: Project[] = JSON.parse(saved)
      const projectIdx = allProjects.findIndex(p => p.id === selectedProjectId)
      if (projectIdx !== -1) {
        allProjects[projectIdx].forms.push(newForm)
        localStorage.setItem('formfiller_projects', JSON.stringify(allProjects))
        setProjects(allProjects)
      }
    }

    setSaving(false)
    setShowSaveModal(false)

    // Navigate back to project
    router.push(`/projects/${selectedProjectId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[var(--font-inter)]">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => {
              if (selectedProjectId) {
                router.push(`/projects/${selectedProjectId}`)
              } else {
                router.push('/dashboard')
              }
            }}>
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
          {pdfBase64 && (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowSaveModal(true)}
            >
              <Save className="w-4 h-4 mr-2" />
              Save to Project
            </Button>
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
          {/* AI Summary Section */}
          {(aiSummary || loadingSummary) && (
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="font-semibold text-blue-900 text-sm">AI Summary</h3>
              </div>
              {loadingSummary ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating summary...</span>
                </div>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
              )}
            </div>
          )}

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

      {/* Save to Project Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-2 mb-4">
              <FolderPlus className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Save Form to Project</h2>
            </div>

            <div className="space-y-4">
              {/* Form Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., W-2 Tax Form 2024"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Purpose/Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <input
                  type="text"
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  placeholder="e.g., Report wages and taxes"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes/Accessibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any additional notes about this form..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add to Project <span className="text-red-500">*</span>
                </label>
                {projects.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    No projects yet.{' '}
                    <button
                      onClick={() => {
                        setShowSaveModal(false)
                        router.push('/dashboard')
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Create a project first
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value || null)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a project...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.forms.length} forms)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveToProject}
                disabled={!formName.trim() || !selectedProjectId || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Form
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
