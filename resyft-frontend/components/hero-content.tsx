"use client"

export default function HeroContent() {
  return (
    <main className="absolute bottom-8 left-8 z-20 max-w-lg">
      <div className="text-left">
        <div
          className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm mb-4 relative"
          style={{
            filter: "url(#glass-effect)",
          }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
          <span className="text-white/90 text-xs font-light relative z-10">🔍 Advanced Document Analysis</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl md:leading-16 tracking-tight font-light text-white mb-4">
          <span className="merriweather-regular italic instrument">Intelligent</span> Document
          <br />
          <span className="font-light tracking-tight text-white">Analysis</span>
        </h1>

        {/* Description */}
        <p className="text-xs font-light text-white/70 mb-6 leading-relaxed">
          Transform your documents with AI-powered analysis. Extract insights, identify patterns, and unlock valuable
          information from any document format with precision and speed.
        </p>

        <div className="mb-6">
          <div className="flex items-center gap-6 text-xs text-white/60">
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 bg-white/40 rounded-full"></div>
              OCR & Text Extraction
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 bg-white/40 rounded-full"></div>
              Data Classification
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 bg-white/40 rounded-full"></div>
              Smart Insights
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4 flex-wrap">
          <button className="px-8 py-3 rounded-full bg-transparent border border-white/30 text-white font-normal text-xs transition-all duration-200 hover:bg-white/10 hover:border-white/50 cursor-pointer">
            View Demo
          </button>
          <button className="px-8 py-3 rounded-full bg-white text-black font-normal text-xs transition-all duration-200 hover:bg-white/90 cursor-pointer">
            Start Analysis
          </button>
        </div>
      </div>
    </main>
  )
}