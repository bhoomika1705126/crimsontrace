import { useState } from 'react'

export default function DownloadButton({ data }) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleDownload = () => {
    // Show success animation
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)

    // Create a clean copy without any extra fields (exact format required)
    const cleanData = {
      suspicious_accounts: data.suspicious_accounts || [],
      fraud_rings: data.fraud_rings || [],
      summary: data.summary || {}
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `CrimsonTrace_Forensics_${timestamp}.json`

    // Create and download file
    const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('📥 Report downloaded:', filename)
  }

  return (
    <div className="relative">
      {/* Confetti effect (simplified) */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-rose-500 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      <button
        onClick={handleDownload}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative px-8 py-4 font-rajdhani font-bold tracking-wider text-white bg-gradient-to-r from-rose-700 to-rose-500 rounded-lg shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-3 group overflow-hidden"
      >
        {/* Animated background effect */}
        <div className={`absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-400 transition-transform duration-500 ${isHovered ? 'translate-x-0' : '-translate-x-full'}`} />
        
        {/* Button content */}
        <span className="relative z-10 flex items-center gap-3">
          <svg 
            className="w-5 h-5 group-hover:animate-bounce" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="tracking-wider">EXPORT JSON REPORT</span>
          <span className="text-xs opacity-70">JSON</span>
        </span>

        {/* Sparkle effects */}
        {isHovered && (
          <>
            <div className="absolute top-0 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" />
            <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
          </>
        )}
      </button>

      {/* Success toast */}
      {showConfetti && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-rose-500/30 text-rose-400 px-4 py-2 rounded-lg shadow-xl animate-fadeInUp whitespace-nowrap font-share text-sm">
          ✅ Report downloaded successfully!
        </div>
      )}
    </div>
  )
}