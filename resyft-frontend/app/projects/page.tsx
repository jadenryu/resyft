'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Plus, FolderOpen, Settings, FileText, BarChart3, LogOut, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'

interface Project {
  id: string
  name: string
  description: string
  research_question: string
  thesis?: string
  created_at: string
  sources_count: number
  configuration: {
    extract_quotes: boolean
    extract_statistics: boolean
    extract_methods: boolean
    preferred_info_type: 'statistical' | 'qualitative' | 'balanced'
    custom_instructions?: string
  }
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    research_question: '',
    thesis: ''
  })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
      } else {
        setUser(user)
        loadProjects()
      }
    }
    getUser()
  }, [supabase, router])

  const loadProjects = async () => {
    setLoading(true)
    // Simulate loading projects - in real app this would fetch from database
    setTimeout(() => {
      setProjects([
        {
          id: '1',
          name: 'Machine Learning in Healthcare',
          description: 'Research on AI applications in medical diagnosis',
          research_question: 'How effective are machine learning models in early disease detection?',
          thesis: 'ML models significantly improve diagnostic accuracy when combined with traditional methods.',
          created_at: '2024-01-15',
          sources_count: 12,
          configuration: {
            extract_quotes: true,
            extract_statistics: true,
            extract_methods: true,
            preferred_info_type: 'statistical',
            custom_instructions: 'Focus on diagnostic accuracy metrics and patient outcomes'
          }
        },
        {
          id: '2',
          name: 'Climate Change Adaptation',
          description: 'Urban planning strategies for climate resilience',
          research_question: 'What urban planning strategies are most effective for climate adaptation?',
          created_at: '2024-01-20',
          sources_count: 8,
          configuration: {
            extract_quotes: true,
            extract_statistics: false,
            extract_methods: true,
            preferred_info_type: 'qualitative'
          }
        }
      ])
      setLoading(false)
    }, 1000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const createProject = async () => {
    if (!newProject.name.trim() || !newProject.research_question.trim()) return

    const project: Project = {
      id: Date.now().toString(),
      ...newProject,
      created_at: new Date().toISOString(),
      sources_count: 0,
      configuration: {
        extract_quotes: true,
        extract_statistics: true,
        extract_methods: true,
        preferred_info_type: 'balanced'
      }
    }

    setProjects([project, ...projects])
    setNewProject({ name: '', description: '', research_question: '', thesis: '' })
    setShowCreateForm(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Projects" }]}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl text-display text-gray-900 mb-2">My Projects</h1>
            <p className="text-gray-600 text-body-premium">
              Organize your research with custom analysis configurations
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-headline">Create New Project</CardTitle>
                <CardDescription className="text-body-premium">
                  Set up your research project with custom analysis preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-subhead text-gray-700 mb-2 block">
                      Project Name *
                    </label>
                    <Input
                      placeholder="e.g., Machine Learning in Healthcare"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-subhead text-gray-700 mb-2 block">
                      Description
                    </label>
                    <Input
                      placeholder="Brief description of your research area"
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-subhead text-gray-700 mb-2 block">
                    Research Question/Topic *
                  </label>
                  <Textarea
                    placeholder="What is the main research question you're investigating?"
                    value={newProject.research_question}
                    onChange={(e) => setNewProject({...newProject, research_question: e.target.value})}
                    className="min-h-20"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-subhead text-gray-700 mb-2 block">
                    Thesis (Optional)
                  </label>
                  <Textarea
                    placeholder="Your hypothesis or thesis statement that sources should support"
                    value={newProject.thesis}
                    onChange={(e) => setNewProject({...newProject, thesis: e.target.value})}
                    className="min-h-20"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={createProject}
                    disabled={!newProject.name.trim() || !newProject.research_question.trim()}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    Create Project
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 inter-regular">Loading your projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="text-center py-12 shadow-lg border-2 border-dashed border-gray-300">
            <CardContent>
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl text-headline text-gray-900 mb-2">No Projects Yet</h3>
              <p className="text-gray-600 text-body-premium mb-6">
                Create your first project to start organizing your research with custom AI analysis
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 group border-0">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-headline text-gray-900 mb-2">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-body-premium">
                          {project.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {project.sources_count} sources
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm text-subhead text-gray-700 mb-1">Research Question</h4>
                      <p className="text-sm text-gray-600 text-body-premium line-clamp-2">
                        {project.research_question}
                      </p>
                    </div>
                    
                    {project.thesis && (
                      <div>
                        <h4 className="text-sm text-subhead text-gray-700 mb-1">Thesis</h4>
                        <p className="text-sm text-gray-600 text-body-premium line-clamp-2">
                          {project.thesis}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {project.configuration.extract_quotes && (
                        <Badge variant="outline" className="text-xs">Quotes</Badge>
                      )}
                      {project.configuration.extract_statistics && (
                        <Badge variant="outline" className="text-xs">Statistics</Badge>
                      )}
                      {project.configuration.extract_methods && (
                        <Badge variant="outline" className="text-xs">Methods</Badge>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">
                        {project.configuration.preferred_info_type}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Link href={`/projects/${project.id}`} className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                          <FileText className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                      </Link>
                      <Link href={`/projects/${project.id}/settings`}>
                        <Button variant="outline" size="icon">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}