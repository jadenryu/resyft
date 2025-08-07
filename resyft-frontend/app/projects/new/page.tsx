"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  FolderPlus,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Target,
  BookOpen,
  Hash,
  Calendar,
  Users,
  X
} from "lucide-react"

interface ProjectFormData {
  name: string
  description: string
  thesis: string
  field: string
  deadline: string
  collaborators: string[]
  tags: string[]
}

export default function NewProjectPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    thesis: "",
    field: "",
    deadline: "",
    collaborators: [],
    tags: []
  })
  const [newTag, setNewTag] = useState("")
  const [newCollaborator, setNewCollaborator] = useState("")
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  const researchFields = [
    "Computer Science",
    "Biology",
    "Medicine",
    "Physics",
    "Chemistry",
    "Psychology",
    "Economics",
    "Environmental Science",
    "Engineering",
    "Mathematics",
    "Social Sciences",
    "Other"
  ]

  const validateForm = (): string[] => {
    const errors: string[] = []
    
    if (!formData.name) {
      errors.push("Project name is required")
    }
    
    if (!formData.description) {
      errors.push("Project description is required")
    }
    
    if (!formData.thesis) {
      errors.push("Research thesis/topic is required")
    }
    
    if (!formData.field) {
      errors.push("Research field is required")
    }
    
    if (formData.name.length > 100) {
      errors.push("Project name must be less than 100 characters")
    }
    
    if (formData.description.length > 500) {
      errors.push("Description must be less than 500 characters")
    }
    
    return errors
  }

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleAddCollaborator = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (newCollaborator && emailRegex.test(newCollaborator)) {
      if (!formData.collaborators.includes(newCollaborator)) {
        setFormData(prev => ({
          ...prev,
          collaborators: [...prev.collaborators, newCollaborator]
        }))
        setNewCollaborator("")
      }
    } else if (newCollaborator) {
      setErrors(["Please enter a valid email address"])
      setTimeout(() => setErrors([]), 3000)
    }
  }

  const handleRemoveCollaborator = (email: string) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c !== email)
    }))
  }

  const handleSubmit = async () => {
    const validationErrors = validateForm()
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setProcessing(true)
    setErrors([])
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Save to localStorage for demo
      const projects = JSON.parse(localStorage.getItem('resyft_projects') || '[]')
      const newProject = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        papers: [],
        status: 'active'
      }
      projects.push(newProject)
      localStorage.setItem('resyft_projects', JSON.stringify(projects))
      
      setSuccess(true)
      setTimeout(() => {
        router.push(`/projects/${newProject.id}`)
      }, 1000)
    } catch (error) {
      setErrors(["Failed to create project. Please try again."])
      setProcessing(false)
    }
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Create New Project</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Info Alert */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Projects help you organize research papers around a specific thesis or topic. 
                  All papers added to this project will be analyzed with your research goals in mind.
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Main Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderPlus className="w-5 h-5" />
                    Project Details
                  </CardTitle>
                  <CardDescription>
                    Define your research project parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Project Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Climate Change Impact Study"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-2"
                        maxLength={100}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.name.length}/100 characters
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Briefly describe your research goals and objectives..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-2 min-h-[100px]"
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.description.length}/500 characters
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Research Configuration */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Research Configuration
                    </h3>

                    <div>
                      <Label htmlFor="thesis">Research Thesis/Topic *</Label>
                      <Textarea
                        id="thesis"
                        placeholder="What is your main research question or hypothesis? This will help AI better analyze papers in context of your research goals."
                        value={formData.thesis}
                        onChange={(e) => setFormData(prev => ({ ...prev, thesis: e.target.value }))}
                        className="mt-2 min-h-[80px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="field">Research Field *</Label>
                      <Select 
                        value={formData.field} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, field: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select your research field" />
                        </SelectTrigger>
                        <SelectContent>
                          {researchFields.map(field => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="tags"
                          placeholder="Add keyword tags"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddTag}
                        >
                          Add
                        </Button>
                      </div>
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              <Hash className="w-3 h-3" />
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Optional Settings */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Optional Settings
                    </h3>

                    <div>
                      <Label htmlFor="deadline">Project Deadline</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="collaborators">Collaborators</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="collaborators"
                          type="email"
                          placeholder="Enter collaborator email"
                          value={newCollaborator}
                          onChange={(e) => setNewCollaborator(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCollaborator())}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddCollaborator}
                        >
                          Invite
                        </Button>
                      </div>
                      {formData.collaborators.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {formData.collaborators.map(email => (
                            <div key={email} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                {email}
                              </span>
                              <button
                                onClick={() => handleRemoveCollaborator(email)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Messages */}
                  {errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Success Message */}
                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Project created successfully! Redirecting...
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={processing || success}
                      className="min-w-[140px]"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Created!
                        </>
                      ) : (
                        <>
                          <FolderPlus className="w-4 h-4 mr-2" />
                          Create Project
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}