'use client'

import Link from 'next/link'
import { Button } from './ui/button'
import { useSupabase } from '@/hooks/use-supabase'

export function Header() {
  const { user, signOut } = useSupabase()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-gray-900">
          Resyft
        </Link>
        
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/projects">
                <Button variant="ghost">Projects</Button>
              </Link>
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}