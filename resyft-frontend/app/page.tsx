'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { motion } from 'framer-motion'
import Link from 'next/link'
import ShaderBackground from '../components/shader-background'
import ShaderHeader from '../components/shader-header'
import HeroContent from '../components/hero-content'
import { TestimonialGridSection } from '../components/testimonial-grid-section'
import { HeroQuoteSection } from '../components/hero-quote-section'
import {
  ArrowRight,
  Sparkles,
  FileText,
  Brain,
  Upload,
  CheckCircle,
  Loader2
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      // Always show home page, don't auto-redirect logged-in users
      setChecking(false)
    }
    checkAuth()
  }, [router, supabase])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/30">
      {/* Shader Hero Section */}
      <ShaderBackground>
        <ShaderHeader />
        <HeroContent />
      </ShaderBackground>

      {/* Feature Section 1 */}
      <section id="features" className="py-24 px-4">
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
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2">
                    Smart Recommendations
                  </Badge>
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    Tell us your situation, get the right forms
                  </h2>
                  <p className="text-lg text-gray-600 font-light leading-relaxed">
                    Describe what you need to accomplish and our AI will recommend the exact forms required.
                    No more searching through complex government websites or guessing which forms apply to you.
                  </p>
                </div>
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 font-bold rounded-xl">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>

              {/* Icon Side */}
              <div className="relative p-8 lg:p-12 bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
                <div className="w-48 h-48 bg-blue-100 rounded-full flex items-center justify-center">
                  <Brain className="w-24 h-24 text-blue-600" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section 2 */}
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
              {/* Icon Side */}
              <div className="relative p-8 lg:p-12 bg-gradient-to-br from-blue-50 to-white lg:order-1 flex items-center justify-center">
                <div className="w-48 h-48 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-24 h-24 text-blue-600" />
                </div>
              </div>

              {/* Content Side */}
              <div className="p-12 lg:p-16 space-y-8 lg:order-2">
                <div className="space-y-6">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2">
                    AI Form Reading
                  </Badge>
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    Upload and analyze any PDF form
                  </h2>
                  <p className="text-lg text-gray-600 font-light leading-relaxed">
                    Upload your forms and let our AI extract all the fields, identify the form type,
                    and organize the information for you. See exactly what needs to be filled in.
                  </p>
                </div>
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 font-bold rounded-xl">
                    Try Form Upload
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section 3 */}
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
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2">
                    Organized Projects
                  </Badge>
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    Keep all your forms organized
                  </h2>
                  <p className="text-lg text-gray-600 font-light leading-relaxed">
                    Create projects for different needs - taxes, insurance, business, medical.
                    Track which forms you&apos;ve completed and what&apos;s left to do.
                  </p>
                </div>
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 font-bold rounded-xl">
                    Create Your First Project
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>

              {/* Icon Side */}
              <div className="relative p-8 lg:p-12 bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
                <div className="w-48 h-48 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-24 h-24 text-blue-600" />
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
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by professionals everywhere
            </h2>
            <p className="text-xl font-light text-gray-600 max-w-3xl mx-auto">
              Join thousands of people simplifying their form workflow.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              {
                number: "100+",
                label: "Forms Analyzed"
              },
              {
                number: "95%",
                label: "Recommendation Accuracy"
              },
              {
                number: "<5s",
                label: "Average Response Time"
              },
              {
                number: "92%",
                label: "PDF Analysis Accuracy"
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
                <div className="text-gray-600 font-normal">
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
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl font-light text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about Resyft
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  question: "How does the form recommendation work?",
                  answer: "Simply describe your situation in plain language - for example, 'I lost my job and need to continue health insurance for my family.' Our AI analyzes your description and recommends the specific forms you need, like COBRA election forms or marketplace applications."
                },
                {
                  question: "What types of forms can you analyze?",
                  answer: "We can analyze any PDF form - tax forms, insurance applications, medical paperwork, business documents, legal contracts, and more. Our AI extracts fields, identifies checkboxes, and organizes all the information for you."
                },
                {
                  question: "Is my data secure?",
                  answer: "Absolutely. All uploaded documents are processed securely and are never stored permanently. We use industry-standard encryption and your data is never shared with third parties."
                },
                {
                  question: "Do I need to create an account?",
                  answer: "Yes, a free account is required to use Resyft. This allows you to save your projects, track your progress, and access your form recommendations anytime."
                },
                {
                  question: "What if the AI recommends the wrong forms?",
                  answer: "Our recommendations are based on your description, so the more details you provide, the more accurate they'll be. You can always refine your description or manually search for specific forms if needed."
                },
                {
                  question: "Can I use this for my business?",
                  answer: "Yes! Resyft is great for businesses of all sizes. Whether you need to handle employee paperwork, tax forms, or regulatory compliance, our AI can help you find and organize the right forms."
                },
                {
                  question: "Is there a mobile app?",
                  answer: "Rsyft is a web application that works on any device with a browser. The responsive design means it works great on phones and tablets too."
                },
                {
                  question: "How much does it cost?",
                  answer: "Resyft is free to get started. We offer premium plans for power users who need to process large volumes of forms or need additional features."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <AccordionItem value={`item-${index}`} className="border-b border-gray-200">
                    <AccordionTrigger className="text-left font-bold text-gray-900 hover:text-blue-600 py-6 text-lg">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-6 leading-relaxed font-normal">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </div>

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
              Ready to simplify your paperwork?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-normal">
              Join thousands of professionals who use Resyft to find the right forms,
              analyze documents, and stay organized.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 text-base font-bold">
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-gray-400 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white h-12 px-8 text-base font-bold">
                  Sign In
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-400 font-normal">
              No credit card required &bull; Free to get started
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="mb-6">
                <span className="text-2xl font-bold text-white">
                  Resyft
                </span>
              </div>
              <p className="text-gray-400 max-w-md mb-6 leading-relaxed font-normal">
                AI-powered form recommendations and analysis.
                Find the right forms, understand what&apos;s needed, and stay organized.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors font-normal">Features</Link></li>
                <li><Link href="#faq-section" className="text-gray-400 hover:text-white transition-colors font-normal">FAQ</Link></li>
                <li><Link href="/signup" className="text-gray-400 hover:text-white transition-colors font-normal">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">Account</h3>
              <ul className="space-y-3">
                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors font-normal">Sign In</Link></li>
                <li><Link href="/signup" className="text-gray-400 hover:text-white transition-colors font-normal">Sign Up</Link></li>
                <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors font-normal">Dashboard</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm font-normal">
                &copy; 2026 Resyft. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered
                </Badge>
                <div className="text-gray-400 text-sm font-normal">
                  Smart form recommendations
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
