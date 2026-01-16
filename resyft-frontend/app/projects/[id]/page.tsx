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
  Edit2,
  Share2,
  Users,
  Mail,
  Check,
  AlertCircle
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

interface FormData {
  formName: string
  purpose: string
  accessibility: string
  isCustom?: boolean
  pdfBase64?: string
  segments?: Segment[]
}

interface Project {
  id: string
  name: string
  description: string
  forms: FormData[]
  createdAt: string
  owner_id?: string
  isShared?: boolean
  role?: 'owner' | 'editor' | 'viewer'
}

interface SharedUser {
  id: string
  email: string
  role: 'editor' | 'viewer'
  status: 'pending' | 'accepted' | 'declined'
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('viewer')
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([])
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState('')
  const [shareSuccess, setShareSuccess] = useState('')

  const loadProject = async (userId: string) => {
    // First try to load as owner
    const { data: ownedProject, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', userId)
      .single()

    if (ownedProject) {
      setProject({
        id: ownedProject.id,
        name: ownedProject.name,
        description: ownedProject.description || '',
        forms: ownedProject.forms || [],
        createdAt: ownedProject.created_at,
        owner_id: ownedProject.owner_id,
        role: 'owner'
      })
      return true
    }

    // If not owner, check if shared with user
    const { data: sharedAccess, error: sharedError } = await supabase
      .from('project_shares')
      .select(`
        role,
        projects (*)
      `)
      .eq('project_id', projectId)
      .eq('shared_with_id', userId)
      .eq('status', 'accepted')
      .single()

    if (sharedAccess && sharedAccess.projects) {
      const p = sharedAccess.projects as any
      setProject({
        id: p.id,
        name: p.name,
        description: p.description || '',
        forms: p.forms || [],
        createdAt: p.created_at,
        owner_id: p.owner_id,
        isShared: true,
        role: sharedAccess.role as 'editor' | 'viewer'
      })
      return true
    }

    return false
  }

  const loadSharedUsers = async () => {
    const { data, error } = await supabase
      .from('project_shares')
      .select('id, shared_with_email, role, status')
      .eq('project_id', projectId)

    if (data) {
      setSharedUsers(data.map(d => ({
        id: d.id,
        email: d.shared_with_email,
        role: d.role as 'editor' | 'viewer',
        status: d.status as 'pending' | 'accepted' | 'declined'
      })))
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const found = await loadProject(user.id)
      if (found) {
        await loadSharedUsers()
      }

      setLoading(false)
    }
    checkUser()
  }, [router, supabase, projectId])

  const getFormResource = (formName: string) => {
    return formResources[formName] || null
  }

  const canEdit = project?.role === 'owner' || project?.role === 'editor'

  const handleDeleteForm = async (formIndex: number) => {
    if (!project || !canEdit) return
    if (!confirm('Are you sure you want to remove this form from the project?')) return

    const updatedForms = project.forms.filter((_, idx) => idx !== formIndex)

    const { error } = await supabase
      .from('projects')
      .update({ forms: updatedForms, updated_at: new Date().toISOString() })
      .eq('id', projectId)

    if (!error) {
      setProject({ ...project, forms: updatedForms })
    }
  }

  const handleOpenEditModal = () => {
    if (!project || project.role !== 'owner') return
    setEditName(project.name)
    setEditDescription(project.description)
    setShowEditModal(true)
  }

  const handleSaveProjectEdit = async () => {
    if (!project || !editName.trim()) return

    const { error } = await supabase
      .from('projects')
      .update({
        name: editName.trim(),
        description: editDescription.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (!error) {
      setProject({
        ...project,
        name: editName.trim(),
        description: editDescription.trim()
      })
    }

    setShowEditModal(false)
  }

  const handleShareProject = async () => {
    if (!shareEmail.trim() || !user) return

    setShareLoading(true)
    setShareError('')
    setShareSuccess('')

    // Check if already shared with this email
    if (sharedUsers.some(u => u.email.toLowerCase() === shareEmail.toLowerCase())) {
      setShareError('This user already has access to this project')
      setShareLoading(false)
      return
    }

    // Check if trying to share with self
    if (shareEmail.toLowerCase() === user.email?.toLowerCase()) {
      setShareError('You cannot share a project with yourself')
      setShareLoading(false)
      return
    }

    const { error } = await supabase
      .from('project_shares')
      .insert({
        project_id: projectId,
        owner_id: user.id,
        shared_with_email: shareEmail.toLowerCase(),
        role: shareRole,
        status: 'pending'
      })

    if (error) {
      setShareError('Failed to send invitation. Please try again.')
    } else {
      setShareSuccess(`Invitation sent to ${shareEmail}`)
      setShareEmail('')
      await loadSharedUsers()
    }

    setShareLoading(false)
  }

  const handleRemoveShare = async (shareId: string) => {
    const { error } = await supabase
      .from('project_shares')
      .delete()
      .eq('id', shareId)

    if (!error) {
      setSharedUsers(prev => prev.filter(u => u.id !== shareId))
    }
  }

  const handleViewForm = (form: FormData) => {
    if (form.isCustom && form.pdfBase64) {
      // Store the PDF in sessionStorage and navigate to form viewer
      sessionStorage.setItem('viewerPdfBase64', form.pdfBase64)
      router.push(`/forms/new?projectId=${projectId}`)
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
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
                {project.isShared && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    <Users className="w-3 h-3 mr-1" />
                    {project.role}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">{project.forms.length} forms</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project.role === 'owner' && (
              <Button
                variant="outline"
                onClick={() => setShowShareModal(true)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
            {canEdit && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push(`/forms/new?projectId=${projectId}`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Form
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Project Description */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-start justify-between max-w-3xl">
          <div>
            <p className="text-sm text-gray-600">{project.description}</p>
            <p className="text-xs text-gray-400 mt-2">
              Created on {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
          {project.role === 'owner' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenEditModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Forms Grid */}
      <main className="p-6">
        {project.forms.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No forms in this project</h2>
            <p className="text-gray-500 mb-6">
              {canEdit ? 'Add forms to organize your documents' : 'This project has no forms yet'}
            </p>
            {canEdit && (
              <Button
                onClick={() => router.push(`/forms/new?projectId=${projectId}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Form
              </Button>
            )}
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
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteForm(idx)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove from project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Edit Project</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  rows={3}
                  placeholder="Enter project description"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveProjectEdit}
                  disabled={!editName.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Project Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Share Project</h2>
              </div>
              <button
                onClick={() => {
                  setShowShareModal(false)
                  setShareError('')
                  setShareSuccess('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Invite form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invite by email
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        placeholder="colleague@example.com"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShareRole('viewer')}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        shareRole === 'viewer'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Viewer
                      <p className="text-xs font-normal text-gray-500 mt-0.5">Can view only</p>
                    </button>
                    <button
                      onClick={() => setShareRole('editor')}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        shareRole === 'editor'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Editor
                      <p className="text-xs font-normal text-gray-500 mt-0.5">Can edit forms</p>
                    </button>
                  </div>
                </div>

                {shareError && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    {shareError}
                  </div>
                )}

                {shareSuccess && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                    <Check className="w-4 h-4" />
                    {shareSuccess}
                  </div>
                )}

                <Button
                  onClick={handleShareProject}
                  disabled={!shareEmail.trim() || shareLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {shareLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Send Invitation
                </Button>
              </div>

              {/* Shared users list */}
              {sharedUsers.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Shared with</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sharedUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.email}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {user.role} • {user.status}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveShare(user.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Remove access"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
