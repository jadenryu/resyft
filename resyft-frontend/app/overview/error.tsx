'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react'

export default function OverviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to console
    console.error('Overview page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle>Overview Loading Error</CardTitle>
          <CardDescription>
            There was an issue loading your research overview data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>This might be due to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Corrupted project data</li>
              <li>Navigation state issues</li>
              <li>Temporary browser storage problems</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}