'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Zap, 
  FileText, 
  BarChart3, 
  Shield, 
  Brain,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle,
  Upload,
  Link as LinkIcon,
  Settings
} from 'lucide-react'

interface AnalysisResult {
  methods?: string
  sample_size?: number
  key_statistics?: any
  conclusions?: string
  important_quotes?: string[]
  reliability_score?: number
  relevance_score?: number
  suggested_text?: string
}

export default function Home() {
  const [analysisType, setAnalysisType] = useState<'url' | 'text'>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [progress, setProgress] = useState(0)

  const handleAnalyze = async () => {
    console.log('🔥 BUTTON CLICKED! handleAnalyze called') // Debug: Check if button click works
    if ((!url.trim() && analysisType === 'url') || (!text.trim() && analysisType === 'text')) return
    
    console.log('✅ Validation passed, starting analysis...') // Debug: Check if validation passes
    setLoading(true)
    setAnalysis(null)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const response = await fetch(`http://localhost:8001/extract?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ 
          paper_url: analysisType === 'url' ? url : undefined,
          paper_text: analysisType === 'text' ? text : undefined,
          extraction_type: 'all',
          custom_prompt: prompt || 'Extract key findings, methods, sample size, and conclusions',
          use_pydantic_agent: true
        }),
      })

      const result = await response.json()
      console.log('API Response:', result) // Debug: Log the actual API response
      setProgress(100)
      
      // Use actual extracted results from the API response
      setAnalysis({
        methods: result.methods || 'No methodology information extracted',
        sample_size: result.sample_size || null,
        conclusions: result.conclusions || 'No conclusions extracted from the paper',
        important_quotes: result.important_quotes || ['No quotes extracted from the paper'],
        reliability_score: result.reliability_score || 0,
        relevance_score: result.relevance_score || 0,
        suggested_text: result._full_result?.suggested_text || 'Analysis completed - check results above'
      })
      console.log('Updated analysis state:', {
        methods: result.methods || 'No methodology information extracted',
        sample_size: result.sample_size || null,
        conclusions: result.conclusions || 'No conclusions extracted from the paper',
        important_quotes: result.important_quotes || ['No quotes extracted from the paper']
      }) // Debug: Log what we're setting in state
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
      clearInterval(progressInterval)
      setProgress(100)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-gray-200 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <img 
              src="/resyft-2.png" 
              alt="Resyft Icon" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl text-headline bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Resyft
            </span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 inter-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                Get Started
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section with Analysis Tool */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 blur-3xl"></div>
          <div className="absolute top-40 right-32 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 blur-2xl"></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm inter-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Research Analysis
            </Badge>
            
            <h1 className="text-6xl md:text-7xl mb-8 text-display text-hover-lift">
              <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent">
                Extract Research
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Insights in Seconds
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed text-body-premium">
              Paste a research paper URL or text, and get instant analysis with methods, statistics, and ready-to-cite text for your research.
            </p>
            
            {/* Analysis Interface */}
            <Card className="max-w-4xl mx-auto shadow-2xl border-0 overflow-hidden">
              <CardContent className="p-8">
                {/* Input Type Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 p-1 rounded-lg">
                    <Button
                      variant={analysisType === 'url' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setAnalysisType('url')}
                      className="mr-1"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      URL
                    </Button>
                    <Button
                      variant={analysisType === 'text' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setAnalysisType('text')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Text
                    </Button>
                  </div>
                </div>

                {/* Input Area */}
                <div className="space-y-4 mb-6">
                  {analysisType === 'url' ? (
                    <Input
                      placeholder="https://arxiv.org/abs/2301.00001 or PubMed URL..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="h-12 text-lg"
                    />
                  ) : (
                    <Textarea
                      placeholder="Paste your research paper text here..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="min-h-32 text-base"
                    />
                  )}
                  
                  <Input
                    placeholder="What information do you need? (e.g., 'Extract statistics and quotes supporting X hypothesis')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Progress Bar */}
                {loading && (
                  <div className="mb-6">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-gray-600 mt-2 inter-regular">
                      {progress < 30 ? 'Processing document...' :
                       progress < 60 ? 'Extracting key information...' :
                       progress < 90 ? 'Analyzing content...' :
                       'Finalizing results...'}
                    </p>
                  </div>
                )}

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={loading || (analysisType === 'url' ? !url.trim() : !text.trim())}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg inter-semibold"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Analyze Research
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mt-8 max-w-4xl mx-auto"
              >
                {console.log('Rendering analysis:', analysis)} {/* Debug: Log analysis when rendering */}
                <Card className="shadow-2xl border-0">
                  <CardContent className="p-8">
                    <h3 className="text-2xl text-headline text-gray-900 mb-6 flex items-center">
                      <BarChart3 className="w-6 h-6 mr-3 text-green-600" />
                      Analysis Results
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Key Metrics */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-subhead text-gray-900 mb-2">Methods</h4>
                          <p className="text-gray-700 text-body-premium">{analysis.methods}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-subhead text-gray-900 mb-2">Sample Size</h4>
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {analysis.sample_size?.toLocaleString()} participants
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="text-subhead text-gray-900 mb-2">Reliability & Relevance</h4>
                          <div className="flex gap-4">
                            <div className="text-center">
                              <div className="text-2xl inter-bold text-blue-600">
                                {((analysis.reliability_score || 0) * 100).toFixed(0)}%
                              </div>
                              <div className="text-caption-enhanced text-gray-500">Reliability</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl inter-bold text-green-600">
                                {((analysis.relevance_score || 0) * 100).toFixed(0)}%
                              </div>
                              <div className="text-caption-enhanced text-gray-500">Relevance</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Insights */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-subhead text-gray-900 mb-2">Conclusions</h4>
                          <p className="text-gray-700 text-body-premium">{analysis.conclusions}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-subhead text-gray-900 mb-2">Key Quotes</h4>
                          <div className="space-y-2">
                            {analysis.important_quotes?.map((quote, index) => (
                              <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                                <p className="text-gray-700 text-body-premium italic">{quote}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ready-to-Use Text */}
                    {analysis.suggested_text && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                        <h4 className="text-subhead text-gray-900 mb-3 flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                          Ready-to-Cite Text
                        </h4>
                        <p className="text-gray-800 text-body-premium leading-relaxed mb-4">
                          {analysis.suggested_text}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(analysis.suggested_text || '')}
                          className="inter-medium"
                        >
                          Copy to Clipboard
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* CTA for Project Creation */}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 text-center"
              >
                <Card className="max-w-2xl mx-auto border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardContent className="p-6">
                    <h3 className="text-xl text-headline text-gray-900 mb-3">
                      Want more powerful analysis?
                    </h3>
                    <p className="text-gray-600 text-body-premium mb-4">
                      Create a project to customize analysis settings, save sources, and get AI text that perfectly supports your research thesis.
                    </p>
                    <Link href="/signup">
                      <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                        Create Free Project
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white relative overflow-hidden">
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl text-headline text-gray-900 mb-6">
              Why Researchers Choose Resyft
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto text-body-premium">
              Powerful AI tools designed specifically for academic research and analysis
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Analysis",
                description: "Get research insights in under 30 seconds without reading entire papers.",
                gradient: "from-yellow-400 to-orange-500"
              },
              {
                icon: FileText,
                title: "Ready-to-Cite Text",
                description: "Get perfectly formatted text you can copy directly into your research.",
                gradient: "from-indigo-400 to-purple-500"
              },
              {
                icon: Settings,
                title: "Customizable Extraction",
                description: "Configure what information to extract based on your research needs.",
                gradient: "from-green-400 to-blue-500"
              },
              {
                icon: Brain,
                title: "AI Research Assistant",
                description: "Advanced AI that understands academic writing and citation standards.",
                gradient: "from-purple-400 to-pink-500"
              },
              {
                icon: Shield,
                title: "Reliability Scoring",
                description: "Get reliability and relevance scores for every source you analyze.",
                gradient: "from-blue-400 to-cyan-500"
              },
              {
                icon: Users,
                title: "Project Collaboration",
                description: "Organize research by project and collaborate with your team.",
                gradient: "from-pink-400 to-red-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl text-subhead text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-body-premium">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-headline">Resyft</span>
            </div>
            <div className="text-gray-400 inter-regular">
              © 2024 Resyft. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}