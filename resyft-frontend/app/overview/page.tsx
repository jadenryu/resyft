"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  BarChart3,
  FileText,
  Clock,
  TrendingUp,
  Users,
  Target,
  Plus,
  ArrowRight,
  BookOpen,
  Star,
  Zap,
  Calendar,
  Activity,
  Award,
  CheckCircle
} from "lucide-react"

interface DashboardStats {
  totalProjects: number
  totalPapers: number
  hoursAnalyzed: number
  avgRelevanceScore: number
}

interface RecentActivity {
  id: string
  type: 'project_created' | 'paper_analyzed' | 'settings_updated'
  title: string
  description: string
  timestamp: string
}

export default function OverviewPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalPapers: 0,
    hoursAnalyzed: 0,
    avgRelevanceScore: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load dashboard data from localStorage
    const loadDashboardData = () => {
      const savedProjects = localStorage.getItem('resyft_projects')
      const projects = savedProjects ? JSON.parse(savedProjects) : []
      
      // Calculate stats
      const totalPapers = projects.reduce((acc: number, project: any) => acc + project.papers.length, 0)
      
      // Calculate hours saved based on actual processing times or estimate
      let hoursAnalyzed = 0
      if (totalPapers > 0) {
        const allPapers = projects.flatMap((project: any) => project.papers)
        const papersWithResults = allPapers.filter((paper: any) => paper.analysisResult?.metadata?.processing_time)
        
        if (papersWithResults.length > 0) {
          // Calculate actual time saved (assuming 30min manual analysis per paper - processing time)
          const actualProcessingTime = papersWithResults.reduce((acc: number, paper: any) => 
            acc + (paper.analysisResult.metadata.processing_time / 3600), 0) // Convert seconds to hours
          const estimatedManualTime = totalPapers * 0.5 // 30 minutes per paper
          hoursAnalyzed = Math.max(0, Math.round(estimatedManualTime - actualProcessingTime))
        } else {
          // Fallback to estimate if no processing times available
          hoursAnalyzed = Math.round(totalPapers * 0.5) // Estimate 30 min saved per paper
        }
      }
      
      // Calculate average relevance score from actual analysis results
      let avgRelevanceScore = 0
      if (totalPapers > 0) {
        const allPapers = projects.flatMap((project: any) => project.papers)
        const papersWithRelevance = allPapers.filter((paper: any) => paper.analysisResult?.relevance?.relevance_score)
        
        if (papersWithRelevance.length > 0) {
          const totalRelevance = papersWithRelevance.reduce((acc: number, paper: any) => 
            acc + paper.analysisResult.relevance.relevance_score, 0)
          avgRelevanceScore = Math.round(totalRelevance / papersWithRelevance.length)
        } else {
          // If no analysis results yet, show 0 instead of hardcoded value
          avgRelevanceScore = 0
        }
      }
      
      setStats({
        totalProjects: projects.length,
        totalPapers,
        hoursAnalyzed,
        avgRelevanceScore
      })

      // Generate recent activity
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'project_created',
          title: 'Welcome to Resyft!',
          description: 'Your dashboard is ready. Create your first project to get started.',
          timestamp: new Date().toISOString()
        }
      ]

      if (projects.length > 0) {
        activities.unshift({
          id: '2',
          type: 'project_created',
          title: `Project "${projects[0].name}" created`,
          description: 'Ready for paper analysis and extraction',
          timestamp: projects[0].createdAt
        })
      }

      setRecentActivity(activities)
      setLoading(false)
    }

    loadDashboardData()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created':
        return <Plus className="w-4 h-4" />
      case 'paper_analyzed':
        return <FileText className="w-4 h-4" />
      case 'settings_updated':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
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
              <h1 className="text-xl font-semibold">Research Overview</h1>
            </div>
            <Button 
              onClick={() => router.push('/projects/new')} 
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
                  <p className="text-gray-600 mt-1">Here's an overview of your research progress</p>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  <Zap className="w-4 h-4 mr-1" />
                  AI-Powered
                </Badge>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                {
                  title: "Active Projects",
                  value: stats.totalProjects,
                  icon: Target,
                  color: "text-blue-600",
                  bg: "bg-blue-50"
                },
                {
                  title: "Papers Analyzed",
                  value: stats.totalPapers,
                  icon: FileText,
                  color: "text-green-600",
                  bg: "bg-green-50"
                },
                {
                  title: "Hours Saved",
                  value: stats.hoursAnalyzed,
                  icon: Clock,
                  color: "text-purple-600",
                  bg: "bg-purple-50"
                },
                {
                  title: "Avg Relevance",
                  value: `${stats.avgRelevanceScore}%`,
                  icon: Star,
                  color: "text-yellow-600",
                  bg: "bg-yellow-50"
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>
                      Common tasks to accelerate your research
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/projects/new')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Project
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/quick-analysis')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Quick Paper Analysis
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/settings')}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Configure Extraction Settings
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/upload')}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Your latest research actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentActivity.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                              <p className="text-xs text-gray-500">{activity.description}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No recent activity yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Progress & Tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      Getting Started
                    </CardTitle>
                    <CardDescription>
                      Complete these steps to maximize your research efficiency
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${stats.totalProjects > 0 ? 'text-green-600' : 'text-gray-300'}`} />
                        <span className="text-sm text-gray-700">Create your first project</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${stats.totalPapers > 0 ? 'text-green-600' : 'text-gray-300'}`} />
                        <span className="text-sm text-gray-700">Analyze your first paper</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-gray-300" />
                        <span className="text-sm text-gray-700">Configure extraction settings</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-gray-300" />
                        <span className="text-sm text-gray-700">Invite team collaborators</span>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2">Research Progress</p>
                        <Progress value={Math.min(100, (stats.totalProjects * 25) + (stats.totalPapers * 10))} className="h-2" />
                        <p className="text-xs text-gray-400 mt-1">
                          {Math.min(100, (stats.totalProjects * 25) + (stats.totalPapers * 10))}% Complete
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Getting Started CTA */}
            {stats.totalProjects === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="mt-8"
              >
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardContent className="p-8 text-center">
                    <div className="max-w-2xl mx-auto">
                      <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Ready to start your research journey?
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Create your first project to organize papers, extract insights, and generate citation-ready text powered by AI.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button 
                          onClick={() => router.push('/projects/new')}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Create First Project
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => router.push('/quick-analysis')}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          Try Quick Analysis
                        </Button>
                      </div>
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