'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to form viewer with a new form ID
    router.push('/forms/new')
  }, [router])

  return null
}
