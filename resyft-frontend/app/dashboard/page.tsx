"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  FileText,
  Upload,
  FolderOpen,
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
  Plus,
  Search,
  BookOpen,
  Brain,
  Sparkles,
  FileSearch,
  ChevronRight
} from "lucide-react"
import { motion } from "framer-motion"
import { GuidedTour, DASHBOARD_TOUR } from "@/components/guided-tour"

interface RecentProject {
  id: string
  name: string
  sources: number
  lastUpdated: string
  progress: number
}

interface QuickAction {
  icon: React.ReactNode
  title: string
  description: string
  action: string
  href: string
}

export default function Dashboard() {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setRecentProjects([
        {
          id: "1",
          name: "Climate Change Research",
          sources: 12,
          lastUpdated: "2 hours ago",
          progress: 75
        },
        {
          id: "2",
          name: "Machine Learning Applications",
          sources: 8,
          lastUpdated: "1 day ago",
          progress: 45
        },
        {
          id: "3",
          name: "Medical Studies Review",
          sources: 5,
          lastUpdated: "3 days ago",
          progress: 30
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const quickActions: QuickAction[] = [
    {
      icon: <Upload className="w-5 h-5" />,
      title: "Upload Your First Paper",
      description: "Start by uploading a research paper to analyze",
      action: "Upload Paper",
      href: "/upload"
    },
    {
      icon: <FolderOpen className="w-5 h-5" />,
      title: "Create a Project",
      description: "Organize your research into themed projects",
      action: "New Project",
      href: "/projects/new"
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: "Search Papers",
      description: "Find relevant research from our database",
      action: "Search",
      href: "/search"
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Quick Analysis",
      description: "Paste text or URL for instant analysis",
      action: "Analyze",
      href: "/quick-analysis"
    }
  ]

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <GuidedTour 
        tourId="dashboard-welcome" 
        steps={DASHBOARD_TOUR}
        onComplete={() => console.log("Dashboard tour completed")}
      />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Research Dashboard</h1>
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Quick Upload
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Welcome back, Researcher
                    </h2>
                    <p className="text-gray-600">
                      You've analyzed 24 papers this month. Keep up the great work!
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <Sparkles className="w-12 h-12 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200">
                    <a href={action.href}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            {action.icon}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                        <p className="text-xs text-gray-600">{action.description}</p>
                      </CardContent>
                    </a>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Stats and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Statistics */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">This Month's Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600">Papers Analyzed</span>
                    </div>
                    <span className="font-semibold">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Quotes Extracted</span>
                    </div>
                    <span className="font-semibold">142</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-600">Stats Captured</span>
                    </div>
                    <span className="font-semibold">89</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-600">Time Saved</span>
                    </div>
                    <span className="font-semibold">~12 hrs</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Projects */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Recent Projects</CardTitle>
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentProjects.map((project) => (
                        <div
                          key={project.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-sm">{project.name}</h4>
                              <p className="text-xs text-gray-600">
                                {project.sources} sources • Updated {project.lastUpdated}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {project.progress}%
                            </Badge>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Papers Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Recent Papers</CardTitle>
                <Tabs defaultValue="all" className="w-auto">
                  <TabsList className="h-8">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="starred" className="text-xs">Starred</TabsTrigger>
                    <TabsTrigger value="processing" className="text-xs">Processing</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <>
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileSearch className="w-8 h-8 text-gray-400" />
                        <div>
                          <h5 className="font-medium text-sm">
                            Impact of Climate Change on Coastal Ecosystems
                          </h5>
                          <p className="text-xs text-gray-600">
                            Nature • 2024 • 15 pages
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700">Completed</Badge>
                        <Button variant="ghost" size="sm">
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileSearch className="w-8 h-8 text-gray-400" />
                        <div>
                          <h5 className="font-medium text-sm">
                            Deep Learning Applications in Medical Imaging
                          </h5>
                          <p className="text-xs text-gray-600">
                            IEEE • 2024 • 22 pages
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-700">Processing</Badge>
                        <Button variant="ghost" size="sm">
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="border-dashed">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Need help getting started?</h4>
                    <p className="text-sm text-gray-600">
                      Check out our guide on how to make the most of Resyft
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Guide
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}