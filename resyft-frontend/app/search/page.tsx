"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import { AppSidebar } from "../../components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import {
  Search,
  Filter,
  SortAsc,
  FileText,
  ExternalLink,
  Calendar,
  Users,
  BookOpen,
  ArrowRight,
  Zap,
  TrendingUp,
  Clock,
  Star,
  Plus
} from "lucide-react"

interface SearchResult {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
  abstract: string
  doi?: string
  url?: string
  citationCount: number
  relevanceScore: number
  tags: string[]
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState("relevance")
  const [yearFilter, setYearFilter] = useState("all")
  const [fieldFilter, setFieldFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("database")

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: "1",
      title: "Advanced Machine Learning Techniques in Healthcare Diagnosis",
      authors: ["Smith, J.", "Johnson, K.", "Williams, R."],
      journal: "Nature Medicine",
      year: 2024,
      abstract: "This study presents novel machine learning approaches for medical diagnosis, achieving 94% accuracy in early disease detection. Our methodology combines deep neural networks with traditional statistical methods to provide robust and interpretable results.",
      doi: "10.1038/s41591-024-12345",
      url: "https://doi.org/10.1038/s41591-024-12345",
      citationCount: 127,
      relevanceScore: 94,
      tags: ["machine-learning", "healthcare", "diagnosis"]
    },
    {
      id: "2",
      title: "Climate Change Impacts on Coastal Ecosystems: A Global Analysis",
      authors: ["Brown, A.", "Davis, L.", "Wilson, M.", "Garcia, S."],
      journal: "Environmental Science & Policy",
      year: 2024,
      abstract: "Comprehensive analysis of climate change effects on coastal ecosystems worldwide. Our findings indicate significant biodiversity loss and ecosystem disruption, with urgent need for conservation strategies.",
      citationCount: 89,
      relevanceScore: 87,
      tags: ["climate-change", "ecosystems", "conservation"]
    },
    {
      id: "3",
      title: "Quantum Computing Applications in Cryptography and Security",
      authors: ["Chen, X.", "Rodriguez, P."],
      journal: "IEEE Transactions on Information Theory",
      year: 2023,
      abstract: "Exploration of quantum computing's impact on modern cryptographic systems. We demonstrate both vulnerabilities in current encryption methods and propose quantum-resistant alternatives.",
      citationCount: 203,
      relevanceScore: 82,
      tags: ["quantum-computing", "cryptography", "security"]
    }
  ]

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    
    // Simulate API search
    setTimeout(() => {
      const filtered = mockResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.abstract.toLowerCase().includes(query.toLowerCase()) ||
        result.authors.some(author => author.toLowerCase().includes(query.toLowerCase())) ||
        result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
      
      setResults(filtered)
      setLoading(false)
    }, 1500)
  }

  const handleAddToProject = (resultId: string) => {
    // Would integrate with project selection modal in real app
    console.log("Add to project:", resultId)
  }

  const filteredResults = results.filter(result => {
    if (yearFilter !== "all") {
      const currentYear = new Date().getFullYear()
      if (yearFilter === "recent" && result.year < currentYear - 2) return false
      if (yearFilter === "last5" && result.year < currentYear - 5) return false
    }
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case "relevance":
        return b.relevanceScore - a.relevanceScore
      case "citations":
        return b.citationCount - a.citationCount
      case "year":
        return b.year - a.year
      case "title":
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Search Papers</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Search Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Discover Research Papers
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Search through millions of academic papers from top journals and conferences. 
                Find relevant research to support your projects.
              </p>
            </motion.div>

            {/* Search Interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <Card>
                <CardContent className="p-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="database">Database Search</TabsTrigger>
                      <TabsTrigger value="semantic">Semantic Search</TabsTrigger>
                    </TabsList>

                    <TabsContent value="database" className="space-y-4 mt-6">
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search by title, author, keywords, or DOI..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-10"
                          />
                        </div>
                        <Button onClick={handleSearch} disabled={loading || !query.trim()}>
                          {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Search className="w-4 h-4 mr-2" />
                          )}
                          Search
                        </Button>
                      </div>

                      {/* Filters */}
                      <div className="flex flex-wrap gap-3">
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-[150px]">
                            <SortAsc className="w-4 h-4 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relevance">Relevance</SelectItem>
                            <SelectItem value="citations">Citation Count</SelectItem>
                            <SelectItem value="year">Publication Year</SelectItem>
                            <SelectItem value="title">Title A-Z</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={yearFilter} onValueChange={setYearFilter}>
                          <SelectTrigger className="w-[130px]">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            <SelectItem value="recent">Last 2 Years</SelectItem>
                            <SelectItem value="last5">Last 5 Years</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={fieldFilter} onValueChange={setFieldFilter}>
                          <SelectTrigger className="w-[130px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Fields</SelectItem>
                            <SelectItem value="cs">Computer Science</SelectItem>
                            <SelectItem value="medicine">Medicine</SelectItem>
                            <SelectItem value="physics">Physics</SelectItem>
                            <SelectItem value="biology">Biology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="semantic" className="space-y-4 mt-6">
                      <div className="text-center py-8">
                        <Zap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          AI-Powered Semantic Search
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Find papers by meaning, not just keywords. Describe your research question in natural language.
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* Search Results */}
            {query && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {loading ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Searching Database
                      </h3>
                      <p className="text-gray-600">
                        Finding relevant papers for "{query}"...
                      </p>
                    </CardContent>
                  </Card>
                ) : filteredResults.length > 0 ? (
                  <div className="space-y-6">
                    {/* Results Header */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        Found {filteredResults.length} results for "{query}"
                      </h3>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Bulk Add to Project
                      </Button>
                    </div>

                    {/* Results List */}
                    <div className="space-y-4">
                      {filteredResults.map((result, index) => (
                        <motion.div
                          key={result.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 cursor-pointer">
                                    {result.title}
                                  </h3>
                                  <p className="text-gray-600 text-sm mb-2">
                                    {result.authors.join(", ")} • {result.journal} • {result.year}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                    <div className="flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      <span>{result.citationCount} citations</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3" />
                                      <span>{result.relevanceScore}% match</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddToProject(result.id)}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                  </Button>
                                  {result.url && (
                                    <Button variant="outline" size="sm">
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-medium text-sm mb-1">Abstract</h4>
                                  <p className="text-gray-600 text-sm leading-relaxed">
                                    {result.abstract}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                  {result.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Load More */}
                    <div className="text-center pt-6">
                      <Button variant="outline">
                        Load More Results
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No results found
                      </h3>
                      <p className="text-gray-600">
                        Try adjusting your search terms or filters to find relevant papers.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* Trending Topics */}
            {!query && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Trending Research Topics
                    </CardTitle>
                    <CardDescription>
                      Popular research areas this month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { topic: "Machine Learning", papers: 2847, trend: "+12%" },
                        { topic: "Climate Change", papers: 1923, trend: "+8%" },
                        { topic: "Quantum Computing", papers: 856, trend: "+23%" },
                        { topic: "Gene Therapy", papers: 1247, trend: "+15%" },
                        { topic: "Renewable Energy", papers: 2156, trend: "+7%" },
                        { topic: "Neural Networks", papers: 1834, trend: "+18%" }
                      ].map(item => (
                        <div
                          key={item.topic}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setQuery(item.topic)
                            handleSearch()
                          }}
                        >
                          <h4 className="font-medium text-sm mb-1">{item.topic}</h4>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{item.papers.toLocaleString()} papers</span>
                            <span className="text-green-600">{item.trend}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}