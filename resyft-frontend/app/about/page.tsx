'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion'
import { motion } from 'framer-motion'
import Link from 'next/link'
import ShaderBackground from '../../components/shader-background'
import Header from '../../components/shader-header'
import HeroContent from '../../components/hero-content'
import PulsingCircle from '../../components/pulsing-circle'
import { TestimonialGridSection } from '../../components/testimonial-grid-section'
import { HeroQuoteSection } from '../../components/hero-quote-section'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/30">
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
            <span className="text-xl playfair-semibold text-gray-900">
              Resyft
            </span>
          </motion.div>
          
          {/* Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center space-x-8"
          >
            <Link href="/" className="text-gray-600 hover:text-gray-900 merriweather-regular transition-colors">
              Home
            </Link>
            <a href="#features" className="text-gray-600 hover:text-gray-900 merriweather-regular transition-colors">
              Features
            </a>
            <a href="#testimonials-section" className="text-gray-600 hover:text-gray-900 merriweather-regular transition-colors">
              Testimonials
            </a>
            <a href="#faq-section" className="text-gray-600 hover:text-gray-900 merriweather-regular transition-colors">
              FAQ
            </a>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 merriweather-regular transition-colors">
              Pricing
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 merriweather-regular">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white merriweather-regular">
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

      {/* Modern Research Agent Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-100/50 overflow-hidden"
          >
            <div className="grid lg:grid-cols-2 gap-0 items-center">
              {/* Content Side */}
              <div className="p-12 lg:p-16 space-y-8">
                <div className="space-y-6">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 merriweather-regular">
                    Lightning Fast
                  </Badge>
                  <h2 className="text-3xl lg:text-4xl playfair-bold text-gray-900 leading-tight">
                    Advanced AI research assistant
                  </h2>
                  <p className="text-lg text-gray-600 merriweather-light leading-relaxed">
                    Ask complex research questions and get comprehensive analysis powered by specialized AI agents.
                  </p>
                </div>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 merriweather-bold rounded-xl">
                  Try Research Agent
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
              
              {/* Image Side */}
              <div className="relative p-8 lg:p-12 bg-gradient-to-br from-blue-50 to-white">
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200/60">
                  <img 
                    src="/stockpic.png" 
                    alt="Research Agent Interface"
                    className="w-full h-full object-cover bg-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modern Paper Upload Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-100/50 overflow-hidden"
          >
            <div className="grid lg:grid-cols-2 gap-0 items-center">
              {/* Image Side */}
              <div className="relative p-8 lg:p-12 bg-gradient-to-br from-blue-50 to-white lg:order-1">
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200/60">
                  <img 
                    src="/stockpic.png" 
                    alt="Paper Upload Interface"
                    className="w-full h-full object-cover bg-white"
                  />
                </div>
              </div>
              
              {/* Content Side */}
              <div className="p-12 lg:p-16 space-y-8 lg:order-2">
                <div className="space-y-6">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 merriweather-regular">
                    Smart Upload
                  </Badge>
                  <h2 className="text-3xl lg:text-4xl playfair-bold text-gray-900 leading-tight">
                    Seamless paper processing
                  </h2>
                  <p className="text-lg text-gray-600 merriweather-light leading-relaxed">
                    Upload PDFs, paste URLs, or input text directly. Our AI automatically processes any research format.
                  </p>
                </div>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 merriweather-bold rounded-xl">
                  Upload Paper
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modern Research Tools Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-100/50 overflow-hidden"
          >
            <div className="grid lg:grid-cols-2 gap-0 items-center">
              {/* Content Side */}
              <div className="p-12 lg:p-16 space-y-8">
                <div className="space-y-6">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 merriweather-regular">
                    AI-Powered Tools
                  </Badge>
                  <h2 className="text-3xl lg:text-4xl playfair-bold text-gray-900 leading-tight">
                    Specialized research tools
                  </h2>
                  <p className="text-lg text-gray-600 merriweather-light leading-relaxed">
                    Access paper analysis, literature search, and data synthesis tools designed for researchers.
                  </p>
                </div>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 merriweather-bold rounded-xl">
                  Explore Tools
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
              
              {/* Image Side */}
              <div className="relative p-8 lg:p-12 bg-gradient-to-br from-blue-50 to-white">
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200/60">
                  <img 
                    src="/stockpic.png" 
                    alt="Research Tools Interface"
                    className="w-full h-full object-cover bg-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl playfair-bold text-gray-900 mb-6">
              Trusted by professionals worldwide
            </h2>
            <p className="text-xl merriweather-light text-gray-600 max-w-3xl mx-auto">
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
                <div className="text-4xl md:text-5xl playfair-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 merriweather-regular">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* Hero Quote Section */}
      <HeroQuoteSection />

      {/* Reviews Section */}
      <TestimonialGridSection />

      {/* FAQ Section */}
      <section id="faq-section" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl playfair-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl merriweather-light text-gray-600 max-w-2xl mx-auto">
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
                    <AccordionTrigger className="text-left merriweather-bold text-gray-900 hover:text-blue-600 py-6 text-lg">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-6 leading-relaxed merriweather-regular">
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
                <h3 className="text-xl playfair-bold text-gray-900 mb-3">
                  Still have questions?
                </h3>
                <p className="text-gray-600 mb-4 merriweather-regular">
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
            <h2 className="text-4xl md:text-5xl playfair-bold text-white mb-6">
              Ready to accelerate your research?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed merriweather-regular">
              Join thousands of researchers who have streamlined their literature review process and discovered insights faster than ever before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 text-base merriweather-bold">
                  Start Analyzing Papers
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-gray-400 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white h-12 px-8 text-base merriweather-bold">
                Schedule a Demo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-400 merriweather-regular">
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
                <span className="text-2xl merriweather-bold text-white">
                  Resyft
                </span>
              </div>
              <p className="text-gray-400 max-w-md mb-6 leading-relaxed merriweather-regular">
                AI-powered research analysis platform that extracts insights from academic papers in seconds. 
                Accelerate your research with intelligent document processing and citation-ready text generation.
              </p>
            </div>

            <div>
              <h3 className="text-lg merriweather-bold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors merriweather-regular">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors merriweather-regular">Why Resyft?</Link></li>
                <li><Link href="/api" className="text-gray-400 hover:text-white transition-colors merriweather-regular">For Students</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg merriweather-bold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors merriweather-regular">About</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors merriweather-regular">Team</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors merriweather-regular">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm merriweather-regular">
                © 2025 Resyft. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
                <div className="text-gray-400 text-sm merriweather-regular">
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