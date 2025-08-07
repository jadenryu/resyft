"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, ChevronLeft, Check } from "lucide-react"

interface QuizOption {
  value: string
  label: string
  description?: string
}

interface QuizQuestion {
  id: string
  title: string
  description: string
  options: QuizOption[]
}

const questions: QuizQuestion[] = [
  {
    id: "summary_depth",
    title: "Summary Detail Preference",
    description: "How comprehensive would you like your research summaries to be?",
    options: [
      { 
        value: "concise", 
        label: "Concise Overview",
        description: "Brief, high-level summary with key findings only"
      },
      { 
        value: "balanced", 
        label: "Balanced Detail",
        description: "Moderate depth covering main points and supporting evidence"
      },
      { 
        value: "comprehensive", 
        label: "Comprehensive Analysis",
        description: "In-depth summary with detailed methodology and findings"
      }
    ]
  },
  {
    id: "statistical_preference",
    title: "Statistical Data Preference",
    description: "How much numerical data would you like extracted from research papers?",
    options: [
      { 
        value: "minimal", 
        label: "Minimal Statistics",
        description: "Only critical numerical findings"
      },
      { 
        value: "moderate", 
        label: "Key Statistics",
        description: "Important statistical results and confidence intervals"
      },
      { 
        value: "extensive", 
        label: "Comprehensive Data",
        description: "All statistical findings, p-values, and effect sizes"
      }
    ]
  },
  {
    id: "quote_density",
    title: "Direct Quote Preference",
    description: "How many direct quotes should be included in your summaries?",
    options: [
      { 
        value: "few", 
        label: "Essential Quotes Only",
        description: "1-2 critical quotes per paper"
      },
      { 
        value: "moderate", 
        label: "Supporting Quotes",
        description: "3-5 relevant quotes to support key points"
      },
      { 
        value: "many", 
        label: "Quote-Rich",
        description: "6+ quotes for comprehensive evidence"
      }
    ]
  },
  {
    id: "research_focus",
    title: "Primary Research Focus",
    description: "What aspect of research papers is most important to you?",
    options: [
      { 
        value: "methodology", 
        label: "Methodology & Design",
        description: "Focus on research methods and experimental design"
      },
      { 
        value: "results", 
        label: "Results & Findings",
        description: "Emphasize outcomes and discoveries"
      },
      { 
        value: "implications", 
        label: "Implications & Applications",
        description: "Highlight practical applications and future directions"
      }
    ]
  },
  {
    id: "technical_level",
    title: "Technical Language Preference",
    description: "What level of technical detail works best for you?",
    options: [
      { 
        value: "simplified", 
        label: "Simplified Language",
        description: "Technical concepts explained in accessible terms"
      },
      { 
        value: "balanced", 
        label: "Balanced Approach",
        description: "Mix of technical and simplified explanations"
      },
      { 
        value: "technical", 
        label: "Full Technical Detail",
        description: "Preserve all technical terminology and complexity"
      }
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
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Save preferences to user profile
    try {
      // Store preferences in localStorage for now
      // In production, save to database via API
      localStorage.setItem('resyft_preferences', JSON.stringify(answers))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setIsSubmitting(false)
    }
  }

  const currentQ = questions[currentQuestion]
  const currentAnswer = answers[currentQ.id]
  const isLastQuestion = currentQuestion === questions.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Resyft</h1>
            <p className="text-gray-600 mt-2">
              Let's personalize your research experience
            </p>
          </motion.div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">{currentQ.title}</CardTitle>
                <CardDescription className="text-base">
                  {currentQ.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={currentAnswer || ""}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {currentQ.options.map((option) => (
                    <motion.div
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Label
                        htmlFor={option.value}
                        className={`
                          flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer
                          transition-all duration-200
                          ${currentAnswer === option.value 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={option.value}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </Label>
                    </motion.div>
                  ))}
                </RadioGroup>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="min-w-[100px]"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    disabled={!currentAnswer || isSubmitting}
                    className="min-w-[100px]"
                  >
                    {isLastQuestion ? (
                      <>
                        {isSubmitting ? (
                          "Saving..."
                        ) : (
                          <>
                            Complete
                            <Check className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}