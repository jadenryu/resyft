'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the confirmation link!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating geometric shapes */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full border-2 border-blue-300 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 rounded-lg border-2 border-cyan-300 rotate-45 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 rounded-full border-2 border-purple-300 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 rounded-lg border-2 border-indigo-300 rotate-12 animate-pulse"></div>
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
              Join Resyft
            </CardTitle>
            <CardDescription className="text-gray-600 text-body-premium">
              Create an account to start analyzing research papers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
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
                  placeholder="Create a password"
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            
            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mt-4 p-3 rounded-md text-sm ${
                  message.includes('Check your email') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message}
              </motion.div>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 inter-regular">
                Already have an account?{' '}
                <Link href="/signin" className="text-blue-600 hover:text-blue-700 inter-medium">
                  Sign in
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