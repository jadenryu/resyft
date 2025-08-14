"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Label } from "../../components/ui/label"
import { Progress } from "../../components/ui/progress"
import { ChevronRight, ChevronLeft, Check, Zap, BarChart3, Quote, FileText, Gauge } from "lucide-react"

interface QuizOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface QuizQuestion {
  id: string
  title: string
  icon: React.ReactNode
  options: QuizOption[]
}

const questions: QuizQuestion[] = [
  {
    id: "summary_length",
    title: "Summary length?",
    icon: <FileText className="w-5 h-5" />,
    options: [
      { value: "brief", label: "Brief", icon: "📄" },
      { value: "standard", label: "Standard", icon: "📋" },
      { value: "detailed", label: "Detailed", icon: "📚" }
    ]
  },
  {
    id: "statistics",
    title: "How many statistics?",
    icon: <BarChart3 className="w-5 h-5" />,
    options: [
      { value: "minimal", label: "Minimal", icon: "1️⃣" },
      { value: "moderate", label: "Moderate", icon: "2️⃣" },
      { value: "extensive", label: "Extensive", icon: "3️⃣" }
    ]
  },
  {
    id: "quotes",
    title: "Number of quotes?",
    icon: <Quote className="w-5 h-5" />,
    options: [
      { value: "1-2", label: "1-2 quotes", icon: "💬" },
      { value: "3-5", label: "3-5 quotes", icon: "💬💬" },
      { value: "6+", label: "6+ quotes", icon: "💬💬💬" }
    ]
  },
  {
    id: "focus",
    title: "Research focus?",
    icon: <Zap className="w-5 h-5" />,
    options: [
      { value: "methods", label: "Methods", icon: "🔬" },
      { value: "results", label: "Results", icon: "📊" },
      { value: "impact", label: "Impact", icon: "🎯" }
    ]
  },
  {
    id: "complexity",
    title: "Technical level?",
    icon: <Gauge className="w-5 h-5" />,
    options: [
      { value: "simple", label: "Simple", icon: "🟢" },
      { value: "balanced", label: "Balanced", icon: "🟡" },
      { value: "technical", label: "Technical", icon: "🔴" }
    ]
  }
]

export default function OnboardingQuiz() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const progress = ((currentQuestion + 1) / questions.length) * 100

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }))
    
    // Auto-advance to next question after selection
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
      } else {
        handleSubmit()
      }
    }, 300)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Store preferences
      localStorage.setItem('resyft_preferences', JSON.stringify(answers))
      
      // Quick transition
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setIsSubmitting(false)
    }
  }

  const currentQ = questions[currentQuestion]
  const currentAnswer = answers[currentQ.id]

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Minimal Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-semibold text-gray-900">Personalize Resyft</h1>
            <p className="text-sm text-gray-500 mt-1">
              Takes less than 30 seconds
            </p>
          </motion.div>
          
          {/* Minimal Progress */}
          <div className="mt-6">
            <div className="flex justify-center gap-1.5">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                    index <= currentQuestion ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {currentQuestion + 1} of {questions.length}
            </p>
          </div>
        </div>

        {/* Streamlined Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {currentQ.icon}
                  </div>
                  <CardTitle className="text-lg font-medium">
                    {currentQ.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3">
                  {currentQ.options.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(option.value)}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer
                        transition-all duration-200
                        ${currentAnswer === option.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="text-sm font-medium text-gray-700">
                        {option.label}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Minimal Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip personalization →
          </button>
        </div>

        {/* Loading Overlay */}
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Setting up your preferences...</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}