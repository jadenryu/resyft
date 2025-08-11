"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Send,
  User,
  RefreshCw,
  Search,
  Lightbulb,
  FileText,
  ArrowRight,
  ChevronDown,
  Filter,
  Loader2,
  AlertCircle,
  Sparkles
} from "lucide-react"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  tools_used?: string[]
  error?: boolean
}

// Simple typing indicator component
function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
        <img 
          src="/resyft-2.png" 
          alt="AI" 
          className="w-4 h-4 object-contain filter brightness-0 invert" 
        />
      </div>
      
      <div className="max-w-3xl mr-12">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-sm text-slate-600">AI is thinking...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResearchAgentPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedMode, setSelectedMode] = useState<"general" | "scholar">("scholar")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const landingInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (message?: string) => {
    const messageToSend = message || inputValue.trim()
    if (!messageToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Generate AI response
      const aiResponseData = await generateAIResponse(messageToSend)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseData.response,
        timestamp: new Date(),
        tools_used: aiResponseData.tools_used
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Message handling error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. This could be due to a temporary service issue. Please try again in a moment.",
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const generateAIResponse = async (input: string): Promise<{ response: string, tools_used?: string[] }> => {
    try {
      const conversationHistory = messages
        .filter(m => !m.error)
        .map(m => ({
          role: m.role,
          content: m.content,
          ...(m.tools_used && { tools_used: m.tools_used })
        }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversation_history: conversationHistory.slice(-10),
          mode: selectedMode
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.response) {
        return {
          response: data.response,
          tools_used: data.tools_used || []
        }
      } else {
        throw new Error('No valid response generated')
      }
      
    } catch (error) {
      console.error('AI Response Error:', error)
      return {
        response: `I understand you're asking about "${input}". As your research agent, I can help with paper analysis, literature search, data synthesis, hypothesis generation, and citation management. Could you provide more specific details?`,
        tools_used: []
      }
    }
  }

  const clearConversation = () => {
    setMessages([])
  }

  const handleExampleClick = (example: string) => {
    handleSubmit(example)
  }

  // Landing page when no messages - using exact design provided
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center px-4 font-['Inter',sans-serif]">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header with Try Pro button */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <img 
              src="/resyft-2.png" 
              alt="Resyft Research Agent" 
              className="w-8 h-8 object-contain" 
            />
            <h1 className="text-xl font-semibold text-slate-900">Research Assistant</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="text-indigo-600 border-indigo-300 hover:bg-indigo-50 bg-white font-medium"
          >
            Try Pro for free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            What research question do you have?
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Get accurate answers with line-by-line scholarly source citations
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1 shadow-sm border border-slate-200">
            <button
              onClick={() => setSelectedMode("general")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                selectedMode === "general"
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setSelectedMode("scholar")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                selectedMode === "scholar"
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              🎓 Scholar
            </button>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mb-8">
          <div className="relative max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-indigo-300 focus-within:shadow-md p-5">
              {/* Main input row */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    ref={landingInputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything"
                    className="w-full text-lg border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-slate-400 p-0 h-auto py-1 text-slate-900"
                    style={{ textDecoration: "none", borderBottom: "none", boxShadow: "none", outline: "none" }}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-5 py-2.5 transition-colors flex-shrink-0"
                  disabled={!inputValue.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm h-8 px-3 rounded-lg font-medium"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Advanced Search
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm h-8 px-3 rounded-lg font-medium"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
                <div className="text-xs text-slate-600 font-medium">Press Enter to search</div>
              </div>
            </div>
          </div>
        </form>

        {/* Agents Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Agents</h2>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
              Beta
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Hypothesis Generator */}
            <div 
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleExampleClick("Generate research hypotheses based on my field of study")}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-2">Hypothesis Generator</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Turn your ideas into research-ready hypotheses
                  </p>
                </div>
              </div>
            </div>

            {/* Citation Recommender */}
            <div 
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleExampleClick("Find citations for my research paper and format them properly")}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors flex-shrink-0">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-2">Citation Recommender</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Find accurate citations for every sentence of your research draft
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-slate-500">Powered by advanced AI research tools</p>
        </div>
      </div>
    </div>
  )

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3 flex-1">
              <img 
                src="/resyft-2.png" 
                alt="Resyft Research Agent" 
                className="w-6 h-6 object-contain" 
              />
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Research Agent</h1>
                <p className="text-xs text-slate-500 font-medium">AI-Powered Research Assistant</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearConversation}
                className="border-slate-200 hover:bg-slate-50 rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col bg-gradient-to-br from-slate-50/50 to-white">
          {messages.length === 0 ? (
            <LandingPage />
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <img 
                              src="/resyft-2.png" 
                              alt="AI" 
                              className="w-4 h-4 object-contain filter brightness-0 invert" 
                            />
                          </div>
                        )}
                        
                        <div className={`max-w-3xl ${
                          message.role === 'user' ? 'ml-16' : 'mr-16'
                        }`}>
                          <Card className={`shadow-sm ${
                            message.role === 'user' 
                              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-0' 
                              : message.error
                                ? 'bg-red-50 border-red-200'
                                : 'bg-white border-slate-200'
                          }`}>
                            <CardContent className="p-4">
                              {message.error && (
                                <div className="flex items-center gap-2 mb-3">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-sm font-medium text-red-700">Service Error</span>
                                </div>
                              )}
                              
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.content}
                              </div>
                              
                              {message.tools_used && message.tools_used.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-3 h-3 text-indigo-600" />
                                    <span className="text-xs font-semibold text-slate-700">Tools used:</span>
                                  </div>
                                  {message.tools_used.map((toolId, index) => (
                                    <Badge 
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 transition-colors px-2 py-1 rounded-full"
                                    >
                                      {toolId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              <div className={`text-xs mt-2 ${
                                message.role === 'user' ? 'text-indigo-100' : 'text-slate-400'
                              }`}>
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {isTyping && <TypingIndicator />}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t bg-white/90 backdrop-blur-sm p-4 shadow-sm">
                  <div className="max-w-4xl mx-auto">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-indigo-300 p-4">
                        <div className="flex items-center gap-3">
                          <input
                            ref={chatInputRef}
                            type="text"
                            placeholder="Ask me anything about your research..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="flex-1 text-base border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-slate-400 p-0 h-auto text-slate-900"
                            style={{ textDecoration: "none", borderBottom: "none", boxShadow: "none", outline: "none" }}
                            disabled={isLoading}
                            autoComplete="off"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!inputValue.trim() || isLoading}
                            className="bg-indigo-500 hover:bg-indigo-600 rounded-xl px-4 py-2 transition-colors flex-shrink-0"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-slate-600 font-medium">Press Enter to send</div>
                          <div className="text-xs text-slate-500">Powered by AI research tools</div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}