import { useState } from 'react'

export default function RingsTable({ fraudRings = [], suspiciousAccounts = [], onRingSelect }) {
  const [expandedRing, setExpandedRing] = useState(null)
  const [hoveredRing, setHoveredRing] = useState(null)

  if (!fraudRings || fraudRings.length === 0) {
    return (
      <div className="text-center py-12 text-slate-600 font-share text-sm">
        No fraud rings detected
      </div>
    )
  }

  // Create a map of account to ring for quick lookup
  const accountToRingMap = new Map()
  suspiciousAccounts.forEach(acc => {
    if (acc.ring_id) {
      if (!accountToRingMap.has(acc.ring_id)) {
        accountToRingMap.set(acc.ring_id, [])
      }
      accountToRingMap.get(acc.ring_id).push(acc.account_id)
    }
  })

  // ===========================================
  // WOW FEATURE 2: RISK-O-METER BADGES
  // Visual indicators with color coding and animations
  // ===========================================
  const getRiskBadge = (score, patternType) => {
    // Determine pattern icon
    const patternIcon = patternType?.includes('cycle') ? '🔄' :
                       patternType?.includes('fan_in') ? '📥' :
                       patternType?.includes('fan_out') ? '📤' :
                       patternType?.includes('shell') ? '🐚' : '⚠️'

    // Critical risk (85-100)
    if (score >= 85) {
      return {
        bg: 'bg-rose-500/20',
        text: 'text-rose-500',
        border: 'border-rose-500/30',
        label: 'CRITICAL',
        icon: '🔥',
        pulse: true
      }
    }
    // High risk (60-84)
    else if (score >= 60) {
      return {
        bg: 'bg-orange-500/20',
        text: 'text-orange-500',
        border: 'border-orange-500/30',
        label: 'HIGH',
        icon: '⚠️',
        pulse: false
      }
    }
    // Medium risk (40-59)
    else if (score >= 40) {
      return {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-500',
        border: 'border-yellow-500/30',
        label: 'MEDIUM',
        icon: '⚡',
        pulse: false
      }
    }
    // Low risk (0-39)
    else {
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-500',
        border: 'border-blue-500/30',
        label: 'LOW',
        icon: 'ℹ️',
        pulse: false
      }
    }
  }

  // Get pattern type display
  const getPatternDisplay = (patternType) => {
    const patterns = {
      'cycle': { icon: '🔄', label: 'Cycle', desc: 'Circular fund routing' },
      'fan_in': { icon: '📥', label: 'Fan-in', desc: 'Multiple senders to one' },
      'fan_out': { icon: '📤', label: 'Fan-out', desc: 'One sender to many' },
      'shell': { icon: '🐚', label: 'Shell', desc: 'Layered pass-through' },
      'mixed': { icon: '🔀', label: 'Mixed', desc: 'Multiple patterns' }
    }
    return patterns[patternType] || { icon: '🔄', label: patternType, desc: '' }
  }

  const handleRowClick = (ringId) => {
    setExpandedRing(expandedRing === ringId ? null : ringId)
    if (onRingSelect) {
      onRingSelect(ringId)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="px-4 py-3 text-left text-xs font-rajdhani tracking-wider text-slate-600">RING ID</th>
            <th className="px-4 py-3 text-left text-xs font-rajdhani tracking-wider text-slate-600">PATTERN</th>
            <th className="px-4 py-3 text-left text-xs font-rajdhani tracking-wider text-slate-600">MEMBERS</th>
            <th className="px-4 py-3 text-left text-xs font-rajdhani tracking-wider text-slate-600">RISK SCORE</th>
            <th className="px-4 py-3 text-left text-xs font-rajdhani tracking-wider text-slate-600">ACCOUNTS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {fraudRings.map((ring) => {
            const isExpanded = expandedRing === ring.ring_id
            const isHovered = hoveredRing === ring.ring_id
            const members = accountToRingMap.get(ring.ring_id) || ring.member_accounts || []
            const displayAccounts = isExpanded ? members : members.slice(0, 3)
            const hasMore = members.length > 3
            const riskBadge = getRiskBadge(ring.risk_score, ring.pattern_type)
            const pattern = getPatternDisplay(ring.pattern_type)

            return (
              <tr 
                key={ring.ring_id}
                className={`
                  transition-all cursor-pointer
                  ${isHovered ? 'bg-slate-800/50 scale-[1.02] shadow-lg' : 'hover:bg-slate-800/30'}
                  ${isExpanded ? 'bg-slate-800/30' : ''}
                `}
                onClick={() => handleRowClick(ring.ring_id)}
                onMouseEnter={() => setHoveredRing(ring.ring_id)}
                onMouseLeave={() => setHoveredRing(null)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-share text-slate-400">{ring.ring_id}</span>
                    {riskBadge.pulse && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 group">
                    <span className="text-lg">{pattern.icon}</span>
                    <span className="px-2 py-1 text-xs font-share bg-slate-800 border border-slate-700 rounded">
                      {pattern.label}
                    </span>
                    {/* Tooltip with description */}
                    <div className="absolute hidden group-hover:block bg-slate-900 text-xs text-slate-400 p-2 rounded border border-slate-700 -mt-8 ml-12 z-10">
                      {pattern.desc}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-share text-slate-400">{members.length}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Risk-o-Meter Bar */}
                    <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${riskBadge.bg.replace('/20', '')}`}
                        style={{ 
                          width: `${ring.risk_score}%`,
                          backgroundColor: ring.risk_score >= 85 ? '#e11d48' :
                                         ring.risk_score >= 60 ? '#f97316' :
                                         ring.risk_score >= 40 ? '#eab308' : '#3b82f6'
                        }}
                      />
                    </div>
                    {/* Badge */}
                    <span className={`
                      px-2 py-1 text-xs font-share font-bold rounded-full
                      ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border} border
                      ${riskBadge.pulse ? 'animate-pulse' : ''}
                    `}>
                      {riskBadge.icon} {ring.risk_score?.toFixed(1)}% {riskBadge.label}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {displayAccounts.map(acc => (
                      <span 
                        key={acc}
                        className="px-2 py-0.5 text-xs font-share bg-slate-800 border border-slate-700 text-slate-400 rounded hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 transition-all cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('Account selected:', acc)
                        }}
                      >
                        {acc}
                      </span>
                    ))}
                    {hasMore && !isExpanded && (
                      <span className="px-2 py-0.5 text-xs font-share text-slate-600">
                        +{members.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Pattern Detection Legend */}
      <div className="mt-4 pt-4 border-t border-slate-800/50">
        <p className="text-xs font-rajdhani tracking-wider text-slate-600 mb-2">PATTERN DETECTION KEY</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-share">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-rose-500">🔄</span> Cycle (3-5 length)
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-orange-500">📥</span> Fan-in (10+ → 1)
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-yellow-500">📤</span> Fan-out (1 → 10+)
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-emerald-500">🐚</span> Shell (3+ hops)
          </div>
        </div>
      </div>
    </div>
  )
}