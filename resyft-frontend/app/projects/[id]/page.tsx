'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import {
  ArrowLeft,
  Plus,
  FileText,
  Loader2,
  ExternalLink,
  Upload,
  X,
  Info,
  Trash2,
  Edit2
} from 'lucide-react'

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

// Form resources - where to find actual forms
const formResources: Record<string, { url: string; source: string }> = {
  "HIPAA Authorization Form": {
    url: "https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/access/index.html",
    source: "HHS.gov"
  },
  "COBRA Continuation Form": {
    url: "https://www.dol.gov/agencies/ebsa/laws-and-regulations/laws/cobra",
    source: "Department of Labor"
  },
  "Medicaid Application": {
    url: "https://www.healthcare.gov/medicaid-chip/getting-medicaid-chip/",
    source: "Healthcare.gov"
  },
  "Enrollment Change Form": {
    url: "https://www.medicare.gov/forms-help-resources/forms",
    source: "Medicare.gov"
  },
  "Disability Documentation Form": {
    url: "https://www.ssa.gov/forms/",
    source: "Social Security Administration"
  },
  "Income Verification Form": {
    url: "https://www.irs.gov/forms-instructions",
    source: "IRS.gov"
  },
  "Dependent Information Form": {
    url: "https://www.healthcare.gov/income-and-household-information/household-size/",
    source: "Healthcare.gov"
  }
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const projectId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Load project from localStorage
      const saved = localStorage.getItem('formfiller_projects')
      if (saved) {
        const projects: Project[] = JSON.parse(saved)
        const found = projects.find(p => p.id === projectId)
        if (found) {
          setProject(found)
        }
      }

      setLoading(false)
    }
    checkUser()
  }, [router, supabase, projectId])

  const getFormResource = (formName: string) => {
    return formResources[formName] || null
  }

  const handleDeleteForm = (formIndex: number) => {
    if (!project) return
    if (!confirm('Are you sure you want to remove this form from the project?')) return

    const updatedForms = project.forms.filter((_, idx) => idx !== formIndex)
    const updatedProject = { ...project, forms: updatedForms }
    setProject(updatedProject)

    // Update localStorage
    const saved = localStorage.getItem('formfiller_projects')
    if (saved) {
      const projects: Project[] = JSON.parse(saved)
      const idx = projects.findIndex(p => p.id === projectId)
      if (idx !== -1) {
        projects[idx] = updatedProject
        localStorage.setItem('formfiller_projects', JSON.stringify(projects))
      }
    }
  }

  const handleViewForm = (form: FormData) => {
    if (form.isCustom && form.pdfBase64) {
      // Store the PDF in sessionStorage and navigate to form viewer
      sessionStorage.setItem('viewerPdfBase64', form.pdfBase64)
      router.push('/forms/new')
    } else {
      setSelectedForm(form)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-[var(--font-inter)]">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Project not found</h2>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[var(--font-inter)]">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
              <p className="text-xs text-gray-500">{project.forms.length} forms</p>
            </div>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push(`/forms/new?projectId=${projectId}`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Form
          </Button>
        </div>
      </header>

      {/* Project Description */}
      <div className="bg-white border-b px-6 py-4">
        <p className="text-sm text-gray-600 max-w-3xl">{project.description}</p>
        <p className="text-xs text-gray-400 mt-2">
          Created on {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Forms Grid */}
      <main className="p-6">
        {project.forms.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No forms in this project</h2>
            <p className="text-gray-500 mb-6">
              Add forms to organize your documents
            </p>
            <Button
              onClick={() => router.push(`/forms/new?projectId=${projectId}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Form
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.forms.map((form, idx) => (
              <Card
                key={idx}
                className="hover:shadow-md transition-shadow group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleViewForm(form)}
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {form.formName}
                        </h3>
                        {form.isCustom && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Uploaded
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{form.purpose}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteForm(idx)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove from project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <p className="text-xs text-blue-600">
                      {form.accessibility}
                    </p>
                    {!form.isCustom && getFormResource(form.formName) && (
                      <a
                        href={getFormResource(form.formName)?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Open resource"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Form Details Modal */}
      {selectedForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedForm.formName}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedForm.purpose}</p>
              </div>
              <button
                onClick={() => setSelectedForm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Form Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">About This Form</h3>
                <p className="text-sm text-blue-800">{selectedForm.accessibility}</p>
              </div>

              {/* Where to Find */}
              {getFormResource(selectedForm.formName) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Where to Get This Form</h3>
                  <a
                    href={getFormResource(selectedForm.formName)?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {getFormResource(selectedForm.formName)?.source}
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm text-gray-600">
                  Already have this form? Upload it to analyze and highlight important fields.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedForm(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedForm(null)
                      router.push(`/forms/new?projectId=${projectId}`)
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Form
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
