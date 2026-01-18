'use client'

import React, { useState, useEffect } from 'react'
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
  owner_id?: string
  role?: 'owner' | 'editor' | 'viewer'
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface DetailedSummary {
  id: string
  title: string
  summary: string
  segment_ids: number[]
}

interface DetailedSummaryData {
  overall_summary: string
  detailed_summaries: DetailedSummary[]
  granularity: 'page' | 'section'
}

// Enhanced markdown renderer for chat messages
function renderMarkdown(text: string): React.ReactNode {
  // Split by code blocks first
  const parts = text.split(/```([\s\S]*?)```/)

  return parts.map((part, i) => {
    // Odd indices are code blocks
    if (i % 2 === 1) {
      return (
        <pre key={i} className="bg-gray-800 text-gray-100 rounded p-3 my-2 text-xs overflow-x-auto">
          <code>{part.trim()}</code>
        </pre>
      )
    }

    // Process inline formatting
    const lines = part.split('\n')
    return lines.map((line, lineIdx) => {
      const trimmedLine = line.trim()

      // Handle headings (###, ##, #)
      const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const content = headingMatch[2]
        const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements
        const sizeClass = level === 1 ? 'text-xl font-bold mt-4 mb-2' :
                         level === 2 ? 'text-lg font-bold mt-3 mb-2' :
                         'text-base font-semibold mt-2 mb-1'
        return (
          <HeadingTag key={`h-${i}-${lineIdx}`} className={sizeClass}>
            {content}
          </HeadingTag>
        )
      }

      // Process the line for inline formatting
      let processed: React.ReactNode[] = []
      let remaining = line
      let keyCounter = 0

      // Handle bold **text** and italic *text*
      while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
        const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/)
        const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/)

        // Find which comes first
        const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity
        const italicIdx = italicMatch ? remaining.indexOf(italicMatch[0]) : Infinity
        const linkIdx = linkMatch ? remaining.indexOf(linkMatch[0]) : Infinity

        const minIdx = Math.min(boldIdx, italicIdx, linkIdx)

        if (minIdx === Infinity) {
          // No more formatting
          if (remaining) processed.push(remaining)
          break
        }

        // Add text before the match
        if (minIdx > 0) {
          processed.push(remaining.slice(0, minIdx))
        }

        // Add the formatted element
        if (minIdx === boldIdx && boldMatch) {
          processed.push(
            <strong key={`b-${i}-${lineIdx}-${keyCounter++}`} className="font-bold">
              {boldMatch[1]}
            </strong>
          )
          remaining = remaining.slice(minIdx + boldMatch[0].length)
        } else if (minIdx === italicIdx && italicMatch) {
          processed.push(
            <em key={`i-${i}-${lineIdx}-${keyCounter++}`} className="italic">
              {italicMatch[1]}
            </em>
          )
          remaining = remaining.slice(minIdx + italicMatch[0].length)
        } else if (minIdx === linkIdx && linkMatch) {
          processed.push(
            <a
              key={`a-${i}-${lineIdx}-${keyCounter++}`}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {linkMatch[1]}
            </a>
          )
          remaining = remaining.slice(minIdx + linkMatch[0].length)
        }
      }

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
              <code key={`c-${i}-${lineIdx}-${nodeIdx}-${codeIdx}`} className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">
                {codePart}
              </code>
            )
          } else if (codePart) {
            finalProcessed.push(codePart)
          }
        })
      })

      // Handle bullet points
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        const content = trimmedLine.replace(/^[-•]\s+/, '')
        return (
          <div key={`l-${i}-${lineIdx}`} className="flex gap-2 ml-2 my-1">
            <span className="text-gray-600">•</span>
            <span className="flex-1">{renderInlineContent(content, i, lineIdx)}</span>
          </div>
        )
      }

      // Handle numbered lists
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/)
      if (numberedMatch) {
        return (
          <div key={`l-${i}-${lineIdx}`} className="flex gap-2 ml-2 my-1">
            <span className="text-gray-600">{numberedMatch[1]}.</span>
            <span className="flex-1">{renderInlineContent(numberedMatch[2], i, lineIdx)}</span>
          </div>
        )
      }

      // Empty line
      if (!trimmedLine) {
        return <div key={`l-${i}-${lineIdx}`} className="h-2" />
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

// Helper function to render inline content with formatting
function renderInlineContent(text: string, blockIdx: number, lineIdx: number): React.ReactNode {
  let processed: React.ReactNode[] = []
  let remaining = text
  let keyCounter = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/)
    const codeMatch = remaining.match(/`([^`]+)`/)

    const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity
    const italicIdx = italicMatch ? remaining.indexOf(italicMatch[0]) : Infinity
    const codeIdx = codeMatch ? remaining.indexOf(codeMatch[0]) : Infinity

    const minIdx = Math.min(boldIdx, italicIdx, codeIdx)

    if (minIdx === Infinity) {
      if (remaining) processed.push(remaining)
      break
    }

    if (minIdx > 0) {
      processed.push(remaining.slice(0, minIdx))
    }

    if (minIdx === boldIdx && boldMatch) {
      processed.push(
        <strong key={`ib-${blockIdx}-${lineIdx}-${keyCounter++}`} className="font-bold">
          {boldMatch[1]}
        </strong>
      )
      remaining = remaining.slice(minIdx + boldMatch[0].length)
    } else if (minIdx === italicIdx && italicMatch) {
      processed.push(
        <em key={`ii-${blockIdx}-${lineIdx}-${keyCounter++}`} className="italic">
          {italicMatch[1]}
        </em>
      )
      remaining = remaining.slice(minIdx + italicMatch[0].length)
    } else if (minIdx === codeIdx && codeMatch) {
      processed.push(
        <code key={`ic-${blockIdx}-${lineIdx}-${keyCounter++}`} className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(minIdx + codeMatch[0].length)
    }
  }

  return <>{processed}</>
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
  const [detailedSummaries, setDetailedSummaries] = useState<DetailedSummaryData | null>(null)
  const [loadingDetailedSummaries, setLoadingDetailedSummaries] = useState(false)
  const [numPages, setNumPages] = useState(0)

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

      // Load projects from Supabase
      const { data: ownedProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      // Load shared projects (accepted invitations) where user can edit
      const { data: sharedAccess } = await supabase
        .from('project_shares')
        .select(`
          role,
          projects (*)
        `)
        .eq('shared_with_id', user.id)
        .eq('status', 'accepted')
        .in('role', ['editor']) // Only show projects user can edit in save modal

      const owned: Project[] = (ownedProjects || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        forms: p.forms || [],
        createdAt: p.created_at,
        owner_id: p.owner_id,
        role: 'owner' as const
      }))

      const shared: Project[] = (sharedAccess || [])
        .filter(s => s.projects)
        .map(s => ({
          id: (s.projects as any).id,
          name: (s.projects as any).name,
          description: (s.projects as any).description || '',
          forms: (s.projects as any).forms || [],
          createdAt: (s.projects as any).created_at,
          owner_id: (s.projects as any).owner_id,
          role: s.role as 'editor'
        }))

      setProjects([...owned, ...shared])

      // Check if projectId is in URL params
      const projectId = searchParams.get('projectId')
      if (projectId) {
        setSelectedProjectId(projectId)
      }

      // Check for PDF in sessionStorage (coming from project view)
      const storedPdf = sessionStorage.getItem('viewerPdfBase64')
      const storedSegments = sessionStorage.getItem('viewerSegments')
      if (storedPdf) {
        setPdfBase64(storedPdf)
        // Also load segments if available
        if (storedSegments) {
          try {
            const parsedSegments = JSON.parse(storedSegments)
            setSegments(parsedSegments)
          } catch (error) {
            console.error('Failed to parse stored segments:', error)
          }
        }
        // Clear after loading so it doesn't persist incorrectly
        sessionStorage.removeItem('viewerPdfBase64')
        sessionStorage.removeItem('viewerSegments')
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
          setNumPages(data.num_pages || 0)

          if (data.form_type) {
            setExtractedFields(prev => [
              { name: 'Form Type', value: data.form_type, type: 'text', confidence: 0.95 },
              ...prev
            ])
          }

          // Fetch AI summaries (both overall and detailed)
          fetchAiSummary(data.segments || [], file.name, aiServiceUrl)
          fetchDetailedSummaries(data.segments || [], file.name, data.num_pages || 0, aiServiceUrl)
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

  const fetchDetailedSummaries = async (segments: Segment[], filename: string, numPages: number, aiServiceUrl: string) => {
    setLoadingDetailedSummaries(true)
    setDetailedSummaries(null)

    try {
      const response = await fetch(`${aiServiceUrl}/summarize-form-detailed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segments: segments,
          filename: filename,
          num_pages: numPages
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDetailedSummaries({
            overall_summary: data.overall_summary,
            detailed_summaries: data.detailed_summaries,
            granularity: data.granularity
          })
        }
      }
    } catch (error) {
      console.error('Detailed summary fetch error:', error)
      // Silently fail - detailed summaries are optional
    } finally {
      setLoadingDetailedSummaries(false)
    }
  }

  const handleSegmentClick = (segment: Segment, index: number) => {
    setSelectedSegment(segment)
  }

  const handleSaveToProject = async () => {
    if (!formName.trim()) {
      alert('Please enter a form name')
      return
    }
    if (!selectedProjectId) {
      alert('Please select a project')
      return
    }

    setSaving(true)

    const formId = `form-${Date.now()}`
    const newForm: FormData = {
      formName: formName.trim(),
      purpose: formPurpose.trim() || 'Custom uploaded form',
      accessibility: formNotes.trim() || 'User uploaded document',
      isCustom: true,
      pdfBase64: pdfBase64 || undefined,
      segments: segments.length > 0 ? segments : undefined
    }

    // Get the current project from Supabase
    const { data: currentProject, error: fetchError } = await supabase
      .from('projects')
      .select('forms')
      .eq('id', selectedProjectId)
      .single()

    if (fetchError) {
      alert('Failed to load project. Please try again.')
      setSaving(false)
      return
    }

    // Update the project in Supabase
    const updatedForms = [...(currentProject.forms || []), newForm]
    const { error: updateError } = await supabase
      .from('projects')
      .update({ forms: updatedForms, updated_at: new Date().toISOString() })
      .eq('id', selectedProjectId)

    if (updateError) {
      alert('Failed to save form. Please try again.')
      setSaving(false)
      return
    }

    // Update local state
    setProjects(prev => prev.map(p =>
      p.id === selectedProjectId ? { ...p, forms: updatedForms } : p
    ))

    // Store embeddings in Supabase for RAG
    if (segments.length > 0 && user) {
      try {
        let aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001'
        if (aiServiceUrl && !aiServiceUrl.startsWith('http://') && !aiServiceUrl.startsWith('https://')) {
          aiServiceUrl = `https://${aiServiceUrl}`
        }

        await fetch(`${aiServiceUrl}/store-embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            project_id: selectedProjectId,
            form_id: formId,
            form_name: formName.trim(),
            segments: segments.map(s => ({
              text: s.text,
              type: s.type,
              page_number: s.page_number,
              is_pii: s.is_pii || false
            }))
          })
        })
      } catch (error) {
        console.error('Failed to store embeddings:', error)
        // Don't block saving - embeddings are optional enhancement
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

      const projectId = searchParams.get('projectId')

      // Use RAG chat if we have a project and user (semantic search)
      if (projectId && user) {
        // Also include current form segments for immediate context
        const currentFormContext = segments.slice(0, 300).map(s => {
          const piiMarker = s.is_pii ? ' [PII]' : ''
          return `[${s.type}${piiMarker}] ${s.text}`
        }).join('\n')

        const response = await fetch(`${aiServiceUrl}/rag-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            project_id: projectId,
            message: userMessage,
            history: chatMessages.slice(-10),
            current_form_context: currentFormContext  // Add current form segments
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.response) {
            let responseText = data.response
            // Add sources if available
            if (data.sources && data.sources.length > 0) {
              responseText += `\n\n*Sources: ${data.sources.join(', ')}*`
            }
            setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }])
          } else {
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
          }
        } else {
          setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, the AI service is unavailable. Please try again later.' }])
        }
      } else {
        // Fallback to regular chat with current form context only
        const formContext = segments.slice(0, 300).map(s => {
          const piiMarker = s.is_pii ? ' [PII]' : ''
          return `[${s.type}${piiMarker}] ${s.text}`
        }).join('\n')

        const response = await fetch(`${aiServiceUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            context: formContext,
            history: chatMessages.slice(-10)
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
        <div className="w-96 bg-white flex flex-col overflow-hidden">
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
                    <div className="text-sm text-gray-700 leading-relaxed">{renderMarkdown(aiSummary || '')}</div>
                  )}
                </div>
              )}

              {/* Detailed Summaries Section */}
              {(detailedSummaries || loadingDetailedSummaries) && (
                <div className="border-b">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="font-semibold text-purple-900 text-sm">
                        {detailedSummaries?.granularity === 'page' ? 'Page Summaries' : 'Section Summaries'}
                      </h3>
                    </div>
                    {loadingDetailedSummaries ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating detailed summaries...</span>
                      </div>
                    ) : (
                      <p className="text-xs text-purple-700">
                        {detailedSummaries?.detailed_summaries.length} {detailedSummaries?.granularity}
                        {(detailedSummaries?.detailed_summaries.length || 0) !== 1 ? 's' : ''} analyzed
                      </p>
                    )}
                  </div>

                  {detailedSummaries && !loadingDetailedSummaries && (
                    <div className="max-h-96 overflow-y-auto">
                      {detailedSummaries.detailed_summaries.map((detail) => (
                        <details key={detail.id} className="group border-b last:border-b-0">
                          <summary className="p-3 cursor-pointer hover:bg-purple-50/50 transition-colors flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{detail.title}</span>
                            <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>
                          <div className="px-3 pb-3 pt-1 bg-purple-50/30">
                            <div className="text-sm text-gray-700 leading-relaxed">{renderMarkdown(detail.summary)}</div>
                            <p className="text-xs text-gray-500 mt-2">
                              {detail.segment_ids.length} segment{detail.segment_ids.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </details>
                      ))}
                    </div>
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
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
