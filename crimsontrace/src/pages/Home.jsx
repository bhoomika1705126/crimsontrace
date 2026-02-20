import { useState, useEffect } from 'react'
import Uploader from '../components/Uploader'
import GraphView from '../components/GraphView'
import RingsTable from '../components/RingsTable'
import SummaryCard from '../components/SummaryCard'
import DownloadButton from '../components/DownloadButton'
import { useAnalysis } from '../hooks/useAnalysis'

export default function Home() {
  const [file, setFile] = useState(null)
  const [selectedRingId, setSelectedRingId] = useState(null)
  const [isFilterOn, setIsFilterOn] = useState(false) // Ghost mode filter
  const { data, loading, error, progress, analyze, reset } = useAnalysis()

  const handleFile = (f) => {
    setFile(f)
  }

  const handleAnalyze = () => {
    if (file) analyze(file)
  }

  const handleReset = () => {
    setFile(null)
    setSelectedRingId(null)
    setIsFilterOn(false)
    reset()
  }

  const handleRingSelect = (ringId) => {
    setSelectedRingId(ringId)
  }

  // Debug logging
  useEffect(() => {
    if (data) {
      console.log('✅ Data received:', {
        accounts: data.suspicious_accounts?.length,
        rings: data.fraud_rings?.length,
        summary: data.summary
      })
    }
  }, [data])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="mb-12 text-center">
        <div className="inline-block p-4 mb-4 relative">
          <h1 className="text-6xl font-bold font-rajdhani tracking-wider">
            <span className="text-white">CRIMSON</span>
            <span className="text-rose-500 glow-text">TRACE</span>
          </h1>
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-rose-500/20 blur-3xl -z-10 animate-pulse" />
        </div>
        <p className="text-lg text-slate-400 font-share tracking-wider">
          Financial Forensics Engine · Money Muling Detection · Graph Analysis
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <span className="px-3 py-1 text-xs font-share bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full animate-pulse">
            ● SYSTEM ONLINE
          </span>
          <span className="px-3 py-1 text-xs font-share bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full">
            RIFT 2026
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Upload Section - Show only when no data or loading */}
        {(!data || loading) && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-rajdhani tracking-wider text-slate-500">01</span>
              <h2 className="text-lg font-rajdhani font-semibold tracking-wider text-slate-400">
                UPLOAD TRANSACTION DATA
              </h2>
            </div>
            
            <Uploader onFile={handleFile} disabled={loading} />

            {/* Progress Bar */}
            {loading && (
              <div className="mt-6">
                <div className="flex justify-between mb-2 text-xs font-share">
                  <span className="text-slate-500">
                    {progress < 30 ? 'Uploading...' : 
                     progress < 70 ? 'Analyzing graph...' : 
                     progress < 90 ? 'Detecting rings...' : 'Finalizing...'}
                  </span>
                  <span className="text-rose-500">{progress}%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-800 to-rose-500 rounded-full transition-all duration-300 relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-rose-400 blur-sm animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className={`relative px-8 py-3 font-rajdhani font-bold tracking-wider text-white rounded-lg transition-all flex items-center gap-2 overflow-hidden group ${
                  !file || loading
                    ? 'bg-slate-800 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-700 to-rose-500 hover:from-rose-600 hover:to-rose-400 shadow-lg shadow-rose-500/30'
                }`}
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    ANALYZING...
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ANALYZE TRANSACTIONS
                  </>
                )}
              </button>

              {(data || error) && (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 font-rajdhani font-semibold tracking-wider text-slate-400 bg-transparent border border-slate-700 rounded-lg hover:border-slate-500 hover:text-slate-300 transition-all"
                >
                  ↺ RESET
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-3 text-orange-500 font-share text-sm animate-shake">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Results Section - Show when data is available */}
        {data && !loading && (
          <div className="space-y-8 animate-fadeInUp">
            {/* Summary Cards */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-rajdhani tracking-wider text-slate-500">02</span>
                <h2 className="text-lg font-rajdhani font-semibold tracking-wider text-slate-400">
                  ANALYSIS SUMMARY
                </h2>
              </div>
              <SummaryCard summary={data.summary} />
            </div>

            {/* Graph Controls */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-sm font-rajdhani tracking-wider text-slate-500">03</span>
                <h2 className="text-lg font-rajdhani font-semibold tracking-wider text-slate-400">
                  TRANSACTION NETWORK
                </h2>
              </div>
              
              {/* WOW FEATURE 4: GHOST MODE TOGGLE */}
              <label className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800/50 transition-all group">
                <span className="text-sm font-share text-slate-400 group-hover:text-rose-400 transition-colors">
                  👻 FOCUS ON FRAUD
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isFilterOn}
                    onChange={(e) => setIsFilterOn(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${isFilterOn ? 'bg-rose-500' : 'bg-slate-700'}`}>
                    <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${isFilterOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
                {isFilterOn && (
                  <span className="text-[10px] font-share text-rose-500 animate-pulse">
                    GHOST MODE ACTIVE
                  </span>
                )}
              </label>
            </div>

            {/* Graph Visualization */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <GraphView 
                data={data} 
                selectedRingId={selectedRingId}
                isFilterOn={isFilterOn}
              />
            </div>

            {/* Fraud Rings Table */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-rajdhani tracking-wider text-slate-500">04</span>
                <h2 className="text-lg font-rajdhani font-semibold tracking-wider text-slate-400">
                  FRAUD RINGS DETECTED
                </h2>
                {data.fraud_rings && (
                  <span className="ml-auto px-3 py-1 text-xs font-rajdhani tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full animate-pulse">
                    {data.fraud_rings.length} RINGS
                  </span>
                )}
              </div>
              <RingsTable
                fraudRings={data.fraud_rings}
                suspiciousAccounts={data.suspicious_accounts}
                onRingSelect={handleRingSelect}
              />
            </div>

            {/* Download Button */}
            <div className="flex justify-center">
              <DownloadButton data={data} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-slate-800/50 text-center">
        <p className="text-xs font-share text-slate-800 tracking-wider">
          CRIMSONTRACE · RIFT HACKATHON 2026 · MONEY MULING DETECTION · GRAPH THEORY TRACK
        </p>
      </footer>

      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}