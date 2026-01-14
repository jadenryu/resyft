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
  ChevronLeft
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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Load saved projects from localStorage
      const saved = localStorage.getItem('formfiller_projects')
      if (saved) {
        setProjects(JSON.parse(saved))
      }

      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCreateProject = () => {
    if (!projectText.trim()) return

    const forms = classifyHealthInsuranceQuery(projectText)

    // Generate a smart project name based on the description
    const projectName = generateProjectName(projectText)

    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName,
      description: projectText,
      forms,
      createdAt: new Date().toISOString()
    }

    const updated = [...projects, newProject]
    setProjects(updated)
    localStorage.setItem('formfiller_projects', JSON.stringify(updated))

    setProjectText("")
    setShowPopup(false)
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
                    <button
                      key={project.id}
                      className="w-full text-left p-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-xs text-gray-500">{project.forms.length} forms</p>
                    </button>
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
                  className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-blue-300"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
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
    </div>
  )
}
