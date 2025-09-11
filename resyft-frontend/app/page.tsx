"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent } from "../components/ui/card"
import { ScrollArea } from "../components/ui/scroll-area"
import { Badge } from "../components/ui/badge"
import { Separator } from "../components/ui/separator"
import { AppSidebar } from "../components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar"
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
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
        <div className="flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          <div className="w-1 h-1 rounded-full bg-blue-200"></div>
        </div>
      </div>
      
      <div className="max-w-4xl mr-8 md:mr-16">
        <div className="bg-slate-50 text-slate-900 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-sm text-slate-600">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  // Mode no longer needed for document assistant
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const landingInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (message?: string, fromLanding?: boolean) => {
    const inputElement = fromLanding ? landingInputRef.current : chatInputRef.current
    const messageToSend = message || (inputElement?.value?.trim() || "")
    if (!messageToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    if (inputElement) inputElement.value = ""
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
          conversation_history: conversationHistory.slice(-10)
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
        response: `I understand you're asking about "${input}". As your RAG database assistant, I can help you query your document corpus, perform vector searches, and provide grounded responses without web data contamination. Please upload documents to build your knowledge base first.`,
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

  // Landing page when no messages - optimized for collapsed sidebar
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center px-6 font-merriweather">
      <div className="w-full max-w-5xl mx-auto">

        {/* Main Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl playfair-bold text-slate-900 mb-4 leading-tight">
            What would you like to know about your RAG database?
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Portable RAG system that builds custom AI models from your documents - trained exclusively on your content with zero hallucination from web data
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-indigo-300 focus-within:shadow-md p-5">
              {/* Main input row */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    ref={landingInputRef}
                    type="text"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(undefined, true)
                      }
                    }}
                    placeholder="Query your private RAG database..."
                    className="w-full text-lg border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-slate-400"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleSubmit(undefined, true)
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-5 py-2.5 transition-colors flex-shrink-0"
                  disabled={isLoading}
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
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm h-8 px-3 rounded-lg merriweather-regular"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Advanced Search
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm h-8 px-3 rounded-lg merriweather-regular"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
                <div className="text-xs text-slate-600 merriweather-regular">Press Enter to search</div>
              </div>
            </div>
          </div>
        </div>

        {/* Research Tools Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl playfair-semibold text-slate-900">RAG Database Features</h2>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
              Zero Hallucination
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Paper Analysis Agent */}
            <div 
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleExampleClick("What are the main risk factors mentioned across my RAG database?")}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="playfair-regular text-slate-900 mb-2">RAG Vector Search</h3>
                  <p className="text-slate-600 text-sm leading-relaxed merriweather-light">
                    Query your document embeddings to find semantic patterns across your entire knowledge base
                  </p>
                </div>
              </div>
            </div>

            {/* Literature Search */}
            <div 
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleExampleClick("Find all contract payment terms in my document corpus")}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors flex-shrink-0">
                  <Search className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="playfair-regular text-slate-900 mb-2">Document-Grounded Retrieval</h3>
                  <p className="text-slate-600 text-sm leading-relaxed merriweather-light">
                    Retrieval-augmented generation ensures responses are grounded in your documents only
                  </p>
                </div>
              </div>
            </div>
            
            {/* Data Synthesis Agent */}
            <div 
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleExampleClick("Generate insights from my document corpus without external data contamination")}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="playfair-regular text-slate-900 mb-2">RAG-Based Analysis</h3>
                  <p className="text-slate-600 text-sm leading-relaxed merriweather-light">
                    AI analysis trained exclusively on your document vectors—no web contamination
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-slate-500">Powered by Resyft Portable RAG Database</p>
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
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <div className="w-1 h-1 rounded-full bg-blue-300"></div>
              </div>
              <div>
                <h1 className="text-lg playfair-semibold text-slate-900">RAG Assistant</h1>
                <p className="text-xs text-slate-500 merriweather-regular">Document-Only AI Models</p>
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
                <ScrollArea className="flex-1 p-4 md:p-6 lg:p-8">
                  <div className="max-w-5xl mx-auto space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <div className="flex items-center gap-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              <div className="w-1 h-1 rounded-full bg-blue-200"></div>
                            </div>
                          </div>
                        )}
                        
                        <div className={`max-w-4xl ${
                          message.role === 'user' ? 'ml-8 md:ml-16' : 'mr-8 md:mr-16'
                        }`}>
                          <div className={`rounded-2xl px-4 py-3 ${
                            message.role === 'user' 
                              ? 'bg-indigo-500 text-white ml-auto' 
                              : message.error
                                ? 'bg-red-50 border border-red-200 text-red-800'
                                : 'bg-slate-50 text-slate-900'
                          }`}>
                              {message.error && (
                                <div className="flex items-center gap-2 mb-3">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-sm merriweather-regular text-red-700">Service Error</span>
                                </div>
                              )}
                              
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.content}
                              </div>
                              
                              {message.tools_used && message.tools_used.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-3 h-3 text-indigo-600" />
                                    <span className="text-xs merriweather-bold text-slate-700">Tools used:</span>
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
                          </div>
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
                <div className="border-t bg-white/90 backdrop-blur-sm p-4 md:p-6 shadow-sm">
                  <div className="max-w-5xl mx-auto">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-indigo-300 p-4">
                        <div className="flex items-center gap-3">
                          <input
                            ref={chatInputRef}
                            type="text"
                            placeholder="Query your document embeddings..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit()
                              }
                            }}
                            className="flex-1 text-base border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-slate-400"
                            disabled={isLoading}
                            autoComplete="off"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isLoading}
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
                          <div className="text-xs text-slate-600 merriweather-regular">Press Enter to send</div>
                          <div className="text-xs text-slate-500">RAG-based AI</div>
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