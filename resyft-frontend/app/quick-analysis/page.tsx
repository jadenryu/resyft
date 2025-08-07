"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Zap,
  Link,
  FileText,
  Brain,
  Quote,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  Download,
  Clock,
  Sparkles,
  ExternalLink,
  ArrowRight
} from "lucide-react"

interface AnalysisResult {
  summary: string
  keyFindings: string[]
  quotes: string[]
  statistics: string[]
  methodology?: string
  limitations?: string
  implications?: string
  relevanceScore: number
  processingTime: number
}

export default function QuickAnalysisPage() {
  const router = useRouter()
  const [inputType, setInputType] = useState<"url" | "text">("url")
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      const validDomains = [
        'arxiv.org', 'pubmed.ncbi.nlm.nih.gov', 'scholar.google.com',
        'sciencedirect.com', 'nature.com', 'science.org', 'ieee.org',
        'springer.com', 'wiley.com', 'plos.org', 'biorxiv.org', 'medrxiv.org'
      ]
      return validDomains.some(domain => url.includes(domain))
    } catch {
      return false
    }
  }

  const handleAnalyze = async () => {
    setErrors([])
    
    // Validation
    if (inputType === "url") {
      if (!url.trim()) {
        setErrors(["Please enter a URL"])
        return
      }
      if (!validateUrl(url)) {
        setErrors(["Please enter a valid academic paper URL from a supported source"])
        return
      }
    } else {
      if (!text.trim()) {
        setErrors(["Please enter text to analyze"])
        return
      }
      if (text.length < 100) {
        setErrors(["Text must be at least 100 characters long"])
        return
      }
    }

    setAnalyzing(true)
    setProgress(0)
    setResult(null)

    // Simulate analysis progress
    const progressSteps = [
      { step: 10, message: "Fetching content..." },
      { step: 30, message: "Extracting text..." },
      { step: 50, message: "Analyzing content..." },
      { step: 70, message: "Identifying key findings..." },
      { step: 90, message: "Generating summary..." },
      { step: 100, message: "Complete!" }
    ]

    for (const { step } of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setProgress(step)
    }

    // Mock analysis result
    const mockResult: AnalysisResult = {
      summary: inputType === "url" 
        ? "This research paper investigates the application of machine learning techniques in medical diagnosis, specifically focusing on early disease detection. The study presents a novel approach combining convolutional neural networks with traditional statistical methods to achieve improved diagnostic accuracy. The authors demonstrate that their proposed method achieves 94.2% accuracy in detecting early-stage diseases, significantly outperforming existing approaches."
        : "The provided text discusses various aspects of research methodology and findings. Key themes include the application of advanced analytical techniques and their implications for the field. The content suggests significant improvements over existing methods with quantifiable results and statistical validation.",
      keyFindings: [
        "Machine learning models achieved 94.2% diagnostic accuracy",
        "Significant improvement over traditional methods (p < 0.001)",
        "Early disease detection capabilities enhanced by 15%",
        "Method applicable across multiple medical domains"
      ],
      quotes: [
        "Our proposed CNN architecture demonstrated a 94.2% accuracy rate in tumor detection, representing a substantial improvement over conventional radiological assessment.",
        "The integration of machine learning with traditional diagnostic methods shows promise for revolutionizing medical practice.",
        "Early detection capabilities are crucial for improving patient outcomes and reducing healthcare costs."
      ],
      statistics: [
        "Accuracy: 94.2% (95% CI: 92.1-96.3%)",
        "Sensitivity: 96.7%",
        "Specificity: 91.8%",
        "Sample size: n=5,432",
        "P-value: < 0.001"
      ],
      methodology: "The study employed a retrospective analysis using convolutional neural networks trained on a dataset of 5,432 medical images. Cross-validation was performed using 5-fold methodology to ensure robustness of results.",
      limitations: "The study was limited to specific types of medical images and may not generalize to all diagnostic scenarios. Further validation across diverse populations is needed.",
      implications: "These findings suggest that AI-assisted diagnosis could significantly improve healthcare outcomes while reducing diagnostic errors and costs.",
      relevanceScore: 87,
      processingTime: 4.2
    }

    await new Promise(resolve => setTimeout(resolve, 500))
    setResult(mockResult)
    setAnalyzing(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportAnalysis = () => {
    if (!result) return
    
    const exportData = {
      input: inputType === "url" ? url : "Text analysis",
      timestamp: new Date().toISOString(),
      ...result
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = 'quick-analysis-result.json'
    a.click()
    URL.revokeObjectURL(downloadUrl)
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Quick Analysis</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Quick Analysis</h2>
                  <p className="text-gray-600">
                    Get instant AI-powered insights from any research paper or text
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Input Interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Analyze Content</CardTitle>
                  <CardDescription>
                    Provide a URL to a research paper or paste text directly for instant analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={inputType} onValueChange={(v) => setInputType(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url" className="flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        Paper URL
                      </TabsTrigger>
                      <TabsTrigger value="text" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Direct Text
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="url" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="url">Research Paper URL</Label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://arxiv.org/abs/... or PubMed URL"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Supported: arXiv, PubMed, Nature, Science, IEEE, Springer, and more
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="text">Text Content</Label>
                        <Textarea
                          id="text"
                          placeholder="Paste the abstract, excerpt, or full text of the research paper here..."
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          className="mt-1 min-h-[150px]"
                          maxLength={10000}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Minimum: 100 characters</span>
                          <span>{text.length}/10,000</span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Error Messages */}
                  {errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Analyze Button */}
                  <Button 
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="w-full"
                    size="lg"
                  >
                    {analyzing ? (
                      <>
                        <Brain className="w-5 h-5 mr-2 animate-pulse" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Analysis Progress */}
            {analyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Processing Analysis</h3>
                        <span className="text-sm text-gray-600">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>
                          {progress < 30 ? "Fetching content..." :
                           progress < 50 ? "Extracting text..." :
                           progress < 70 ? "Analyzing content..." :
                           progress < 90 ? "Identifying key findings..." :
                           progress < 100 ? "Generating summary..." : "Complete!"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Analysis Results */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Results Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <h3 className="text-lg font-semibold">Analysis Complete</h3>
                      <p className="text-sm text-gray-600">
                        Processed in {result.processingTime}s • {result.relevanceScore}% relevance score
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportAnalysis}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button size="sm" onClick={() => router.push('/upload')}>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Add to Project
                    </Button>
                  </div>
                </div>

                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-4">{result.summary}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.summary)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Summary
                    </Button>
                  </CardContent>
                </Card>

                {/* Key Findings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Key Findings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.keyFindings.map((finding, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                          </div>
                          <span className="text-gray-700">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Quotes and Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quotes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Quote className="w-5 h-5" />
                        Key Quotes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.quotes.map((quote, index) => (
                          <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500 relative group">
                            <blockquote className="text-sm text-gray-700 italic">
                              "{quote}"
                            </blockquote>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(quote)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.statistics.map((stat, index) => (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded relative group">
                            {stat}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(stat)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Sections */}
                {(result.methodology || result.limitations || result.implications) && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {result.methodology && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Methodology</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700">{result.methodology}</p>
                        </CardContent>
                      </Card>
                    )}

                    {result.limitations && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Limitations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700">{result.limitations}</p>
                        </CardContent>
                      </Card>
                    )}

                    {result.implications && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Implications</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700">{result.implications}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Info Card */}
            {!analyzing && !result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Quick Analysis</strong> provides instant insights without saving to projects. 
                    For comprehensive analysis and organization, consider uploading papers to your projects.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}