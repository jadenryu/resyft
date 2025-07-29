"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  FileText,
  Users,
  Home,
  BarChart3,
  Upload,
  FolderOpen,
  Search,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Research User",
    email: "user@resyft.com",
    avatar: "/resyft-2.png",
  },
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: FolderOpen,
      items: [
        {
          title: "All Projects",
          url: "/projects",
        },
        {
          title: "Create New",
          url: "/projects/new",
        },
      ],
    },
    {
      title: "Upload Paper",
      url: "/upload",
      icon: Upload,
    },
    {
      title: "Search",
      url: "/search",
      icon: Search,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Help",
      url: "/help",
      icon: HelpCircle,
    },
  ],
  projects: [
    {
      name: "Machine Learning Research",
      url: "/projects/ml-research",
      icon: Bot,
    },
    {
      name: "Climate Studies",
      url: "/projects/climate",
      icon: PieChart,
    },
    {
      name: "Medical Analysis",
      url: "/projects/medical",
      icon: FileText,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <img 
                    src="/resyft-2.png" 
                    alt="Resyft" 
                    className="size-6 object-contain" 
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Resyft</span>
                  <span className="truncate text-xs">Research Analysis</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}