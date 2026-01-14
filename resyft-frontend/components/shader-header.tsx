"use client"

import Link from "next/link"

export default function ShaderHeader() {
  return (
    <header className="relative z-20 flex items-center justify-between p-6">
      {/* Logo */}
      <div className="flex items-center">
        <span className="text-xl font-semibold text-white">Resyft</span>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center space-x-2">
        <a
          href="#features"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Features
        </a>
        <a
          href="#testimonials-section"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Testimonials
        </a>
        <a
          href="#faq-section"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          FAQ
        </a>
      </nav>

      {/* Login Button Group */}
      <div className="flex items-center gap-3">
        <Link href="/login">
          <button className="text-white/80 hover:text-white text-xs font-light px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-200">
            Sign In
          </button>
        </Link>
        <Link href="/signup">
          <button className="px-6 py-2 rounded-full bg-white text-black font-medium text-xs transition-all duration-300 hover:bg-white/90">
            Get Started
          </button>
        </Link>
      </div>
    </header>
  )
}
