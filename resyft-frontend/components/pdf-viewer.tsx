'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { ZoomIn, ZoomOut, Upload, Highlighter, Type, Loader2, AlertTriangle, X, Download, StickyNote, TextCursor } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

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
  field_name?: string
  field_type?: string
}

interface Annotation {
  id: string
  type: 'highlight' | 'note'
  style?: 'sticky' | 'textbox'
  page: number
  x: number
  y: number
  width: number
  height: number
  color?: string
  text?: string
}

interface FormFieldValue {
  fieldName: string
  value: string
  type: string
}

interface PDFViewerProps {
  pdfUrl?: string
  pdfBase64?: string
  segments?: Segment[]
  onSegmentClick?: (segment: Segment, index: number) => void
}

export function PDFViewer({ pdfUrl, pdfBase64, segments = [], onSegmentClick }: PDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1.5)
  const [numPages, setNumPages] = useState(0)
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null)
  const [currentTool, setCurrentTool] = useState<'highlight' | 'note-sticky' | 'note-textbox' | null>(null)
  const [showPiiOnly, setShowPiiOnly] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number; page: number } | null>(null)
  const [formFieldValues, setFormFieldValues] = useState<Map<string, string>>(new Map())
  const [savingPdf, setSavingPdf] = useState(false)
  const viewerRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const pageViewports = useRef<Map<number, any>>(new Map())
  const originalPdfBytes = useRef<Uint8Array | null>(null)

  // Count PII segments
  const piiCount = segments.filter(s => s.is_pii).length

  useEffect(() => {
    loadPDF()
  }, [pdfUrl, pdfBase64, scale, segments, showPiiOnly])

  const loadPDF = async () => {
    if (!pdfUrl && !pdfBase64) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Dynamically import pdf.js
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      let pdfData: Uint8Array

      if (pdfBase64) {
        const binaryString = atob(pdfBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        pdfData = bytes
      } else if (pdfUrl) {
        const response = await fetch(pdfUrl)
        pdfData = new Uint8Array(await response.arrayBuffer())
      } else {
        return
      }

      // Store original PDF bytes for later modification
      originalPdfBytes.current = pdfData

      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
      setNumPages(pdf.numPages)

      // Clear viewer
      if (viewerRef.current) {
        viewerRef.current.innerHTML = ''
      }

      // Render each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale })
        pageViewports.current.set(pageNum, viewport)

        const container = document.createElement('div')
        container.className = 'relative mb-4 shadow-lg bg-white'
        container.dataset.page = String(pageNum)
        container.style.width = `${viewport.width}px`
        container.style.height = `${viewport.height}px`

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.display = 'block'
        canvasRefs.current.set(pageNum, canvas)

        const context = canvas.getContext('2d')
        if (context) {
          await page.render({ canvasContext: context, viewport, canvas }).promise
        }

        container.appendChild(canvas)

        // Add segment overlays for this page
        const pageSegments = segments.filter(s => s.page_number === pageNum)
        pageSegments.forEach((segment) => {
          // Skip non-PII if showPiiOnly is enabled
          if (showPiiOnly && !segment.is_pii) return

          const globalIdx = segments.indexOf(segment)
          const overlay = createSegmentOverlay(segment, viewport, globalIdx)
          container.appendChild(overlay)
        })

        // Add annotation layer for this page
        const annotationLayer = document.createElement('div')
        annotationLayer.className = 'absolute inset-0 pointer-events-none'
        annotationLayer.dataset.annotationLayer = String(pageNum)
        container.appendChild(annotationLayer)

        viewerRef.current?.appendChild(container)
      }

      // Render existing annotations
      renderAnnotations()

      setLoading(false)
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError('Failed to load PDF')
      setLoading(false)
    }
  }

  const createSegmentOverlay = (segment: Segment, viewport: any, index: number) => {
    const overlay = document.createElement('div')
    const isPii = segment.is_pii
    const isFormField = segment.type === 'Form Field' || segment.type === 'Checkbox' || segment.type === 'Dropdown'

    const scaleX = viewport.width / segment.page_width
    const scaleY = viewport.height / segment.page_height

    overlay.style.left = `${segment.left * scaleX}px`
    overlay.style.top = `${segment.top * scaleY}px`
    overlay.style.width = `${segment.width * scaleX}px`
    overlay.style.height = `${segment.height * scaleY}px`

    // Form fields get special treatment with input overlays
    if (isFormField) {
      overlay.className = 'absolute'

      if (segment.type === 'Checkbox') {
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.className = 'w-full h-full cursor-pointer accent-blue-600'
        checkbox.title = segment.text
        const fieldKey = `${segment.page_number}-${segment.left}-${segment.top}`
        checkbox.checked = formFieldValues.get(fieldKey) === 'true'
        checkbox.onchange = (e) => {
          const target = e.target as HTMLInputElement
          handleFormFieldChange(fieldKey, target.checked ? 'true' : 'false')
        }
        overlay.appendChild(checkbox)
      } else {
        const input = document.createElement('input')
        input.type = 'text'
        input.className = 'w-full h-full px-1 text-sm bg-blue-50/80 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white'
        input.placeholder = segment.text.split(':')[0] || 'Enter value...'
        const fieldKey = `${segment.page_number}-${segment.left}-${segment.top}`
        input.value = formFieldValues.get(fieldKey) || ''
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement
          handleFormFieldChange(fieldKey, target.value)
        }
        input.onclick = (e) => e.stopPropagation()
        overlay.appendChild(input)
      }
      return overlay
    }

    // PII segments get red highlighting, others get blue
    if (isPii) {
      overlay.className = `absolute border-2 cursor-pointer transition-colors bg-red-200/40 border-red-500 hover:bg-red-300/50 ${
        selectedSegment === index ? 'bg-red-300/60 border-red-600' : ''
      }`
    } else {
      overlay.className = `absolute border-2 cursor-pointer transition-colors hover:bg-blue-100/30 ${
        selectedSegment === index ? 'bg-blue-200/40 border-blue-500' : 'border-blue-300/50'
      }`
    }

    // PII gets red border, others get type-based color
    if (!isPii) {
      overlay.style.borderColor = getColorForType(segment.type)
    }

    // Add PII indicator icon
    if (isPii) {
      const icon = document.createElement('div')
      icon.className = 'absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold'
      icon.innerHTML = '!'
      icon.title = 'Personal Information Detected'
      overlay.appendChild(icon)
    }

    overlay.onclick = () => {
      setSelectedSegment(index)
      onSegmentClick?.(segment, index)
    }

    return overlay
  }

  const getColorForType = (type: string): string => {
    const colors: Record<string, string> = {
      'Title': '#5b7a9e',
      'Text': '#6b8ca8',
      'Table': '#7d95aa',
      'Picture': '#8fa0ad',
      'Formula': '#a45860',
      'List item': '#95a5b0',
      'Section Header': '#4d6b8a',
      'Section header': '#4d6b8a',
      'Caption': '#7f8e9c',
      'Footnote': '#909fa9',
      'Form Field': '#10b981',
      'Form field': '#10b981',
      'Checkbox': '#8b5cf6',
      'Signature': '#f59e0b',
      'Label': '#0ea5e9',
      'Instructions': '#64748b',
      'Dropdown': '#a855f7',
    }
    return colors[type] || '#6b8ca8'
  }

  const handleFormFieldChange = (fieldKey: string, value: string) => {
    setFormFieldValues(prev => {
      const newMap = new Map(prev)
      newMap.set(fieldKey, value)
      return newMap
    })
  }

  const downloadFilledPdf = async () => {
    if (!originalPdfBytes.current) {
      alert('No PDF loaded')
      return
    }

    setSavingPdf(true)
    try {
      const pdfDoc = await PDFDocument.load(originalPdfBytes.current)
      const form = pdfDoc.getForm()
      const fields = form.getFields()

      // Try to fill form fields
      let filledCount = 0
      fields.forEach(field => {
        const fieldName = field.getName()
        // Find matching value from our form field values
        formFieldValues.forEach((value, key) => {
          if (value && value.trim()) {
            try {
              const textField = form.getTextField(fieldName)
              if (textField) {
                textField.setText(value)
                filledCount++
              }
            } catch {
              // Field might not be a text field
              try {
                const checkBox = form.getCheckBox(fieldName)
                if (checkBox && value === 'true') {
                  checkBox.check()
                  filledCount++
                }
              } catch {
                // Ignore if field type doesn't match
              }
            }
          }
        })
      })

      // If no AcroForm fields, add text annotations for our values
      if (fields.length === 0 && formFieldValues.size > 0) {
        const pages = pdfDoc.getPages()
        // Add text at form field positions
        segments.forEach(segment => {
          if (segment.type === 'Form Field' || segment.type === 'Checkbox') {
            const fieldKey = `${segment.page_number}-${segment.left}-${segment.top}`
            const value = formFieldValues.get(fieldKey)
            if (value && segment.page_number <= pages.length) {
              const page = pages[segment.page_number - 1]
              const { height } = page.getSize()
              // PDF coordinates are from bottom-left
              page.drawText(value, {
                x: segment.left + 2,
                y: height - segment.top - segment.height + 2,
                size: Math.min(segment.height - 4, 12),
              })
              filledCount++
            }
          }
        })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'filled-form.pdf'
      a.click()
      URL.revokeObjectURL(url)

      if (filledCount === 0 && formFieldValues.size > 0) {
        alert('Form values saved, but this PDF may not support editable fields. The values have been added as text overlays.')
      }
    } catch (err) {
      console.error('Error saving PDF:', err)
      alert('Failed to save PDF. Try exporting the data instead.')
    } finally {
      setSavingPdf(false)
    }
  }

  const exportFormData = () => {
    const data: Record<string, string> = {}
    formFieldValues.forEach((value, key) => {
      data[key] = value
    })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'form-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5))

  const renderAnnotations = () => {
    annotations.forEach(annotation => {
      const layer = viewerRef.current?.querySelector(`[data-annotation-layer="${annotation.page}"]`)
      if (!layer) return

      // Check if already rendered
      if (layer.querySelector(`[data-annotation-id="${annotation.id}"]`)) return

      const el = document.createElement('div')
      el.dataset.annotationId = annotation.id
      el.className = 'absolute pointer-events-auto'
      el.style.left = `${annotation.x}px`
      el.style.top = `${annotation.y}px`
      el.style.width = `${annotation.width}px`
      el.style.height = `${annotation.height}px`

      if (annotation.type === 'highlight') {
        el.className += ' bg-yellow-300/50 border border-yellow-400 cursor-pointer hover:bg-yellow-400/50'
        el.onclick = () => {
          if (confirm('Delete this highlight?')) {
            deleteAnnotation(annotation.id)
          }
        }
      } else if (annotation.type === 'note') {
        if (annotation.style === 'textbox') {
          // Clear textbox style - minimal, like a text input
          el.className += ' bg-white/90 border border-gray-300 rounded cursor-text'
          el.style.minWidth = '120px'
          el.style.minHeight = '24px'
          el.style.padding = '4px 8px'
          el.innerHTML = `
            <div class="flex items-center gap-1">
              <input type="text" class="flex-1 text-sm bg-transparent border-none outline-none note-input"
                     placeholder="Type here..." value="${annotation.text || ''}" />
              <button class="text-gray-400 hover:text-red-500 delete-btn flex-shrink-0" title="Delete">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          `
          const deleteBtn = el.querySelector('.delete-btn')
          deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation()
            deleteAnnotation(annotation.id)
          })
          const noteInput = el.querySelector('.note-input') as HTMLInputElement
          noteInput?.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement
            updateAnnotationText(annotation.id, target.value)
          })
        } else {
          // Sticky note style - colorful with header
          el.className += ' bg-yellow-100 border-2 border-yellow-400 rounded shadow-lg cursor-pointer'
          el.style.minWidth = '150px'
          el.style.minHeight = '80px'
          el.style.padding = '8px'
          el.innerHTML = `
            <div class="flex justify-between items-start mb-1">
              <span class="text-xs font-semibold text-yellow-700">Note</span>
              <button class="text-gray-400 hover:text-red-500 delete-btn" title="Delete note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="text-sm text-gray-700 note-text" contenteditable="true">${annotation.text || 'Click to add note...'}</div>
          `
          const deleteBtn = el.querySelector('.delete-btn')
          deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation()
            deleteAnnotation(annotation.id)
          })
          const noteText = el.querySelector('.note-text')
          noteText?.addEventListener('blur', (e) => {
            const target = e.target as HTMLElement
            updateAnnotationText(annotation.id, target.innerText)
          })
        }
      }

      layer.appendChild(el)
    })
  }

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id))
    const el = viewerRef.current?.querySelector(`[data-annotation-id="${id}"]`)
    el?.remove()
  }

  const updateAnnotationText = (id: string, text: string) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, text } : a))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentTool) return

    const target = e.target as HTMLElement
    const container = target.closest('[data-page]')
    if (!container) return

    const pageNum = parseInt(container.getAttribute('data-page') || '0')
    if (!pageNum) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (currentTool === 'note-sticky') {
      // Sticky note - larger, colorful
      const newAnnotation: Annotation = {
        id: `note-${Date.now()}`,
        type: 'note',
        style: 'sticky',
        page: pageNum,
        x,
        y,
        width: 180,
        height: 100,
        text: ''
      }
      setAnnotations(prev => [...prev, newAnnotation])
      setTimeout(() => renderAnnotations(), 0)
      setCurrentTool(null)
    } else if (currentTool === 'note-textbox') {
      // Textbox - minimal, clear style
      const newAnnotation: Annotation = {
        id: `note-${Date.now()}`,
        type: 'note',
        style: 'textbox',
        page: pageNum,
        x,
        y,
        width: 150,
        height: 28,
        text: ''
      }
      setAnnotations(prev => [...prev, newAnnotation])
      setTimeout(() => renderAnnotations(), 0)
      setCurrentTool(null)
    } else if (currentTool === 'highlight') {
      setIsDrawing(true)
      setDrawStart({ x, y, page: pageNum })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || currentTool !== 'highlight') return

    const container = viewerRef.current?.querySelector(`[data-page="${drawStart.page}"]`)
    if (!container) return

    const rect = container.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    // Show preview
    let preview = container.querySelector('.highlight-preview') as HTMLElement
    if (!preview) {
      preview = document.createElement('div')
      preview.className = 'highlight-preview absolute bg-yellow-300/30 border border-yellow-400 pointer-events-none'
      container.appendChild(preview)
    }

    const x = Math.min(drawStart.x, currentX)
    const y = Math.min(drawStart.y, currentY)
    const width = Math.abs(currentX - drawStart.x)
    const height = Math.abs(currentY - drawStart.y)

    preview.style.left = `${x}px`
    preview.style.top = `${y}px`
    preview.style.width = `${width}px`
    preview.style.height = `${height}px`
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) {
      setIsDrawing(false)
      setDrawStart(null)
      return
    }

    const container = viewerRef.current?.querySelector(`[data-page="${drawStart.page}"]`)
    if (!container) {
      setIsDrawing(false)
      setDrawStart(null)
      return
    }

    // Remove preview
    container.querySelector('.highlight-preview')?.remove()

    const rect = container.getBoundingClientRect()
    const endX = e.clientX - rect.left
    const endY = e.clientY - rect.top

    const x = Math.min(drawStart.x, endX)
    const y = Math.min(drawStart.y, endY)
    const width = Math.abs(endX - drawStart.x)
    const height = Math.abs(endY - drawStart.y)

    // Only create if dragged a meaningful distance
    if (width > 10 && height > 10) {
      const newAnnotation: Annotation = {
        id: `highlight-${Date.now()}`,
        type: 'highlight',
        page: drawStart.page,
        x,
        y,
        width,
        height
      }
      setAnnotations(prev => [...prev, newAnnotation])
      setTimeout(() => renderAnnotations(), 0)
    }

    setIsDrawing(false)
    setDrawStart(null)
  }

  // Re-render annotations when they change
  useEffect(() => {
    if (!loading && annotations.length > 0) {
      renderAnnotations()
    }
  }, [annotations, loading])

  // ESC key to cancel tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentTool) {
        setCurrentTool(null)
        setIsDrawing(false)
        setDrawStart(null)
        viewerRef.current?.querySelector('.highlight-preview')?.remove()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTool])

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-100 border-b">
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-gray-600 min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>

        <div className="h-6 w-px bg-gray-300 mx-2" />

        <Button
          variant={currentTool === 'highlight' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentTool(currentTool === 'highlight' ? null : 'highlight')}
        >
          <Highlighter className="w-4 h-4 mr-1" />
          Highlight
        </Button>
        <Button
          variant={currentTool === 'note-sticky' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentTool(currentTool === 'note-sticky' ? null : 'note-sticky')}
          className={currentTool === 'note-sticky' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
        >
          <StickyNote className="w-4 h-4 mr-1" />
          Sticky
        </Button>
        <Button
          variant={currentTool === 'note-textbox' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentTool(currentTool === 'note-textbox' ? null : 'note-textbox')}
        >
          <TextCursor className="w-4 h-4 mr-1" />
          Text
        </Button>

        <div className="h-6 w-px bg-gray-300 mx-2" />

        {/* PII Filter Toggle */}
        {piiCount > 0 && (
          <Button
            variant={showPiiOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowPiiOnly(!showPiiOnly)}
            className={showPiiOnly ? 'bg-red-500 hover:bg-red-600' : 'text-red-600 border-red-300 hover:bg-red-50'}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            PII ({piiCount})
          </Button>
        )}

        <div className="h-6 w-px bg-gray-300 mx-2" />

        {/* Download Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={downloadFilledPdf}
          disabled={savingPdf || !pdfBase64}
          className="text-green-600 border-green-300 hover:bg-green-50"
        >
          {savingPdf ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1" />
          )}
          Download
        </Button>

        <div className="flex-1" />

        <span className="text-sm text-gray-500">
          {numPages > 0 ? `${numPages} pages` : ''}
        </span>
      </div>

      {/* PII Warning Banner */}
      {piiCount > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">
            <strong>{piiCount} personal information field{piiCount > 1 ? 's' : ''}</strong> detected in this form.
            Fields highlighted in <span className="text-red-600 font-semibold">red</span> may contain sensitive data.
          </span>
        </div>
      )}

      {/* Tool hint */}
      {currentTool && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2">
          <span className="text-sm text-blue-700">
            {currentTool === 'highlight'
              ? 'Click and drag to create a highlight. Press ESC or click the button again to cancel.'
              : currentTool === 'note-sticky'
              ? 'Click anywhere to add a sticky note. Press ESC to cancel.'
              : 'Click anywhere to add a text box. Press ESC to cancel.'}
          </span>
        </div>
      )}

      {/* PDF Content */}
      <div
        className={`flex-1 overflow-auto bg-gray-200 p-4 relative ${currentTool === 'highlight' ? 'cursor-crosshair' : currentTool ? 'cursor-cell' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDrawing) {
            viewerRef.current?.querySelector('.highlight-preview')?.remove()
            setIsDrawing(false)
            setDrawStart(null)
          }
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
        {!pdfUrl && !pdfBase64 && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <Upload className="w-12 h-12 mb-4" />
            <p>No PDF loaded</p>
          </div>
        )}
        <div ref={viewerRef} className="flex flex-col items-center min-h-full" />
      </div>
    </div>
  )
}
