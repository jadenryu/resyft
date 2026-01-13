'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { createClient } from '../lib/supabase'

const categories = {
  medical: ['Patient Care', 'Research', 'Healthcare Admin', 'Medical Records', 'Prescriptions', 'Lab Results'],
  business: ['Sales', 'Marketing', 'Operations', 'HR', 'Contracts', 'Invoicing'],
  finance: ['Banking', 'Investments', 'Tax Forms', 'Budgeting', 'Insurance', 'Accounting'],
  education: ['Student Records', 'Grading', 'Curriculum', 'Attendance', 'Enrollment', 'Scholarships'],
  personal: ['Travel', 'Events', 'Surveys', 'Applications', 'Registration', 'Memberships']
}

type CategoryKey = keyof typeof categories

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [currentCategory, setCurrentCategory] = useState<CategoryKey>('medical')
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const togglePurpose = (purpose: string) => {
    setSelectedPurposes(prev =>
      prev.includes(purpose)
        ? prev.filter(p => p !== purpose)
        : [...prev, purpose]
    )
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          name,
          purposes: selectedPurposes
        }
      }
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the confirmation link!')
    }
    setLoading(false)
  }

  const canProceed = step === 1 ? (name && email && password) : selectedPurposes.length > 0

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSignUp} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl playfair-bold">
          {step === 1 ? 'Create Account' : 'Pick Your Purpose'}
        </h1>
        <p className="text-muted-foreground text-sm text-balance">
          {step === 1
            ? 'Sign up to start filling forms smarter'
            : 'Select the categories that match your needs'}
        </p>
      </div>

      {step === 1 ? (
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!canProceed}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(categories) as CategoryKey[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCurrentCategory(cat)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full capitalize transition-colors",
                  currentCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Purpose Tags */}
          <div className="flex flex-wrap gap-2 min-h-[100px]">
            {categories[currentCategory].map(purpose => (
              <button
                key={purpose}
                type="button"
                onClick={() => togglePurpose(purpose)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md border transition-colors",
                  selectedPurposes.includes(purpose)
                    ? "bg-blue-100 border-blue-600 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                )}
              >
                {purpose}
              </button>
            ))}
          </div>

          {/* Selected Count */}
          {selectedPurposes.length > 0 && (
            <p className="text-sm text-gray-600">
              {selectedPurposes.length} selected: {selectedPurposes.join(', ')}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading || !canProceed}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </div>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm border ${
          message.includes('Check your email')
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="text-center text-sm">
        Already have an account?{" "}
        <a href="/login" className="underline underline-offset-4 text-blue-600 hover:text-blue-700">
          Sign in
        </a>
      </div>
    </form>
  )
}