'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "../lib/supabase"
import { Button } from "../components/ui/button"
import { FileText, ArrowRight, CheckCircle, Loader2 } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      } else {
        setChecking(false)
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="w-8 h-8 text-blue-500" />
          <span className="text-xl font-bold text-white">Form Filler</span>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="text-white hover:bg-slate-700"
            onClick={() => router.push('/login')}
          >
            Sign In
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push('/signup')}
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          Fill Forms <span className="text-blue-500">Smarter</span>
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Tell us what you need to do, and we&apos;ll recommend the exact forms you need.
          AI-powered form recommendations for medical, business, finance, and more.
        </p>

        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
          onClick={() => router.push('/signup')}
        >
          Start For Free
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 text-left">
          <div className="bg-slate-800/50 rounded-lg p-6">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Recommendations</h3>
            <p className="text-slate-400">
              Describe your situation and get instant recommendations for the forms you need.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-6">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Form Reading</h3>
            <p className="text-slate-400">
              Upload forms and let AI extract and organize the information for you.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-6">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
              <ArrowRight className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Organized Projects</h3>
            <p className="text-slate-400">
              Keep your forms organized by project and track your progress easily.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}