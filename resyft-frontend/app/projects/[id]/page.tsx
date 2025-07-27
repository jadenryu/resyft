'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  BarChart3, 
  Settings, 
  Copy,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Source {
  id: string
  url: string
  title: string
  status: 'processing' | 'completed' | 'failed'
  added_at: string
  analysis: {
    methods?: string
    sample_size?: number
    conclusions?: string
    important_quotes?: string[]
    reliability_score?: number
    relevance_score?: number
    suggested_text?: string
    custom_analysis?: string
  }
}

interface Project {
  id: string
  name: string
  description: string
  research_question: string
  thesis?: string
  configuration: {
    extract_quotes: boolean
    extract_statistics: boolean
    extract_methods: boolean
    preferred_info_type: 'statistical' | 'qualitative' | 'balanced'
    custom_instructions?: string
  }
}

export default function ProjectDetail() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [project, setProject] = useState<Project | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [newSourceUrl, setNewSourceUrl] = useState('')
  const [addingSource, setAddingSource] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
      } else {
        setUser(user)
        loadProject()
      }
    }
    getUser()
  }, [params.id, supabase, router])

  const loadProject = async () => {
    setLoading(true)
    // Simulate loading project data
    setTimeout(() => {
      setProject({
        id: params.id as string,
        name: 'Machine Learning in Healthcare',
        description: 'Research on AI applications in medical diagnosis',
        research_question: 'How effective are machine learning models in early disease detection?',
        thesis: 'ML models significantly improve diagnostic accuracy when combined with traditional methods.',
        configuration: {
          extract_quotes: true,
          extract_statistics: true,
          extract_methods: true,
          preferred_info_type: 'statistical',
          custom_instructions: 'Focus on diagnostic accuracy metrics and patient outcomes'
        }
      })
      
      setSources([
        {
          id: '1',
          url: 'https://arxiv.org/abs/2301.12345',
          title: 'Deep Learning Approaches for Medical Image Analysis',
          status: 'completed',
          added_at: '2024-01-20T10:00:00Z',
          analysis: {
            methods: 'Convolutional Neural Networks with 5-fold cross-validation',
            sample_size: 5432,
            conclusions: 'CNNs achieved 94.2% accuracy in detecting early-stage tumors, significantly outperforming traditional methods.',
            important_quotes: [
              '"The proposed CNN architecture demonstrated a 94.2% accuracy rate in tumor detection (p < 0.001)"',
              '"Early detection capabilities showed 15% improvement over conventional radiological assessment"'
            ],
            reliability_score: 0.94,
            relevance_score: 0.91,
            suggested_text: 'Recent advances in deep learning have shown remarkable promise for medical diagnosis. Smith et al. (2024) demonstrated that convolutional neural networks achieved 94.2% accuracy in detecting early-stage tumors (p < 0.001), representing a 15% improvement over conventional radiological assessment. This finding strongly supports the thesis that ML models significantly enhance diagnostic accuracy when integrated with traditional medical practices.',
            custom_analysis: 'This study directly supports your thesis by providing quantitative evidence of ML superiority in diagnostic accuracy. The large sample size (n=5432) and rigorous methodology strengthen the reliability of these findings for your research argument.'
          }
        },
        {
          id: '2',
          url: 'https://pubmed.ncbi.nlm.nih.gov/example',
          title: 'Clinical Implementation of AI Diagnostic Tools',
          status: 'processing',
          added_at: '2024-01-21T14:30:00Z',
          analysis: {}
        }
      ])
      setLoading(false)
    }, 1000)
  }

  const addSource = async () => {
    if (!newSourceUrl.trim()) return
    
    setAddingSource(true)
    
    const newSource: Source = {
      id: Date.now().toString(),
      url: newSourceUrl,
      title: 'Processing...',
      status: 'processing',
      added_at: new Date().toISOString(),
      analysis: {}
    }
    
    setSources([newSource, ...sources])
    setNewSourceUrl('')
    
    // Simulate processing
    setTimeout(() => {
      setSources(prev => prev.map(source => 
        source.id === newSource.id 
          ? {
              ...source,
              title: 'AI-Driven Predictive Models in Healthcare',
              status: 'completed' as const,
              analysis: {
                methods: 'Machine learning ensemble with random forest and SVM',
                sample_size: 2847,
                conclusions: 'Predictive models reduced diagnostic errors by 23% and improved patient outcomes.',
                important_quotes: [
                  '"Implementation of AI models resulted in 23% reduction in diagnostic errors"',
                  '"Patient outcome metrics improved significantly with AI-assisted diagnosis (p = 0.003)"'
                ],
                reliability_score: 0.89,
                relevance_score: 0.87,
                suggested_text: 'Additional evidence for ML efficacy comes from Johnson et al. (2024), whose implementation of AI models resulted in a 23% reduction in diagnostic errors and significantly improved patient outcomes (p = 0.003). This research reinforces the argument that machine learning integration enhances traditional diagnostic approaches.',
                custom_analysis: 'This source provides excellent complementary evidence to your thesis, focusing on real-world implementation rather than just theoretical performance. The 23% error reduction metric is particularly valuable for supporting your argument about ML improving diagnostic accuracy.'
              }
            }
          : source
      ))
      setAddingSource(false)
    }, 3000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl text-headline text-gray-900 mb-2">Project Not Found</h2>
          <Link href="/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-xl text-headline text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-600 text-body-premium">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/projects/${project.id}/settings`}>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-0 sticky top-24">
              <CardHeader>
                <CardTitle className="text-headline">Project Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm text-subhead text-gray-700 mb-2">Research Question</h4>
                  <p className="text-sm text-gray-900 text-body-premium">
                    {project.research_question}
                  </p>
                </div>
                
                {project.thesis && (
                  <div>
                    <h4 className="text-sm text-subhead text-gray-700 mb-2">Thesis</h4>
                    <p className="text-sm text-gray-900 text-body-premium">
                      {project.thesis}
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm text-subhead text-gray-700 mb-2">Analysis Configuration</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.configuration.extract_quotes && (
                      <Badge variant="secondary" className="text-xs">Quotes</Badge>
                    )}
                    {project.configuration.extract_statistics && (
                      <Badge variant="secondary" className="text-xs">Statistics</Badge>
                    )}
                    {project.configuration.extract_methods && (
                      <Badge variant="secondary" className="text-xs">Methods</Badge>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">
                      {project.configuration.preferred_info_type}
                    </Badge>
                  </div>
                </div>
                
                {project.configuration.custom_instructions && (
                  <div>
                    <h4 className="text-sm text-subhead text-gray-700 mb-2">Custom Instructions</h4>
                    <p className="text-xs text-gray-600 text-body-premium">
                      {project.configuration.custom_instructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Source Section */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-headline flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-600" />
                  Add New Source
                </CardTitle>
                <CardDescription className="text-body-premium">
                  Add research papers and sources to analyze with your project's custom configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="https://arxiv.org/abs/... or PubMed URL"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={addSource}
                    disabled={addingSource || !newSourceUrl.trim()}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    {addingSource ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sources List */}
            <div className="space-y-4">
              <h2 className="text-2xl text-headline text-gray-900">
                Sources ({sources.length})
              </h2>
              
              {sources.length === 0 ? (
                <Card className="text-center py-12 shadow-lg border-2 border-dashed border-gray-300">
                  <CardContent>
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl text-headline text-gray-900 mb-2">No Sources Yet</h3>
                    <p className="text-gray-600 text-body-premium">
                      Add your first research source to start analyzing with this project's configuration
                    </p>
                  </CardContent>
                </Card>
              ) : (
                sources.map((source, index) => (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="shadow-lg border-0 overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-headline text-gray-900 mb-2 flex items-center">
                              {source.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />}
                              {source.status === 'processing' && <Clock className="w-5 h-5 text-blue-600 mr-2 animate-spin" />}
                              {source.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-600 mr-2" />}
                              {source.title}
                            </CardTitle>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <ExternalLink className="w-4 h-4" />
                              <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                                {source.url}
                              </a>
                            </div>
                          </div>
                          <Badge variant={
                            source.status === 'completed' ? 'default' :
                            source.status === 'processing' ? 'secondary' : 'destructive'
                          }>
                            {source.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      {source.status === 'processing' && (
                        <CardContent>
                          <Progress value={60} className="h-2" />
                          <p className="text-sm text-gray-600 mt-2 inter-regular">
                            Analyzing with your project configuration...
                          </p>
                        </CardContent>
                      )}
                      
                      {source.status === 'completed' && source.analysis && (
                        <CardContent className="space-y-6">
                          {/* Analysis Results */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              {source.analysis.methods && (
                                <div>
                                  <h4 className="text-subhead text-gray-900 mb-2">Methods</h4>
                                  <p className="text-gray-700 text-body-premium">{source.analysis.methods}</p>
                                </div>
                              )}
                              
                              {source.analysis.sample_size && (
                                <div>
                                  <h4 className="text-subhead text-gray-900 mb-2">Sample Size</h4>
                                  <Badge variant="secondary" className="text-base px-3 py-1">
                                    {source.analysis.sample_size.toLocaleString()} participants
                                  </Badge>
                                </div>
                              )}
                              
                              {(source.analysis.reliability_score || source.analysis.relevance_score) && (
                                <div>
                                  <h4 className="text-subhead text-gray-900 mb-2">Scores</h4>
                                  <div className="flex gap-4">
                                    {source.analysis.reliability_score && (
                                      <div className="text-center">
                                        <div className="text-xl inter-bold text-blue-600">
                                          {(source.analysis.reliability_score * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-caption-enhanced text-gray-500">Reliability</div>
                                      </div>
                                    )}
                                    {source.analysis.relevance_score && (
                                      <div className="text-center">
                                        <div className="text-xl inter-bold text-green-600">
                                          {(source.analysis.relevance_score * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-caption-enhanced text-gray-500">Relevance</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-4">
                              {source.analysis.conclusions && (
                                <div>
                                  <h4 className="text-subhead text-gray-900 mb-2">Conclusions</h4>
                                  <p className="text-gray-700 text-body-premium">{source.analysis.conclusions}</p>
                                </div>
                              )}
                              
                              {source.analysis.important_quotes && source.analysis.important_quotes.length > 0 && (
                                <div>
                                  <h4 className="text-subhead text-gray-900 mb-2">Key Quotes</h4>
                                  <div className="space-y-2">
                                    {source.analysis.important_quotes.map((quote, idx) => (
                                      <div key={idx} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                                        <p className="text-gray-700 text-body-premium italic">{quote}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Custom Analysis for Project */}
                          {source.analysis.custom_analysis && (
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                              <h4 className="text-subhead text-gray-900 mb-3 flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                                Analysis for Your Project
                              </h4>
                              <p className="text-gray-800 text-body-premium leading-relaxed mb-4">
                                {source.analysis.custom_analysis}
                              </p>
                            </div>
                          )}
                          
                          {/* Ready-to-Use Text */}
                          {source.analysis.suggested_text && (
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                              <h4 className="text-subhead text-gray-900 mb-3 flex items-center">
                                <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                                Ready-to-Cite Text
                              </h4>
                              <p className="text-gray-800 text-body-premium leading-relaxed mb-4">
                                {source.analysis.suggested_text}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(source.analysis.suggested_text!)}
                                className="inter-medium"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy to Clipboard
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}