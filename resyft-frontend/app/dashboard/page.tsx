'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "../../lib/supabase"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import {
  Plus,
  FileText,
  LogOut,
  ChevronRight,
  Loader2,
  ExternalLink,
  Upload,
  X,
  Info,
  Menu,
  ChevronLeft,
  Bell,
  Users,
  Check,
  XCircle,
  MoreVertical,
  Trash2
} from "lucide-react"
import { classifyHealthInsuranceQuery, generateProjectName } from "../modelWorking"

interface FormData {
  formName: string
  purpose: string
  accessibility: string
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

interface ProjectInvitation {
  id: string
  project_id: string
  project_name: string
  owner_email: string
  role: 'editor' | 'viewer'
  created_at: string
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

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPopup, setShowPopup] = useState(false)
  const [projectText, setProjectText] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([])
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState<string | null>(null)
  const [cardMenuOpen, setCardMenuOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  const loadProjects = async (userId: string, userEmail: string) => {
    // Load owned projects from Supabase
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    // Load shared projects (accepted invitations)
    const { data: sharedAccess, error: sharedError } = await supabase
      .from('project_shares')
      .select(`
        role,
        projects (*)
      `)
      .eq('shared_with_id', userId)
      .eq('status', 'accepted')

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
        isShared: true,
        role: s.role as 'editor' | 'viewer'
      }))

    setProjects([...owned, ...shared])

    // Also check for any localStorage projects to migrate
    const savedLocal = localStorage.getItem('formfiller_projects')
    if (savedLocal) {
      const localProjects = JSON.parse(savedLocal)
      if (localProjects.length > 0) {
        // Migrate localStorage projects to Supabase
        for (const p of localProjects) {
          await supabase.from('projects').insert({
            owner_id: userId,
            name: p.name,
            description: p.description,
            forms: p.forms,
            created_at: p.createdAt
          })
        }
        localStorage.removeItem('formfiller_projects')
        // Reload after migration
        loadProjects(userId, userEmail)
      }
    }
  }

  const loadInvitations = async (userEmail: string) => {
    const { data, error } = await supabase
      .from('project_shares')
      .select(`
        id,
        project_id,
        role,
        created_at,
        projects!inner (name, owner_id)
      `)
      .eq('shared_with_email', userEmail)
      .eq('status', 'pending')

    if (data) {
      // Get owner emails for display
      const ownerIds = [...new Set(data.map(d => (d.projects as any)?.owner_id).filter(Boolean))]
      const { data: owners } = await supabase
        .from('projects')
        .select('owner_id')
        .in('owner_id', ownerIds)

      const invitationsWithNames: ProjectInvitation[] = data.map(d => ({
        id: d.id,
        project_id: d.project_id,
        project_name: (d.projects as any)?.name || 'Unknown Project',
        owner_email: 'A team member', // We can't easily get email from auth.users
        role: d.role as 'editor' | 'viewer',
        created_at: d.created_at
      }))

      setInvitations(invitationsWithNames)
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

      await loadProjects(user.id, user.email || '')
      await loadInvitations(user.email || '')

      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  // Close project menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setSidebarMenuOpen(null)
      setCardMenuOpen(null)
    }
    if (sidebarMenuOpen || cardMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [sidebarMenuOpen, cardMenuOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCreateProject = async () => {
    if (!projectText.trim() || !user) return

    const forms = classifyHealthInsuranceQuery(projectText)
    const projectName = generateProjectName(projectText)

    const { data, error } = await supabase
      .from('projects')
      .insert({
        owner_id: user.id,
        name: projectName,
        description: projectText,
        forms: forms
      })
      .select()
      .single()

    if (data) {
      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        forms: data.forms || [],
        createdAt: data.created_at,
        owner_id: data.owner_id,
        role: 'owner'
      }
      setProjects([newProject, ...projects])
    }

    setProjectText("")
    setShowPopup(false)
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvitation(invitationId)

    const { error } = await supabase.rpc('accept_project_invitation', {
      invitation_id: invitationId
    })

    if (!error) {
      setInvitations(prev => prev.filter(i => i.id !== invitationId))
      // Reload projects to include the newly accepted one
      if (user) {
        await loadProjects(user.id, user.email || '')
      }
    }

    setProcessingInvitation(null)
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    setProcessingInvitation(invitationId)

    const { error } = await supabase.rpc('decline_project_invitation', {
      invitation_id: invitationId
    })

    if (!error) {
      setInvitations(prev => prev.filter(i => i.id !== invitationId))
    }

    setProcessingInvitation(null)
  }

  const handleDeleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (!error) {
      setProjects(prev => prev.filter(p => p.id !== projectId))
    }

    setDeleteConfirm(null)
  }

  const openDeleteConfirm = (project: Project) => {
    setSidebarMenuOpen(null)
    setCardMenuOpen(null)
    setDeleteConfirm({ id: project.id, name: project.name })
  }

  const handleFormClick = (form: FormData) => {
    setSelectedForm(form)
  }

  const getFormResource = (formName: string) => {
    return formResources[formName] || null
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
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-600 hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Resyft</h1>
            <p className="text-xs text-gray-500">Intelligent form parsing backed by AI</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>

          {/* Notifications Bell */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-gray-600 hover:bg-gray-100 relative"
            >
              <Bell className="w-5 h-5" />
              {invitations.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {invitations.length}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                <div className="p-3 border-b">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {invitations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No pending invitations
                    </div>
                  ) : (
                    invitations.map(invitation => (
                      <div key={invitation.id} className="p-3 border-b hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{invitation.owner_email}</span> invited you to
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {invitation.project_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Role: <span className="capitalize">{invitation.role}</span>
                            </p>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleAcceptInvitation(invitation.id)}
                                disabled={processingInvitation === invitation.id}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleDeclineInvitation(invitation.id)}
                                disabled={processingInvitation === invitation.id}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" />
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`bg-white border-r min-h-[calc(100vh-65px)] transition-all duration-300 ${sidebarCollapsed ? 'w-16 p-2' : 'w-64 p-4'}`}>
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={() => setShowPopup(true)}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
                title="New Project"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push('/forms/upload')}
                title="Upload Form"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <div className="h-px w-full bg-gray-200 my-2" />
              {projects.map(project => (
                <button
                  key={project.id}
                  className="w-10 h-10 rounded bg-gray-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center text-sm font-medium text-gray-600 transition-colors"
                  title={project.name}
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  {project.name.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          ) : (
            <>
              <Button
                onClick={() => setShowPopup(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 mb-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/forms/upload')}
                className="w-full mb-4"
              >
                <FileText className="w-4 h-4 mr-2" />
                Upload Form
              </Button>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase font-medium">Your Projects</p>
                {projects.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No projects yet</p>
                ) : (
                  projects.map(project => (
                    <div
                      key={project.id}
                      className="relative group/item flex items-center"
                    >
                      <button
                        className="flex-1 text-left p-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.forms.length} forms</p>
                      </button>
                      {project.role === 'owner' && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSidebarMenuOpen(sidebarMenuOpen === project.id ? null : project.id)
                            }}
                            className="p-1 rounded opacity-0 group-hover/item:opacity-100 hover:bg-gray-200 transition-all"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          {sidebarMenuOpen === project.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-50 py-1 min-w-[120px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openDeleteConfirm(project)
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">No projects yet</h2>
              <p className="text-gray-500 mb-6">
                Create a project to get personalized form recommendations
              </p>
              <Button
                onClick={() => setShowPopup(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map(project => (
                <Card
                  key={project.id}
                  className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-blue-300 relative"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 pr-8">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </h3>
                          {project.isShared && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              <Users className="w-3 h-3 mr-1" />
                              {project.role}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                      </div>
                      {project.role === 'owner' ? (
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setCardMenuOpen(cardMenuOpen === project.id ? null : project.id)
                            }}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                          </button>
                          {cardMenuOpen === project.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-50 py-1 min-w-[120px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openDeleteConfirm(project)
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        {project.forms.length} {project.forms.length === 1 ? 'form' : 'forms'}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Project Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-2">Tell Us About Your Project</h2>
            <p className="text-sm text-gray-600 mb-4">
              Include all relevant details to ensure accurate form recommendations.
              For things like taxes, include income ranges and other information.
            </p>

            <textarea
              value={projectText}
              onChange={(e) => setProjectText(e.target.value)}
              placeholder="Example: I recently lost my job and need to continue my health insurance. I have a spouse and two children who were also covered..."
              className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateProject}
                disabled={!projectText.trim()}
              >
                Get Recommendations
              </Button>
            </div>
          </div>
        </div>
      )}

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
                      router.push('/forms/new')
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Delete Project</h2>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium text-gray-900">"{deleteConfirm.name}"</span>?
              All forms and data in this project will be permanently removed.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDeleteProject(deleteConfirm.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
