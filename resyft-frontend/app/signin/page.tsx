'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/projects')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Molecular structure background */}
      <div className="absolute inset-0 pointer-events-none opacity-8">
        <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
          <g className="animate-pulse">
            <circle cx="100" cy="100" r="6" fill="#3B82F6" opacity="0.2" />
            <circle cx="180" cy="80" r="4" fill="#06B6D4" opacity="0.2" />
            <circle cx="150" cy="160" r="5" fill="#8B5CF6" opacity="0.2" />
            <line x1="100" y1="100" x2="180" y2="80" stroke="#3B82F6" strokeWidth="1" opacity="0.15" />
            <line x1="100" y1="100" x2="150" y2="160" stroke="#06B6D4" strokeWidth="1" opacity="0.15" />
            <line x1="180" y1="80" x2="150" y2="160" stroke="#8B5CF6" strokeWidth="1" opacity="0.15" />
          </g>
        </svg>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl text-display bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-600 text-body-premium">
              Sign in to continue analyzing research papers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200"
              >
                {message}
              </motion.div>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 inter-regular">
                Don't have an account?{' '}
                <Link href="/signup" className="text-blue-600 hover:text-blue-700 inter-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 inter-regular">
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}