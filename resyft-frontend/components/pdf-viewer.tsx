'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { ZoomIn, ZoomOut, Upload, Highlighter, Type, Loader2 } from 'lucide-react'

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
  const [currentTool, setCurrentTool] = useState<'highlight' | 'textbox' | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())

  useEffect(() => {
    loadPDF()
  }, [pdfUrl, pdfBase64, scale])

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
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      let pdfData: ArrayBuffer | Uint8Array

      if (pdfBase64) {
        const binaryString = atob(pdfBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        pdfData = bytes
      } else if (pdfUrl) {
        const response = await fetch(pdfUrl)
        pdfData = await response.arrayBuffer()
      } else {
        return
      }

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

        const container = document.createElement('div')
        container.className = 'relative mb-4 shadow-lg'
        container.dataset.page = String(pageNum)

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvasRefs.current.set(pageNum, canvas)

        const context = canvas.getContext('2d')
        if (context) {
          await page.render({ canvasContext: context, viewport, canvas }).promise
        }

        container.appendChild(canvas)

        // Add segment overlays for this page
        const pageSegments = segments.filter(s => s.page_number === pageNum)
        pageSegments.forEach((segment, localIdx) => {
          const globalIdx = segments.indexOf(segment)
          const overlay = createSegmentOverlay(segment, viewport, globalIdx)
          container.appendChild(overlay)
        })

        viewerRef.current?.appendChild(container)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError('Failed to load PDF')
      setLoading(false)
    }
  }

  const createSegmentOverlay = (segment: Segment, viewport: any, index: number) => {
    const overlay = document.createElement('div')
    overlay.className = `absolute border-2 cursor-pointer transition-colors hover:bg-blue-100/30 ${
      selectedSegment === index ? 'bg-blue-200/40 border-blue-500' : 'border-blue-300/50'
    }`

    const scaleX = viewport.width / segment.page_width
    const scaleY = viewport.height / segment.page_height

    overlay.style.left = `${segment.left * scaleX}px`
    overlay.style.top = `${segment.top * scaleY}px`
    overlay.style.width = `${segment.width * scaleX}px`
    overlay.style.height = `${segment.height * scaleY}px`
    overlay.style.borderColor = getColorForType(segment.type)

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
      'Section header': '#4d6b8a',
      'Caption': '#7f8e9c',
      'Footnote': '#909fa9',
      'Form field': '#10b981',
      'Checkbox': '#8b5cf6',
      'Signature': '#f59e0b',
    }
    return colors[type] || '#6b8ca8'
  }

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5))

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
          variant={currentTool === 'textbox' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentTool(currentTool === 'textbox' ? null : 'textbox')}
        >
          <Type className="w-4 h-4 mr-1" />
          Note
        </Button>

        <div className="flex-1" />

        <span className="text-sm text-gray-500">
          {numPages > 0 ? `${numPages} pages` : ''}
        </span>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-200 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !pdfUrl && !pdfBase64 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Upload className="w-12 h-12 mb-4" />
            <p>No PDF loaded</p>
          </div>
        ) : (
          <div ref={viewerRef} className="flex flex-col items-center" />
        )}
      </div>
    </div>
  )
}
