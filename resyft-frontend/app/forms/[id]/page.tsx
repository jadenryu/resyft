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
  FolderPlus,
  MessageSquare,
  Send,
  Bot,
  User
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
  segments?: Segment[]  // Store segments for project-wide AI context
}

interface Project {
  id: string
  name: string
  description: string
  forms: FormData[]
  createdAt: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Simple markdown renderer for chat messages
function renderMarkdown(text: string): React.ReactNode {
  // Split by code blocks first
  const parts = text.split(/```([\s\S]*?)```/)

  return parts.map((part, i) => {
    // Odd indices are code blocks
    if (i % 2 === 1) {
      return (
        <pre key={i} className="bg-gray-800 text-gray-100 rounded p-2 my-2 text-xs overflow-x-auto">
          <code>{part.trim()}</code>
        </pre>
      )
    }

    // Process inline formatting
    const lines = part.split('\n')
    return lines.map((line, lineIdx) => {
      // Process the line for inline formatting
      const processed: React.ReactNode[] = []
      let remaining = line
      let keyCounter = 0

      // Handle bold **text**
      while (remaining.includes('**')) {
        const start = remaining.indexOf('**')
        const end = remaining.indexOf('**', start + 2)
        if (end === -1) break

        if (start > 0) {
          processed.push(remaining.slice(0, start))
        }
        processed.push(
          <strong key={`b-${i}-${lineIdx}-${keyCounter++}`}>
            {remaining.slice(start + 2, end)}
          </strong>
        )
        remaining = remaining.slice(end + 2)
      }
      if (remaining) processed.push(remaining)

      // Handle inline code `code` - process each node
      const finalProcessed: React.ReactNode[] = []
      processed.forEach((node, nodeIdx) => {
        if (typeof node !== 'string') {
          finalProcessed.push(node)
          return
        }
        const codeParts = node.split(/`([^`]+)`/)
        codeParts.forEach((codePart, codeIdx) => {
          if (codeIdx % 2 === 1) {
            finalProcessed.push(
              <code key={`c-${i}-${lineIdx}-${nodeIdx}-${codeIdx}`} className="bg-gray-200 px-1 rounded text-sm font-mono">
                {codePart}
              </code>
            )
          } else if (codePart) {
            finalProcessed.push(codePart)
          }
        })
      })

      // Handle bullet points
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        return (
          <div key={`l-${i}-${lineIdx}`} className="flex gap-2 ml-2">
            <span>•</span>
            <span>{finalProcessed}</span>
          </div>
        )
      }

      // Handle numbered lists
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s/)
      if (numberedMatch) {
        return (
          <div key={`l-${i}-${lineIdx}`} className="flex gap-2 ml-2">
            <span>{numberedMatch[1]}.</span>
            <span>{finalProcessed}</span>
          </div>
        )
      }

      return (
        <span key={`l-${i}-${lineIdx}`}>
          {finalProcessed}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      )
    })
  })
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

  // Chat state
  const [sidebarTab, setSidebarTab] = useState<'fields' | 'chat'>('fields')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

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

      // Check for PDF in sessionStorage (coming from project view)
      const storedPdf = sessionStorage.getItem('viewerPdfBase64')
      if (storedPdf) {
        setPdfBase64(storedPdf)
        // Clear after loading so it doesn't persist incorrectly
        sessionStorage.removeItem('viewerPdfBase64')
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
      pdfBase64: pdfBase64 || undefined,
      segments: segments.length > 0 ? segments : undefined  // Store segments for project-wide AI context
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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      let aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001'
      if (aiServiceUrl && !aiServiceUrl.startsWith('http://') && !aiServiceUrl.startsWith('https://')) {
        aiServiceUrl = `https://${aiServiceUrl}`
      }

      // Build context - include all forms from project if available
      const projectId = searchParams.get('projectId')
      let allFormsContext: { name: string; segments: Segment[] }[] = []

      // Add current form's segments
      if (segments.length > 0) {
        allFormsContext.push({ name: formName || 'Current Form', segments })
      }

      // Load other forms from the project
      if (projectId) {
        const saved = localStorage.getItem('formfiller_projects')
        if (saved) {
          const allProjects: Project[] = JSON.parse(saved)
          const project = allProjects.find(p => p.id === projectId)
          if (project) {
            project.forms.forEach(form => {
              if (form.segments && form.segments.length > 0) {
                // Don't duplicate current form
                if (form.formName !== formName) {
                  allFormsContext.push({ name: form.formName, segments: form.segments })
                }
              }
            })
          }
        }
      }

      // Build combined context from all forms
      let formContext = ''
      let segmentCount = 0
      const maxSegments = 300
      const segmentsPerForm = Math.floor(maxSegments / Math.max(allFormsContext.length, 1))

      for (const formData of allFormsContext) {
        if (segmentCount >= maxSegments) break

        const segmentsByPage: Record<number, Segment[]> = {}
        formData.segments.forEach(s => {
          if (!segmentsByPage[s.page_number]) segmentsByPage[s.page_number] = []
          segmentsByPage[s.page_number].push(s)
        })

        formContext += `\n========== ${formData.name} ==========\n`
        formContext += `Total Pages: ${Object.keys(segmentsByPage).length}\n`
        formContext += `Total Fields: ${formData.segments.filter(s => s.type === 'Form Field' || s.type === 'Checkbox' || s.type === 'Dropdown').length}\n`

        let formSegmentCount = 0
        for (const pageNum of Object.keys(segmentsByPage).map(Number).sort((a, b) => a - b)) {
          if (segmentCount >= maxSegments || formSegmentCount >= segmentsPerForm) break
          formContext += `\n--- Page ${pageNum} ---\n`
          for (const seg of segmentsByPage[pageNum]) {
            if (segmentCount >= maxSegments || formSegmentCount >= segmentsPerForm) break
            const piiMarker = seg.is_pii ? ' [PII]' : ''
            formContext += `[${seg.type}${piiMarker}] ${seg.text}\n`
            segmentCount++
            formSegmentCount++
          }
        }

        if (formSegmentCount >= segmentsPerForm && formData.segments.length > formSegmentCount) {
          formContext += `[... ${formData.segments.length - formSegmentCount} more segments truncated ...]\n`
        }
      }

      if (allFormsContext.length > 1) {
        formContext = `Project contains ${allFormsContext.length} forms:\n` + formContext
      }

      const response = await fetch(`${aiServiceUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: formContext,
          history: chatMessages.slice(-10) // Last 10 messages for context
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.response) {
          setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        } else {
          setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
        }
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, the AI service is unavailable. Please try again later.' }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not connect to the AI service.' }])
    } finally {
      setChatLoading(false)
    }
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

        {/* Sidebar */}
        <div className="w-96 bg-white flex flex-col">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setSidebarTab('fields')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                sidebarTab === 'fields'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Fields
            </button>
            <button
              onClick={() => setSidebarTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                sidebarTab === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              AI Chat
            </button>
          </div>

          {sidebarTab === 'fields' ? (
            <div className="flex-1 overflow-auto">
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
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="font-medium text-gray-700 mb-1">AI Form Assistant</h3>
                    <p className="text-sm text-gray-500">
                      Ask me anything about this form. I can help you understand fields, requirements, and how to fill it out.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        {msg.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="text-sm">
                          {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Ask about this form..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={chatLoading || !pdfBase64}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={chatLoading || !chatInput.trim() || !pdfBase64}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {!pdfBase64 && (
                  <p className="text-xs text-gray-400 mt-2">Upload a form to start chatting</p>
                )}
              </div>
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
