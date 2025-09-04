'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion'
import { VercelSection } from '../../components/vercel-section'
import { motion } from 'framer-motion'
import Link from 'next/link'
import ShaderBackground from '../../components/shader-background'
import Header from '../../components/shader-header'
import HeroContent from '../../components/hero-content'
import PulsingCircle from '../../components/pulsing-circle'
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

export default function AboutPage() {
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
            <span className="text-xl font-bold text-gray-900">
              Resyft
            </span>
          </motion.div>
          
          {/* Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center space-x-8"
          >
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Home
            </Link>
            <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Features
            </a>
            <a href="#reviews-section" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Reviews
            </a>
            <a href="#faq-section" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              FAQ
            </a>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Pricing
            </Link>
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
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Shader Hero Section */}
      <ShaderBackground>
        <Header />
        <HeroContent />
        <PulsingCircle />
      </ShaderBackground>

      {/* Instant Analysis Section */}
      <VercelSection
        badge="Lightning Fast"
        title="Focus on insights, not manual analysis"
        description="Get comprehensive document insights in seconds. Our AI-powered system instantly processes any document format and delivers structured analysis."
        features={[
          {
            icon: Zap,
            title: "Instant Analysis",
            description: "Process documents in seconds, not hours. From technical papers to business reports - analyzed instantly with precision."
          },
          {
            icon: FileText,
            title: "Structured Insights", 
            description: "Extract key findings, methodologies, and technical concepts in organized, actionable formats ready for your workflow."
          }
        ]}
        ctaText="Try Analysis Now"
        ctaHref="#demo"
        className="bg-gradient-to-br from-blue-50/30 to-indigo-50/30 border-t border-blue-200/30"
      />

      {/* AI Intelligence Section */}
      <VercelSection
        badge="AI Powered"
        title="Field-specific intelligence that adapts"
        description="Specialized AI agents with expertise in neuroscience, cybersecurity, data science, and more provide expert-level analysis tailored to your document's domain."
        features={[
          {
            icon: Brain,
            title: "Expert AI Agents",
            description: "AI specialists trained in specific fields analyze your content with domain expertise, ensuring accurate interpretation."
          },
          {
            icon: Settings,
            title: "Adaptive Processing",
            description: "Automatically detects document type and routes to specialized analysis agents for maximum accuracy and relevance."
          }
        ]}
        reversed={true}
        className="bg-gradient-to-br from-emerald-50/20 to-green-50/20 border-t border-emerald-200/30"
      />

      {/* Quality & Support Section */}
      <VercelSection
        badge="Enterprise Ready"
        title="Quality you can trust, formats you need"
        description="Built for professional use with confidence scoring, reliability assessment, and support for all major document formats."
        features={[
          {
            icon: Shield,
            title: "Quality Assessment",
            description: "Confidence scoring and reliability assessment help you understand the quality and trustworthiness of extracted insights."
          },
          {
            icon: Users,
            title: "Multi-Format Support",
            description: "Analyze PDFs, text documents, URLs, and various file formats with consistent high-quality results across all platforms."
          }
        ]}
        ctaText="See All Features"
        ctaHref="#features-detail"
        className="bg-gradient-to-br from-purple-50/20 to-violet-50/20 border-t border-purple-200/30"
      />

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by professionals worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of professionals who have streamlined their document analysis with Resyft's AI
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { 
                number: "50K+", 
                label: "Documents Analyzed"
              },
              { 
                number: "95%", 
                label: "Analysis Accuracy"
              },
              { 
                number: "15s", 
                label: "Average Processing Time"
              },
              { 
                number: "1K+", 
                label: "Professional Users"
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <p className="text-gray-500 mb-8">Trusted by leading research institutions</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="flex items-center text-gray-600">
                <BookOpen className="w-4 h-4 mr-2" />
                <span className="text-sm">Academic Partners</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Shield className="w-4 h-4 mr-2" />
                <span className="text-sm">SOC 2 Compliant</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Award className="w-4 h-4 mr-2" />
                <span className="text-sm">Research Validated</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Star className="w-4 h-4 mr-2" />
                <span className="text-sm">98% Satisfaction</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews-section" className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What researchers are saying
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real feedback from researchers using Resyft to accelerate their work
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
                <Card className="h-full bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
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
            <Card className="max-w-2xl mx-auto border border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Still have questions?
                </h3>
                <p className="text-gray-600 mb-4">
                  Our research specialists are here to help you get the most out of Resyft.
                </p>
                <Link href="/support">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Contact Support
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gray-900">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to accelerate your research?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join thousands of researchers who have streamlined their literature review process and discovered insights faster than ever before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 text-base font-semibold">
                  Start Analyzing Papers
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-gray-400 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white h-12 px-8 text-base font-semibold">
                Schedule a Demo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-400">
              No credit card required • Free to get started • Cancel anytime
            </p>
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
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Why Resyft?</Link></li>
                <li><Link href="/api" className="text-gray-400 hover:text-white transition-colors">For Students</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Team</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm">
                © 2025 Resyft. All rights reserved.
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