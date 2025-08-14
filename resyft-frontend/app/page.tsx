'use client'

import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { SectionNav } from '../components/section-nav'
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
  Settings,
  Star,
  Clock,
  BookOpen,
  TrendingUp,
  Award,
  Target,
  ChevronDown
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
    if ((!url.trim() && analysisType === 'url') || (!text.trim() && analysisType === 'text')) return
    
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
      const response = await fetch(`/api/extract?t=${Date.now()}`, {
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
      setProgress(100)
      
      setAnalysis({
        methods: result.methods || 'No methodology information extracted',
        sample_size: result.sample_size || null,
        conclusions: result.conclusions || 'No conclusions extracted from the paper',
        important_quotes: result.important_quotes || ['No quotes extracted from the paper'],
        reliability_score: result.reliability_score || 0,
        relevance_score: result.relevance_score || 0,
        suggested_text: result._full_result?.suggested_text || 'Analysis completed - check results above'
      })
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
      {/* Section Navigation */}
      <SectionNav />
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
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Resyft
            </span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium">
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
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Research Analysis
            </Badge>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent">
                Extract Research
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Insights in Seconds
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Paste a research paper URL or text, and get instant analysis with methods, statistics, and ready-to-cite text for your research.
            </p>
            
            {/* Analysis Interface */}
            <Card className="max-w-4xl mx-auto shadow-2xl border-0 overflow-hidden">
              <CardContent className="p-8">
                {/* Input Type Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 p-1 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnalysisType('url')}
                      className={`mr-1 font-semibold ${analysisType === 'url' ? 'bg-blue-600 !text-white hover:bg-blue-700 hover:!text-white' : '!text-black hover:!text-black hover:bg-gray-200'}`}
                      style={{ transition: 'all 0.05s ease-in-out' }}
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      URL
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnalysisType('text')}
                      className={`font-semibold ${analysisType === 'text' ? 'bg-blue-600 !text-white hover:bg-blue-700 hover:!text-white' : '!text-black hover:!text-black hover:bg-gray-200'}`}
                      style={{ transition: 'all 0.05s ease-in-out' }}
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
                    <p className="text-sm text-gray-600 mt-2">
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
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg font-semibold"
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
                <Card className="shadow-2xl border-0">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <BarChart3 className="w-6 h-6 mr-3 text-green-600" />
                      Analysis Results
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Key Metrics */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Methods</h4>
                          <p className="text-gray-700">{analysis.methods}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Sample Size</h4>
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {analysis.sample_size?.toLocaleString()} participants
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Reliability & Relevance</h4>
                          <div className="flex gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {((analysis.reliability_score || 0) * 100).toFixed(0)}%
                              </div>
                              <div className="text-sm text-gray-500">Reliability</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {((analysis.relevance_score || 0) * 100).toFixed(0)}%
                              </div>
                              <div className="text-sm text-gray-500">Relevance</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Insights */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Conclusions</h4>
                          <p className="text-gray-700">{analysis.conclusions}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Key Quotes</h4>
                          <div className="space-y-2">
                            {analysis.important_quotes?.map((quote, index) => (
                              <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                                <p className="text-gray-700 italic">{quote}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ready-to-Use Text */}
                    {analysis.suggested_text && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                          Ready-to-Cite Text
                        </h4>
                        <p className="text-gray-800 leading-relaxed mb-4">
                          {analysis.suggested_text}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(analysis.suggested_text || '')}
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
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Want more powerful analysis?
                    </h3>
                    <p className="text-gray-600 mb-4">
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
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Researchers Choose Resyft
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10K+", label: "Papers Analyzed" },
              { number: "95%", label: "Accuracy Rate" },
              { number: "30s", label: "Average Analysis Time" },
              { number: "500+", label: "Research Teams" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews-section" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Trusted by Researchers Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what researchers say about their experience with Resyft
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "Resyft has transformed my literature review process. What used to take hours now takes minutes, and I get better quality extracts.",
                author: "Dr. Sarah Johnson",
                role: "Associate Professor, Stanford University",
                rating: 5,
              },
              {
                quote: "The AI analysis is incredibly accurate. It captures nuances in research papers that I might have missed in a quick read.",
                author: "Michael Chen",
                role: "PhD Candidate, MIT",
                rating: 5,
              },
              {
                quote: "The ready-to-cite text feature has saved me countless hours of formatting. Perfect for systematic reviews.",
                author: "Dr. Emily Rodriguez",
                role: "Research Scientist, Johns Hopkins",
                rating: 5,
              },
              {
                quote: "We've tried other research tools, but Resyft's accuracy and speed are unmatched. Essential for our workflow.",
                author: "Dr. David Kim",
                role: "Principal Investigator, Harvard Medical",
                rating: 5,
              },
              {
                quote: "The reliability scoring helps me quickly identify the most credible sources. Like having a research assistant.",
                author: "Lisa Patel",
                role: "Graduate Student, UC Berkeley",
                rating: 5,
              },
              {
                quote: "Implementation was seamless. Our research team's productivity has increased by 40% since using Resyft.",
                author: "Dr. James Wilson",
                role: "Research Director, Mayo Clinic",
                rating: 5,
              },
            ].map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {Array(review.rating)
                        .fill(0)
                        .map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ))}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed">{review.quote}</p>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-3">
                        {review.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.author}</p>
                        <p className="text-sm text-gray-600">{review.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq-section" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about Resyft and research analysis
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  question: "How accurate is Resyft's AI analysis?",
                  answer: "Resyft achieves 95% accuracy in extracting key research elements like methods, sample sizes, and conclusions. Our AI is specifically trained on academic papers and continuously improves with each analysis."
                },
                {
                  question: "What types of research papers does Resyft support?",
                  answer: "Resyft works with papers from all major academic databases including PubMed, arXiv, IEEE, and more. We support PDFs, direct URLs, and text input for maximum flexibility."
                },
                {
                  question: "How does the reliability scoring work?",
                  answer: "Our reliability scoring evaluates factors like sample size, methodology rigor, peer review status, and citation quality. Each paper receives a score from 0-100% to help you assess source credibility."
                },
                {
                  question: "Can I customize what information is extracted?",
                  answer: "Yes! You can provide custom prompts to extract specific information relevant to your research. Whether you need statistical data, quotes, or methodological details, Resyft adapts to your needs."
                },
                {
                  question: "Is my research data secure and private?",
                  answer: "Absolutely. We use enterprise-grade encryption and never store your research content. All analyses are processed securely and deleted after completion. Your intellectual property remains completely private."
                },
                {
                  question: "How fast is the analysis process?",
                  answer: "Most papers are analyzed in under 30 seconds. Complex documents may take up to 2 minutes. Our AI processes information much faster than manual reading while maintaining high accuracy."
                },
                {
                  question: "Do you offer institutional licenses?",
                  answer: "Yes, we provide special pricing for universities, research institutions, and organizations. Contact our sales team for volume discounts and custom enterprise features."
                },
                {
                  question: "Can I export or cite the extracted information?",
                  answer: "Definitely! Resyft provides properly formatted, ready-to-cite text that you can copy directly into your research. We follow standard academic citation formats and include source attribution."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <AccordionItem value={`item-${index}`} className="border-b border-gray-200">
                    <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600 py-6 text-lg">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </div>

        </div>
      </section>

      {/* Still Have Questions Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Card className="max-w-2xl mx-auto border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Still have questions?
                </h3>
                <p className="text-gray-600 mb-4">
                  Our research specialists are here to help you get the most out of Resyft.
                </p>
                <Link href="/support">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                    Contact Support
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Matching Screenshot Design */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="border border-gray-700 rounded-lg p-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Accelerate Your Research?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of researchers who have streamlined their literature review process and discovered insights faster than ever before.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Link href="/signup">
                  <Button size="lg" className="bg-white !text-black hover:bg-gray-100 hover:!text-black rounded-full h-12 px-8 text-base font-bold border-2 border-gray-200">
                    Launch Now!
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-gray-900 rounded-full h-12 px-8 text-base font-semibold">
                  Schedule a Pro Demo
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-400">
                No credit card required. Free forever. Upgrade anytime.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/resyft-2.png" 
                  alt="Resyft Icon" 
                  className="w-10 h-10 object-contain"
                />
                <span className="text-2xl font-semibold text-white">
                  Resyft
                </span>
              </div>
              <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
                AI-powered research analysis platform that extracts insights from academic papers in seconds. 
                Accelerate your research with intelligent document processing and citation-ready text generation.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/api" className="text-gray-400 hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm">
                © 2024 Resyft. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
                <div className="text-gray-400 text-sm">
                  Made with ❤️ for researchers
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}