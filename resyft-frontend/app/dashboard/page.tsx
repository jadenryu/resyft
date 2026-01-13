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
  Search,
  ChevronRight,
  Loader2
} from "lucide-react"
import { classifyHealthInsuranceQuery } from "../modelWorking"

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

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPopup, setShowPopup] = useState(false)
  const [projectText, setProjectText] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [miscForms, setMiscForms] = useState<FormData[]>([])

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

    if (forms.length === 0) {
      alert("No matching forms found. Please try again with more details about your needs.")
      return
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: `Project ${projects.length + 1}`,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-white">Form Filler</h1>
          <p className="text-xs text-slate-400">Smart form recommendations</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">{user?.email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)] p-4">
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
                  className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors"
                >
                  <p className="text-sm font-medium truncate">{project.name}</p>
                  <p className="text-xs text-gray-500">{project.forms.length} forms</p>
                </button>
              ))
            )}
          </div>
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
            <div className="space-y-8">
              {projects.map(project => (
                <div key={project.id}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
                    <Badge variant="outline">{project.forms.length} forms</Badge>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">{project.description}</p>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {project.forms.map((form, idx) => (
                      <Card
                        key={idx}
                        className="hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => router.push(`/forms/${project.id}-${idx}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {form.formName}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">{form.purpose}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-blue-600 hover:underline cursor-pointer">
                              {form.accessibility}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
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
    </div>
  )
}
