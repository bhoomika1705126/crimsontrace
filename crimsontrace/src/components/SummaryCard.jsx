export default function SummaryCard({ summary }) {
  if (!summary) return null

  const items = [
    {
      label: 'ACCOUNTS ANALYZED',
      value: summary.total_accounts_analyzed,
      icon: '👥',
      color: 'from-blue-600 to-blue-400'
    },
    {
      label: 'SUSPICIOUS FLAGGED',
      value: summary.suspicious_accounts_flagged,
      icon: '⚠️',
      color: 'from-rose-600 to-rose-400'
    },
    {
      label: 'FRAUD RINGS',
      value: summary.fraud_rings_detected,
      icon: '🔄',
      color: 'from-purple-600 to-purple-400'
    },
    {
      label: 'PROCESSING TIME',
      value: `${summary.processing_time_seconds?.toFixed(1)}s`,
      icon: '⚡',
      color: 'from-emerald-600 to-emerald-400'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="relative group"
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-lg opacity-0 group-hover:opacity-10 transition-opacity`} />
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6">
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-3xl font-rajdhani font-bold text-white">
                {item.value}
              </span>
            </div>
            <p className="text-xs font-rajdhani tracking-wider text-slate-600">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}