"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import { BackNavigation } from "@/components/back-navigation"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Settings,
  Sliders,
  Brain,
  FileText,
  Quote,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Info,
  Save,
  Zap,
  Target,
  Filter,
  Sparkles,
  Clock,
  RefreshCw
} from "lucide-react"

interface ExtractionSettings {
  quotes: {
    enabled: boolean
    maxPerPaper: number
    minLength: number
    maxLength: number
    priority: 'relevance' | 'novelty' | 'statistical'
  }
  statistics: {
    enabled: boolean
    includeConfidenceIntervals: boolean
    includePValues: boolean
    includeEffectSizes: boolean
    minSampleSize: number
  }
  summaries: {
    length: 'brief' | 'moderate' | 'detailed'
    focusAreas: string[]
    includeMethodology: boolean
    includeLimitations: boolean
    includeImplications: boolean
  }
  relevanceScoring: {
    keywordWeight: number
    citationWeight: number
    recencyWeight: number
    methodologyWeight: number
    customKeywords: string[]
  }
  outputFormat: {
    citationStyle: 'apa' | 'mla' | 'chicago' | 'harvard'
    includePageNumbers: boolean
    includeDOI: boolean
    groupByTheme: boolean
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ExtractionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("extraction")

  useEffect(() => {
    // Load settings from localStorage
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('resyft_extraction_settings')
      const defaultSettings: ExtractionSettings = {
        quotes: {
          enabled: true,
          maxPerPaper: 5,
          minLength: 50,
          maxLength: 300,
          priority: 'relevance'
        },
        statistics: {
          enabled: true,
          includeConfidenceIntervals: true,
          includePValues: true,
          includeEffectSizes: false,
          minSampleSize: 30
        },
        summaries: {
          length: 'moderate',
          focusAreas: ['methodology', 'results', 'conclusions'],
          includeMethodology: true,
          includeLimitations: true,
          includeImplications: true
        },
        relevanceScoring: {
          keywordWeight: 40,
          citationWeight: 25,
          recencyWeight: 20,
          methodologyWeight: 15,
          customKeywords: []
        },
        outputFormat: {
          citationStyle: 'apa',
          includePageNumbers: true,
          includeDOI: true,
          groupByTheme: false
        }
      }

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      } else {
        setSettings(defaultSettings)
      }
      setLoading(false)
    }

    loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    if (!settings) return

    setErrors([])
    setSaving(true)

    try {
      // Save to localStorage first
      localStorage.setItem('resyft_extraction_settings', JSON.stringify(settings))
      
      // Also send to API endpoint to validate integration
      const testResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paper_url: 'test-validation',
          extraction_type: 'all',
          settings: settings
        }),
      })

      if (testResponse.ok) {
        const testData = await testResponse.json()
        console.log('Settings integration validated:', testData.system_prompt ? 'Success' : 'Failed')
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Settings save error:', error)
      setErrors(["Settings saved locally but integration test failed. This won't affect functionality."])
    }
    
    setSaving(false)
  }

  const resetToDefaults = () => {
    const defaultSettings: ExtractionSettings = {
      quotes: {
        enabled: true,
        maxPerPaper: 5,
        minLength: 50,
        maxLength: 300,
        priority: 'relevance'
      },
      statistics: {
        enabled: true,
        includeConfidenceIntervals: true,
        includePValues: true,
        includeEffectSizes: false,
        minSampleSize: 30
      },
      summaries: {
        length: 'moderate',
        focusAreas: ['methodology', 'results', 'conclusions'],
        includeMethodology: true,
        includeLimitations: true,
        includeImplications: true
      },
      relevanceScoring: {
        keywordWeight: 40,
        citationWeight: 25,
        recencyWeight: 20,
        methodologyWeight: 15,
        customKeywords: []
      },
      outputFormat: {
        citationStyle: 'apa',
        includePageNumbers: true,
        includeDOI: true,
        groupByTheme: false
      }
    }
    setSettings(defaultSettings)
  }

  const addCustomKeyword = (keyword: string) => {
    if (keyword && settings && !settings.relevanceScoring.customKeywords.includes(keyword)) {
      setSettings({
        ...settings,
        relevanceScoring: {
          ...settings.relevanceScoring,
          customKeywords: [...settings.relevanceScoring.customKeywords, keyword]
        }
      })
    }
  }

  const removeCustomKeyword = (keyword: string) => {
    if (settings) {
      setSettings({
        ...settings,
        relevanceScoring: {
          ...settings.relevanceScoring,
          customKeywords: settings.relevanceScoring.customKeywords.filter(k => k !== keyword)
        }
      })
    }
  }

  if (loading) {
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!settings) {
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <p className="text-gray-600">Settings not found</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <BackNavigation />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Extraction Settings</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Defaults
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Customize AI Analysis:</strong> Configure how Resyft extracts quotes, statistics, and summaries from your research papers. These settings will apply to all new paper analyses.
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Settings Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="extraction" className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Extraction
                  </TabsTrigger>
                  <TabsTrigger value="quotes" className="flex items-center gap-2">
                    <Quote className="w-4 h-4" />
                    Quotes
                  </TabsTrigger>
                  <TabsTrigger value="scoring" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Scoring
                  </TabsTrigger>
                  <TabsTrigger value="output" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Output
                  </TabsTrigger>
                </TabsList>

                {/* Extraction Tab */}
                <TabsContent value="extraction" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Statistical Data Extraction
                      </CardTitle>
                      <CardDescription>
                        Configure what statistical information to extract from papers
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Enable Statistics Extraction</Label>
                          <p className="text-xs text-gray-600">Extract numerical data, p-values, and effect sizes</p>
                        </div>
                        <Switch
                          checked={settings.statistics.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            statistics: { ...settings.statistics, enabled: checked }
                          })}
                        />
                      </div>

                      {settings.statistics.enabled && (
                        <div className="space-y-4 pl-4 border-l-2 border-blue-100">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Include Confidence Intervals</Label>
                            <Switch
                              checked={settings.statistics.includeConfidenceIntervals}
                              onCheckedChange={(checked) => setSettings({
                                ...settings,
                                statistics: { ...settings.statistics, includeConfidenceIntervals: checked }
                              })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Include P-Values</Label>
                            <Switch
                              checked={settings.statistics.includePValues}
                              onCheckedChange={(checked) => setSettings({
                                ...settings,
                                statistics: { ...settings.statistics, includePValues: checked }
                              })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Include Effect Sizes</Label>
                            <Switch
                              checked={settings.statistics.includeEffectSizes}
                              onCheckedChange={(checked) => setSettings({
                                ...settings,
                                statistics: { ...settings.statistics, includeEffectSizes: checked }
                              })}
                            />
                          </div>

                          <div>
                            <Label className="text-sm">Minimum Sample Size</Label>
                            <div className="mt-2 flex items-center gap-4">
                              <Slider
                                value={[settings.statistics.minSampleSize]}
                                onValueChange={(value) => setSettings({
                                  ...settings,
                                  statistics: { ...settings.statistics, minSampleSize: value[0] }
                                })}
                                max={1000}
                                min={1}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-sm font-medium w-12 text-center">
                                {settings.statistics.minSampleSize}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Only extract statistics from studies with at least this many participants
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Summary Configuration
                      </CardTitle>
                      <CardDescription>
                        Control the length and focus of generated summaries
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Summary Length</Label>
                        <Select
                          value={settings.summaries.length}
                          onValueChange={(value) => setSettings({
                            ...settings,
                            summaries: { ...settings.summaries, length: value as any }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="brief">Brief (50-100 words)</SelectItem>
                            <SelectItem value="moderate">Moderate (150-300 words)</SelectItem>
                            <SelectItem value="detailed">Detailed (400-600 words)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Include in Summary</Label>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Methodology Details</Label>
                          <Switch
                            checked={settings.summaries.includeMethodology}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              summaries: { ...settings.summaries, includeMethodology: checked }
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Study Limitations</Label>
                          <Switch
                            checked={settings.summaries.includeLimitations}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              summaries: { ...settings.summaries, includeLimitations: checked }
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Practical Implications</Label>
                          <Switch
                            checked={settings.summaries.includeImplications}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              summaries: { ...settings.summaries, includeImplications: checked }
                            })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Quotes Tab */}
                <TabsContent value="quotes" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Quote className="w-5 h-5" />
                        Quote Extraction Settings
                      </CardTitle>
                      <CardDescription>
                        Customize how direct quotes are selected and formatted
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Enable Quote Extraction</Label>
                          <p className="text-xs text-gray-600">Extract meaningful direct quotes from papers</p>
                        </div>
                        <Switch
                          checked={settings.quotes.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            quotes: { ...settings.quotes, enabled: checked }
                          })}
                        />
                      </div>

                      {settings.quotes.enabled && (
                        <div className="space-y-4 pl-4 border-l-2 border-purple-100">
                          <div>
                            <Label className="text-sm">Maximum Quotes per Paper</Label>
                            <div className="mt-2 flex items-center gap-4">
                              <Slider
                                value={[settings.quotes.maxPerPaper]}
                                onValueChange={(value) => setSettings({
                                  ...settings,
                                  quotes: { ...settings.quotes, maxPerPaper: value[0] }
                                })}
                                max={15}
                                min={1}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-sm font-medium w-12 text-center">
                                {settings.quotes.maxPerPaper}
                              </span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">Quote Length Range</Label>
                            <div className="mt-2 space-y-2">
                              <div>
                                <Label className="text-xs text-gray-600">Minimum Length (characters)</Label>
                                <div className="flex items-center gap-4 mt-1">
                                  <Slider
                                    value={[settings.quotes.minLength]}
                                    onValueChange={(value) => setSettings({
                                      ...settings,
                                      quotes: { ...settings.quotes, minLength: value[0] }
                                    })}
                                    max={200}
                                    min={20}
                                    step={10}
                                    className="flex-1"
                                  />
                                  <span className="text-sm font-medium w-12 text-center">
                                    {settings.quotes.minLength}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Maximum Length (characters)</Label>
                                <div className="flex items-center gap-4 mt-1">
                                  <Slider
                                    value={[settings.quotes.maxLength]}
                                    onValueChange={(value) => setSettings({
                                      ...settings,
                                      quotes: { ...settings.quotes, maxLength: value[0] }
                                    })}
                                    max={500}
                                    min={100}
                                    step={25}
                                    className="flex-1"
                                  />
                                  <span className="text-sm font-medium w-12 text-center">
                                    {settings.quotes.maxLength}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">Quote Selection Priority</Label>
                            <Select
                              value={settings.quotes.priority}
                              onValueChange={(value) => setSettings({
                                ...settings,
                                quotes: { ...settings.quotes, priority: value as any }
                              })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="relevance">Most Relevant to Topic</SelectItem>
                                <SelectItem value="novelty">Novel Insights</SelectItem>
                                <SelectItem value="statistical">Statistical Findings</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Scoring Tab */}
                <TabsContent value="scoring" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Relevance Scoring Weights
                      </CardTitle>
                      <CardDescription>
                        Configure how papers are scored for relevance to your research
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Keyword Matching</Label>
                          <div className="mt-2 flex items-center gap-4">
                            <Slider
                              value={[settings.relevanceScoring.keywordWeight]}
                              onValueChange={(value) => setSettings({
                                ...settings,
                                relevanceScoring: { ...settings.relevanceScoring, keywordWeight: value[0] }
                              })}
                              max={100}
                              min={0}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12 text-center">
                              {settings.relevanceScoring.keywordWeight}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">Citation Count</Label>
                          <div className="mt-2 flex items-center gap-4">
                            <Slider
                              value={[settings.relevanceScoring.citationWeight]}
                              onValueChange={(value) => setSettings({
                                ...settings,
                                relevanceScoring: { ...settings.relevanceScoring, citationWeight: value[0] }
                              })}
                              max={100}
                              min={0}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12 text-center">
                              {settings.relevanceScoring.citationWeight}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">Publication Recency</Label>
                          <div className="mt-2 flex items-center gap-4">
                            <Slider
                              value={[settings.relevanceScoring.recencyWeight]}
                              onValueChange={(value) => setSettings({
                                ...settings,
                                relevanceScoring: { ...settings.relevanceScoring, recencyWeight: value[0] }
                              })}
                              max={100}
                              min={0}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12 text-center">
                              {settings.relevanceScoring.recencyWeight}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">Methodology Quality</Label>
                          <div className="mt-2 flex items-center gap-4">
                            <Slider
                              value={[settings.relevanceScoring.methodologyWeight]}
                              onValueChange={(value) => setSettings({
                                ...settings,
                                relevanceScoring: { ...settings.relevanceScoring, methodologyWeight: value[0] }
                              })}
                              max={100}
                              min={0}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12 text-center">
                              {settings.relevanceScoring.methodologyWeight}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Total weight: {settings.relevanceScoring.keywordWeight + settings.relevanceScoring.citationWeight + settings.relevanceScoring.recencyWeight + settings.relevanceScoring.methodologyWeight}%
                          {(settings.relevanceScoring.keywordWeight + settings.relevanceScoring.citationWeight + settings.relevanceScoring.recencyWeight + settings.relevanceScoring.methodologyWeight) !== 100 && 
                            " (weights will be normalized to 100%)"
                          }
                        </AlertDescription>
                      </Alert>

                      <div>
                        <Label className="text-sm font-medium">Custom Keywords</Label>
                        <p className="text-xs text-gray-600 mb-2">
                          Add specific terms that should boost relevance scores
                        </p>
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="Add keyword..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addCustomKeyword((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = ''
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const input = document.querySelector('input[placeholder="Add keyword..."]') as HTMLInputElement
                              if (input) {
                                addCustomKeyword(input.value)
                                input.value = ''
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        {settings.relevanceScoring.customKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {settings.relevanceScoring.customKeywords.map(keyword => (
                              <Badge key={keyword} variant="secondary" className="gap-1">
                                {keyword}
                                <button
                                  onClick={() => removeCustomKeyword(keyword)}
                                  className="ml-1 hover:text-red-500"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Output Tab */}
                <TabsContent value="output" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Output Formatting
                      </CardTitle>
                      <CardDescription>
                        Configure how extracted information is formatted and presented
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Citation Style</Label>
                        <Select
                          value={settings.outputFormat.citationStyle}
                          onValueChange={(value) => setSettings({
                            ...settings,
                            outputFormat: { ...settings.outputFormat, citationStyle: value as any }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apa">APA Style</SelectItem>
                            <SelectItem value="mla">MLA Style</SelectItem>
                            <SelectItem value="chicago">Chicago Style</SelectItem>
                            <SelectItem value="harvard">Harvard Style</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Include in Citations</Label>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Page Numbers</Label>
                          <Switch
                            checked={settings.outputFormat.includePageNumbers}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              outputFormat: { ...settings.outputFormat, includePageNumbers: checked }
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm">DOI Links</Label>
                          <Switch
                            checked={settings.outputFormat.includeDOI}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              outputFormat: { ...settings.outputFormat, includeDOI: checked }
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Group by Theme</Label>
                          <Switch
                            checked={settings.outputFormat.groupByTheme}
                            onCheckedChange={(checked) => setSettings({
                              ...settings,
                              outputFormat: { ...settings.outputFormat, groupByTheme: checked }
                            })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Error Messages */}
              {errors.length > 0 && (
                <Alert variant="destructive" className="mt-6">
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

              {/* Success Message */}
              {success && (
                <Alert className="border-green-200 bg-green-50 mt-6">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Settings saved successfully! These changes will apply to all new paper analyses.
                  </AlertDescription>
                </Alert>
              )}

              {/* Save Button */}
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="min-w-[140px]"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}