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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Upload,
  Link,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  ArrowRight,
  FolderPlus,
  Clock,
  FileCheck
} from "lucide-react"

interface ValidationError {
  field: string
  message: string
}

export default function UploadPage() {
  const router = useRouter()
  const [uploadType, setUploadType] = useState<"file" | "url" | "text">("file")
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [title, setTitle] = useState("")
  const [project, setProject] = useState("")
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const validateFile = (file: File): ValidationError[] => {
    const errors: ValidationError[] = []
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['application/pdf', 'text/plain']
    
    if (file.size > maxSize) {
      errors.push({
        field: 'file',
        message: 'File size must be less than 10MB'
      })
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push({
        field: 'file',
        message: 'Only PDF and TXT files are supported'
      })
    }
    
    return errors
  }

  const validateUrl = (url: string): ValidationError[] => {
    const errors: ValidationError[] = []
    
    if (!url) {
      errors.push({
        field: 'url',
        message: 'URL is required'
      })
      return errors
    }
    
    try {
      const urlObj = new URL(url)
      const validDomains = [
        'arxiv.org',
        'pubmed.ncbi.nlm.nih.gov',
        'scholar.google.com',
        'sciencedirect.com',
        'nature.com',
        'science.org',
        'ieee.org',
        'springer.com',
        'wiley.com',
        'plos.org',
        'biorxiv.org',
        'medrxiv.org'
      ]
      
      const isValidDomain = validDomains.some(domain => 
        urlObj.hostname.includes(domain)
      )
      
      if (!isValidDomain) {
        errors.push({
          field: 'url',
          message: `URL must be from a supported academic source. Supported domains include: ${validDomains.slice(0, 5).join(', ')}, and more.`
        })
      }
    } catch {
      errors.push({
        field: 'url',
        message: 'Please enter a valid URL'
      })
    }
    
    return errors
  }

  const validateText = (text: string): ValidationError[] => {
    const errors: ValidationError[] = []
    const minLength = 100
    const maxLength = 50000
    
    if (!text || text.length < minLength) {
      errors.push({
        field: 'text',
        message: `Text must be at least ${minLength} characters`
      })
    }
    
    if (text.length > maxLength) {
      errors.push({
        field: 'text',
        message: `Text must be less than ${maxLength} characters`
      })
    }
    
    return errors
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const fileErrors = validateFile(droppedFile)
      
      if (fileErrors.length === 0) {
        setFile(droppedFile)
        setErrors([])
      } else {
        setErrors(fileErrors)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const fileErrors = validateFile(selectedFile)
      
      if (fileErrors.length === 0) {
        setFile(selectedFile)
        setErrors([])
      } else {
        setErrors(fileErrors)
      }
    }
  }

  const handleSubmit = async () => {
    setErrors([])
    let validationErrors: ValidationError[] = []
    
    // Validate based on upload type
    if (uploadType === "file") {
      if (!file) {
        validationErrors.push({
          field: 'file',
          message: 'Please select a file to upload'
        })
      } else {
        validationErrors = validateFile(file)
      }
    } else if (uploadType === "url") {
      validationErrors = validateUrl(url)
    } else if (uploadType === "text") {
      validationErrors = validateText(text)
    }
    
    // Validate title
    if (!title) {
      validationErrors.push({
        field: 'title',
        message: 'Please provide a title for this paper'
      })
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setProcessing(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      setErrors([{
        field: 'general',
        message: 'Failed to upload paper. Please try again.'
      }])
      setProcessing(false)
    }
  }

  const existingProjects = [
    { id: "1", name: "Climate Change Research" },
    { id: "2", name: "Machine Learning Applications" },
    { id: "3", name: "Medical Studies Review" }
  ]

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Upload Paper</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Instructions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Tip:</strong> For long-term research, consider creating a project first to organize multiple papers around your thesis or topic.
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-2 text-blue-600 p-0 h-auto"
                    onClick={() => router.push('/projects/new')}
                  >
                    Create Project
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Main Upload Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Add Research Paper</CardTitle>
                  <CardDescription>
                    Upload a PDF, provide a URL, or paste text directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload Type Tabs */}
                  <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="file">
                        <FileText className="w-4 h-4 mr-2" />
                        File Upload
                      </TabsTrigger>
                      <TabsTrigger value="url">
                        <Link className="w-4 h-4 mr-2" />
                        URL
                      </TabsTrigger>
                      <TabsTrigger value="text">
                        <FileText className="w-4 h-4 mr-2" />
                        Text
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="space-y-4">
                      <div
                        className={`
                          border-2 border-dashed rounded-lg p-8 text-center transition-colors
                          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                          ${file ? 'bg-green-50 border-green-300' : ''}
                        `}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        {file ? (
                          <div className="space-y-2">
                            <FileCheck className="w-12 h-12 mx-auto text-green-600" />
                            <p className="font-medium text-green-900">{file.name}</p>
                            <p className="text-sm text-green-700">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFile(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Upload className="w-12 h-12 mx-auto text-gray-400" />
                            <div>
                              <p className="text-gray-600">
                                Drag and drop your PDF here, or
                              </p>
                              <Label htmlFor="file-upload" className="cursor-pointer">
                                <span className="text-blue-600 hover:text-blue-700 font-medium">
                                  browse files
                                </span>
                              </Label>
                              <Input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept=".pdf,.txt"
                                onChange={handleFileChange}
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              PDF or TXT • Max 10MB
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="url" className="space-y-4">
                      <div>
                        <Label htmlFor="url">Paper URL</Label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://arxiv.org/pdf/..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Supported: arXiv, PubMed, Nature, Science, IEEE, and more
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4">
                      <div>
                        <Label htmlFor="text">Paper Text</Label>
                        <Textarea
                          id="text"
                          placeholder="Paste the full text of the research paper here..."
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          className="mt-2 min-h-[200px]"
                        />
                        <div className="flex justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            Min: 100 characters • Max: 50,000 characters
                          </p>
                          <p className="text-xs text-gray-600">
                            {text.length} / 50,000
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Paper Details */}
                  <Separator />
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Paper Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter the paper title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="project">Add to Project (Optional)</Label>
                      <Select value={project} onValueChange={setProject}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a project or leave empty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Project</SelectItem>
                          {existingProjects.map(proj => (
                            <SelectItem key={proj.id} value={proj.id}>
                              {proj.name}
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => router.push('/projects/new')}
                          >
                            <FolderPlus className="w-4 h-4 mr-2" />
                            Create New Project
                          </Button>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Error Messages */}
                  {errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {errors.map((error, index) => (
                            <li key={index}>{error.message}</li>
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
                        Paper uploaded successfully! Redirecting to dashboard...
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
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
                      className="min-w-[120px]"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Success!
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Paper
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Processing Time Notice */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Processing Time</p>
                    <p>Papers typically take 30-60 seconds to analyze and extract insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}