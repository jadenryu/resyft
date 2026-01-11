"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { ScrollArea } from "../components/ui/scroll-area"
import { Badge } from "../components/ui/badge"
import { Separator } from "../components/ui/separator"
import { AppSidebar } from "../components/app-sidebar"
import {
  Header,
  SimpleTwoColumn,
} from "../components/ui/header"


export default function TwoColumnApp() {
  return (
    <><Header></Header>
    <SimpleTwoColumn></SimpleTwoColumn></>
  )
}