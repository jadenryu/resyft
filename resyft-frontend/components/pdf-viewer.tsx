'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { ZoomIn, ZoomOut, Upload, Highlighter, Loader2, AlertTriangle, X, StickyNote, TextCursor } from 'lucide-react'

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
  const [selectedAnnotation, setSelectedAnnotation] = useState<{ id: string; x: number; y: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number; page: number } | null>(null)
  const [draggingAnnotation, setDraggingAnnotation] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)
  const [formFieldValues, setFormFieldValues] = useState<Map<string, string>>(new Map())
  const viewerRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const pageViewports = useRef<Map<number, any>>(new Map())
  const originalPdfBytes = useRef<Uint8Array | null>(null)
  const renderIdRef = useRef<number>(0)
  const isRenderingRef = useRef<boolean>(false)

  // Count PII segments
  const piiCount = segments.filter(s => s.is_pii).length

  // Separate effect for PDF rendering (only on PDF/scale change)
  useEffect(() => {
    renderPDF()
  }, [pdfUrl, pdfBase64, scale])

  // Separate effect for segment overlays (updates without re-rendering PDF)
  // Use a small delay to ensure PDF rendering has completed
  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewerRef.current && segments.length > 0) {
        updateSegmentOverlays()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [segments, showPiiOnly, selectedSegment])

  const renderPDF = async () => {
    if (!pdfUrl && !pdfBase64) {
      setLoading(false)
      return
    }

    // Prevent concurrent renders
    if (isRenderingRef.current) return
    isRenderingRef.current = true

    const currentRenderId = ++renderIdRef.current

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
        isRenderingRef.current = false
        return
      }

      // Check if this render is still valid
      if (currentRenderId !== renderIdRef.current) {
        isRenderingRef.current = false
        return
      }

      // Store original PDF bytes for later modification
      originalPdfBytes.current = pdfData

      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise

      // Check again after async operation
      if (currentRenderId !== renderIdRef.current) {
        isRenderingRef.current = false
        return
      }

      setNumPages(pdf.numPages)

      // Clear viewer
      if (viewerRef.current) {
        viewerRef.current.innerHTML = ''
      }
      canvasRefs.current.clear()
      pageViewports.current.clear()

      // Render each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        // Check if render was cancelled
        if (currentRenderId !== renderIdRef.current) {
          isRenderingRef.current = false
          return
        }

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

        // Add segment overlays container for this page (pointer-events-none, children will be auto)
        const segmentLayer = document.createElement('div')
        segmentLayer.className = 'absolute inset-0 pointer-events-none z-10'
        segmentLayer.dataset.segmentLayer = String(pageNum)
        container.appendChild(segmentLayer)

        // Add annotation layer for this page (z-20 to be above segment layer z-10)
        const annotationLayer = document.createElement('div')
        annotationLayer.className = 'absolute inset-0 pointer-events-none z-20'
        annotationLayer.dataset.annotationLayer = String(pageNum)
        container.appendChild(annotationLayer)

        viewerRef.current?.appendChild(container)
      }

      // Add segment overlays after pages are rendered
      updateSegmentOverlays()

      // Render existing annotations
      renderAnnotations()

      setLoading(false)
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError('Failed to load PDF')
      setLoading(false)
    } finally {
      isRenderingRef.current = false
    }
  }

  const updateSegmentOverlays = () => {
    if (!viewerRef.current) return

    // Clear existing segment overlays
    const segmentLayers = viewerRef.current.querySelectorAll('[data-segment-layer]')
    segmentLayers.forEach(layer => {
      layer.innerHTML = ''
    })

    // Add segment overlays for each page
    segments.forEach((segment, globalIdx) => {
      if (showPiiOnly && !segment.is_pii) return

      const viewport = pageViewports.current.get(segment.page_number)
      if (!viewport) return

      const segmentLayer = viewerRef.current?.querySelector(`[data-segment-layer="${segment.page_number}"]`)
      if (!segmentLayer) return

      const overlay = createSegmentOverlay(segment, viewport, globalIdx)
      segmentLayer.appendChild(overlay)
    })
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
      overlay.className = 'absolute pointer-events-auto'

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

    // PII segments are ALWAYS visible with red highlight
    // Regular segments are hidden by default, only show when selected
    if (isPii) {
      // PII always visible with red background/border
      overlay.className = `absolute pointer-events-auto cursor-pointer transition-all duration-200 bg-red-200/50 border-2 border-red-500 ${
        selectedSegment === index ? 'bg-red-300/60 ring-2 ring-red-400' : ''
      }`

      // Always show PII indicator icon
      const icon = document.createElement('div')
      icon.className = 'absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold z-10'
      icon.innerHTML = '!'
      icon.title = 'Personal Information Detected'
      overlay.appendChild(icon)
    } else {
      // Regular segments - subtle dotted border for visibility, stronger on hover/select
      overlay.className = `absolute pointer-events-auto cursor-pointer transition-all duration-200 ${
        selectedSegment === index
          ? 'bg-blue-200/40 border-2 border-blue-500'
          : 'border border-dashed border-gray-300/50 hover:border-blue-400 hover:bg-blue-50/30'
      }`
    }

    // Store segment index for identification
    overlay.dataset.segmentIndex = String(index)

    overlay.onclick = (e) => {
      e.stopPropagation()
      setSelectedSegment(selectedSegment === index ? null : index)
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

      // Add drag handle for all annotation types
      const addDragBehavior = (element: HTMLElement, handleEl?: HTMLElement) => {
        const dragTarget = handleEl || element
        dragTarget.style.cursor = 'grab'

        dragTarget.addEventListener('mousedown', (e: MouseEvent) => {
          if ((e.target as HTMLElement).closest('.delete-btn, .note-input, .note-text, input')) return
          e.preventDefault()
          e.stopPropagation()
          dragTarget.style.cursor = 'grabbing'
          setDraggingAnnotation({
            id: annotation.id,
            startX: e.clientX,
            startY: e.clientY,
            origX: annotation.x,
            origY: annotation.y
          })
        })
      }

      if (annotation.type === 'highlight') {
        const color = annotation.color || 'yellow'
        const colorClasses: Record<string, string> = {
          yellow: 'bg-yellow-300/50 border-yellow-400 hover:bg-yellow-400/50',
          green: 'bg-green-300/50 border-green-400 hover:bg-green-400/50',
          blue: 'bg-blue-300/50 border-blue-400 hover:bg-blue-400/50',
          pink: 'bg-pink-300/50 border-pink-400 hover:bg-pink-400/50',
          orange: 'bg-orange-300/50 border-orange-400 hover:bg-orange-400/50',
        }
        el.className += ` ${colorClasses[color] || colorClasses.yellow} border cursor-grab`
        el.onclick = (e) => {
          e.stopPropagation()
          const rect = el.getBoundingClientRect()
          setSelectedAnnotation({
            id: annotation.id,
            x: rect.left + rect.width / 2,
            y: rect.top
          })
        }
        addDragBehavior(el)
      } else if (annotation.type === 'note') {
        if (annotation.style === 'textbox') {
          // Clear textbox style - hidden by default, shows on focus
          el.className += ' bg-transparent rounded cursor-grab group'
          el.style.minWidth = '120px'
          el.style.minHeight = '24px'
          el.style.padding = '4px 8px'
          el.innerHTML = `
            <div class="flex items-center gap-1">
              <input type="text" class="flex-1 text-sm bg-transparent border-none outline-none note-input peer"
                     placeholder="Type here..." value="${annotation.text || ''}" />
              <button class="text-gray-400 hover:text-red-500 delete-btn flex-shrink-0 opacity-0 peer-focus:opacity-100 group-hover:opacity-100 transition-opacity" title="Delete">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          `
          // Add border classes that show on hover/focus
          el.style.border = '1px solid transparent'
          el.addEventListener('mouseenter', () => {
            el.style.border = '1px solid #d1d5db'
            el.style.background = 'rgba(255,255,255,0.9)'
          })
          el.addEventListener('mouseleave', () => {
            if (document.activeElement !== el.querySelector('.note-input')) {
              el.style.border = '1px solid transparent'
              el.style.background = 'transparent'
            }
          })
          const noteInput = el.querySelector('.note-input') as HTMLInputElement
          noteInput?.addEventListener('focus', () => {
            el.style.border = '1px solid #3b82f6'
            el.style.background = 'rgba(255,255,255,0.95)'
          })
          noteInput?.addEventListener('blur', () => {
            el.style.border = '1px solid transparent'
            el.style.background = 'transparent'
          })
          const deleteBtn = el.querySelector('.delete-btn')
          deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation()
            deleteAnnotation(annotation.id)
          })
          noteInput?.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement
            updateAnnotationText(annotation.id, target.value)
          })
          addDragBehavior(el)
        } else {
          // Sticky note style - colorful with header that hides when typing
          el.className += ' bg-yellow-100 border-2 border-yellow-400 rounded shadow-lg'
          el.style.minWidth = '150px'
          el.style.minHeight = '80px'
          el.style.padding = '8px'
          const hasText = annotation.text && annotation.text.trim() !== ''
          el.innerHTML = `
            <div class="note-header flex justify-between items-start mb-1 cursor-grab ${hasText ? 'hidden' : ''}">
              <span class="text-xs font-semibold text-yellow-700">Note</span>
              <button class="text-gray-400 hover:text-red-500 delete-btn" title="Delete note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <button class="delete-btn-floating absolute top-1 right-1 text-gray-400 hover:text-red-500 ${hasText ? '' : 'hidden'}" title="Delete note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <div class="text-sm text-gray-700 note-text outline-none ${hasText ? '' : 'text-gray-400'}" contenteditable="true">${hasText ? annotation.text : 'Click to add note...'}</div>
          `
          el.style.position = 'relative'
          const deleteBtn = el.querySelector('.delete-btn')
          const deleteBtnFloating = el.querySelector('.delete-btn-floating')
          deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation()
            deleteAnnotation(annotation.id)
          })
          deleteBtnFloating?.addEventListener('click', (e) => {
            e.stopPropagation()
            deleteAnnotation(annotation.id)
          })
          const noteText = el.querySelector('.note-text') as HTMLElement
          const noteHeader = el.querySelector('.note-header') as HTMLElement
          noteText?.addEventListener('focus', () => {
            if (noteText.innerText === 'Click to add note...') {
              noteText.innerText = ''
              noteText.classList.remove('text-gray-400')
            }
            noteHeader?.classList.add('hidden')
            deleteBtnFloating?.classList.remove('hidden')
          })
          noteText?.addEventListener('blur', (e) => {
            const target = e.target as HTMLElement
            const text = target.innerText.trim()
            if (!text) {
              noteText.innerText = 'Click to add note...'
              noteText.classList.add('text-gray-400')
              noteHeader?.classList.remove('hidden')
              deleteBtnFloating?.classList.add('hidden')
            }
            updateAnnotationText(annotation.id, text)
          })
          // Add drag behavior to header or whole element
          addDragBehavior(el, noteHeader || el)
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

  const updateAnnotationColor = (id: string, color: string) => {
    // Update the DOM element's classes directly for immediate feedback
    const el = viewerRef.current?.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement
    if (el) {
      const colorClasses: Record<string, string> = {
        yellow: 'bg-yellow-300/50 border-yellow-400 hover:bg-yellow-400/50',
        green: 'bg-green-300/50 border-green-400 hover:bg-green-400/50',
        blue: 'bg-blue-300/50 border-blue-400 hover:bg-blue-400/50',
        pink: 'bg-pink-300/50 border-pink-400 hover:bg-pink-400/50',
        orange: 'bg-orange-300/50 border-orange-400 hover:bg-orange-400/50',
      }
      // Remove old color classes and add new ones
      el.className = `absolute pointer-events-auto ${colorClasses[color] || colorClasses.yellow} border cursor-pointer`
    }

    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, color } : a))
    setSelectedAnnotation(null)
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

  // Handle annotation dragging
  useEffect(() => {
    if (!draggingAnnotation) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - draggingAnnotation.startX
      const dy = e.clientY - draggingAnnotation.startY
      const newX = draggingAnnotation.origX + dx
      const newY = draggingAnnotation.origY + dy

      // Update DOM element position immediately for smooth dragging
      const el = viewerRef.current?.querySelector(`[data-annotation-id="${draggingAnnotation.id}"]`) as HTMLElement
      if (el) {
        el.style.left = `${newX}px`
        el.style.top = `${newY}px`
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      const dx = e.clientX - draggingAnnotation.startX
      const dy = e.clientY - draggingAnnotation.startY
      const newX = draggingAnnotation.origX + dx
      const newY = draggingAnnotation.origY + dy

      // Update state with final position
      setAnnotations(prev => prev.map(a =>
        a.id === draggingAnnotation.id ? { ...a, x: newX, y: newY } : a
      ))

      // Reset cursor
      const el = viewerRef.current?.querySelector(`[data-annotation-id="${draggingAnnotation.id}"]`) as HTMLElement
      if (el) {
        el.style.cursor = 'grab'
      }

      setDraggingAnnotation(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingAnnotation])

  // Toggle segment overlay pointer-events based on current tool
  // When a tool is active, overlays become click-through so annotations can be placed
  useEffect(() => {
    const segmentLayers = viewerRef.current?.querySelectorAll('[data-segment-layer]')
    segmentLayers?.forEach(layer => {
      const overlays = layer.querySelectorAll('[data-segment-index]')
      overlays.forEach(overlay => {
        if (currentTool) {
          (overlay as HTMLElement).style.pointerEvents = 'none'
        } else {
          (overlay as HTMLElement).style.pointerEvents = 'auto'
        }
      })
    })
  }, [currentTool])

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full font-[var(--font-inter)]">
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

      {/* Annotation Options Popover */}
      {selectedAnnotation && (
        <>
          {/* Backdrop to close popover */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSelectedAnnotation(null)}
          />
          {/* Popover */}
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px]"
            style={{
              left: Math.min(selectedAnnotation.x - 100, window.innerWidth - 220),
              top: Math.max(selectedAnnotation.y - 120, 10),
            }}
          >
            <div className="text-xs font-medium text-gray-500 mb-2">Highlight Color</div>
            <div className="flex gap-2 mb-3">
              {[
                { name: 'yellow', class: 'bg-yellow-400' },
                { name: 'green', class: 'bg-green-400' },
                { name: 'blue', class: 'bg-blue-400' },
                { name: 'pink', class: 'bg-pink-400' },
                { name: 'orange', class: 'bg-orange-400' },
              ].map(color => (
                <button
                  key={color.name}
                  className={`w-7 h-7 rounded-full ${color.class} hover:ring-2 hover:ring-offset-1 hover:ring-gray-400 transition-all`}
                  onClick={() => updateAnnotationColor(selectedAnnotation.id, color.name)}
                  title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                />
              ))}
            </div>
            <div className="border-t pt-2">
              <button
                className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2"
                onClick={() => {
                  deleteAnnotation(selectedAnnotation.id)
                  setSelectedAnnotation(null)
                }}
              >
                <X className="w-4 h-4" />
                Delete Highlight
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
