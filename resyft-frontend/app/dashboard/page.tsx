"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Upload,
  FolderPlus,
  Search,
  Sparkles,
  ArrowRight,
  Send,
  FileText,
  Link,
  Settings,
  HelpCircle,
  BookOpen,
  Zap,
  TrendingUp,
  Clock,
  Plus
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SuggestedAction {
  icon: React.ReactNode
  title: string
  subtitle: string
  action: () => void
}

interface Message {
  type: 'user' | 'assistant' | 'action'
  content: string
  timestamp: Date
  action?: SuggestedAction
}

export default function Dashboard() {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Check if user is new (no projects)
  const [isNewUser, setIsNewUser] = useState(true)
  const [userName, setUserName] = useState("Researcher")

  useEffect(() => {
    // Check for existing projects
    const projects = localStorage.getItem('resyft_projects')
    setIsNewUser(!projects || JSON.parse(projects).length === 0)
    
    // Get user preferences from onboarding
    const preferences = localStorage.getItem('resyft_preferences')
    if (preferences) {
      // User completed onboarding
      setMessages([{
        type: 'assistant',
        content: `Welcome back! I've set up your preferences. How can I help you with your research today?`,
        timestamp: new Date()
      }])
    } else {
      // New user welcome
      setMessages([{
        type: 'assistant',
        content: `Welcome to Resyft! I'm your AI research assistant. I can help you extract insights from papers, create projects, and streamline your research workflow. What would you like to do first?`,
        timestamp: new Date()
      }])
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const suggestedActions: SuggestedAction[] = isNewUser ? [
    {
      icon: <Upload className="w-5 h-5" />,
      title: "Upload your first paper",
      subtitle: "Extract insights from a research paper",
      action: () => router.push('/upload')
    },
    {
      icon: <FolderPlus className="w-5 h-5" />,
      title: "Create a project",
      subtitle: "Organize papers around a research topic",
      action: () => router.push('/projects/new')
    },
    {
      icon: <Link className="w-5 h-5" />,
      title: "Quick analysis",
      subtitle: "Paste a URL for instant insights",
      action: () => router.push('/quick-analysis')
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: "Search papers",
      subtitle: "Find research from our database",
      action: () => router.push('/search')
    }
  ] : [
    {
      icon: <Upload className="w-5 h-5" />,
      title: "Add paper to project",
      subtitle: "Upload a new source",
      action: () => router.push('/upload')
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "View insights",
      subtitle: "See extracted data from your papers",
      action: () => router.push('/projects')
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: "Adjust settings",
      subtitle: "Customize extraction preferences",
      action: () => router.push('/settings')
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Quick analysis",
      subtitle: "Analyze a paper instantly",
      action: () => router.push('/quick-analysis')
    }
  ]

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      type: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      let response = ""
      let action: SuggestedAction | undefined

      // Parse user intent
      const lowerInput = input.toLowerCase()
      
      if (lowerInput.includes('upload') || lowerInput.includes('paper') || lowerInput.includes('add')) {
        response = "I'll help you upload a paper. You can either paste a URL or upload a PDF file. Would you like to add this to an existing project or analyze it standalone?"
        action = {
          icon: <Upload className="w-5 h-5" />,
          title: "Upload Paper",
          subtitle: "Click to start uploading",
          action: () => router.push('/upload')
        }
      } else if (lowerInput.includes('project') || lowerInput.includes('create')) {
        response = "Projects help you organize papers around a specific research topic or thesis. You can set a thesis statement to get more relevant extractions. Let me help you create one."
        action = {
          icon: <FolderPlus className="w-5 h-5" />,
          title: "Create Project",
          subtitle: "Start a new research project",
          action: () => router.push('/projects/new')
        }
      } else if (lowerInput.includes('search') || lowerInput.includes('find')) {
        response = "I can help you search for papers in our database. You can filter by year, journal, author, or use semantic search for topics."
        action = {
          icon: <Search className="w-5 h-5" />,
          title: "Search Papers",
          subtitle: "Find relevant research",
          action: () => router.push('/search')
        }
      } else if (lowerInput.includes('settings') || lowerInput.includes('preference')) {
        response = "You can customize how I extract information - from summary length to the number of quotes and statistics. Let's adjust your preferences."
        action = {
          icon: <Settings className="w-5 h-5" />,
          title: "Extraction Settings",
          subtitle: "Customize your preferences",
          action: () => router.push('/settings')
        }
      } else if (lowerInput.includes('help') || lowerInput.includes('how')) {
        response = "I can help you: \n\n• Upload and analyze research papers\n• Create projects to organize your research\n• Extract specific quotes and statistics\n• Generate summaries tailored to your thesis\n• Search our paper database\n\nWhat would you like to know more about?"
      } else {
        response = "I understand you're interested in research analysis. I can help you extract insights from papers, organize them into projects, and find relevant information quickly. What specific task would you like to start with?"
      }

      const assistantMessage: Message = {
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        action
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1000)
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-white border-b">
          <div className="flex h-14 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Research Assistant</h1>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => router.push('/quick-analysis')}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Quick Analysis
            </Button>
          </div>
        </header>

        <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {/* Welcome Card for New Users */}
              {isNewUser && messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <Sparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-lg font-semibold mb-2">Getting Started with Resyft</h2>
                          <p className="text-sm text-gray-600 mb-4">
                            Extract insights from research papers in seconds. Get summaries, quotes, and statistics tailored to your needs.
                          </p>
                          <div className="flex gap-3">
                            <Button 
                              size="sm"
                              onClick={() => router.push('/onboarding')}
                              className="gap-2"
                            >
                              <Settings className="w-4 h-4" />
                              Set Preferences
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => window.open('/docs', '_blank')}
                              className="gap-2"
                            >
                              <BookOpen className="w-4 h-4" />
                              View Guide
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Messages */}
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.type === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-2xl ${message.type === 'user' ? 'order-1' : ''}`}>
                      <div className={`rounded-lg px-4 py-3 ${
                        message.type === 'user' 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'bg-white border border-gray-200'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      
                      {message.action && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="mt-3"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={message.action.action}
                            className="gap-2 group"
                          >
                            {message.action.icon}
                            <span>{message.action.title}</span>
                            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </motion.div>
                      )}
                    </div>

                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 order-2">
                        <span className="text-xs font-semibold">You</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Suggested Actions */}
              {messages.length <= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Suggested actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestedActions.map((action, index) => (
                      <motion.button
                        key={index}
                        onClick={action.action}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{action.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{action.subtitle}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t bg-white">
            <div className="max-w-4xl mx-auto p-4">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask me anything about research analysis..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Resyft AI can help with paper uploads, project creation, and research insights
              </p>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}