import { useRef, useEffect, useCallback, useState } from 'react'

export default function GraphView({ data, selectedRingId, isFilterOn }) {
  const containerRef = useRef(null)
  const fgRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const [graphLoaded, setGraphLoaded] = useState(false)
  const [GraphComponent, setGraphComponent] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [hoveredLink, setHoveredLink] = useState(null)

  // Load graph library
  useEffect(() => {
    import('react-force-graph-2d').then(mod => {
      setGraphComponent(() => mod.default)
      setGraphLoaded(true)
    }).catch(err => {
      console.error('Failed to load graph library:', err)
      setGraphLoaded('error')
    })
  }, [])

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 500
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // ===========================================
  // TRANSFORM DATA - STABLE & CLEAN
  // ===========================================
  const getGraphData = () => {
    if (!data) return { nodes: [], links: [] }

    // Create map of suspicious accounts
    const suspiciousMap = new Map()
    data.suspicious_accounts?.forEach(acc => {
      suspiciousMap.set(acc.account_id, acc)
    })

    // Collect all unique account IDs
    const accountIds = new Set()
    data.suspicious_accounts?.forEach(acc => accountIds.add(acc.account_id))
    data.fraud_rings?.forEach(ring => ring.member_accounts?.forEach(id => accountIds.add(id)))
    data.all_nodes?.forEach(id => accountIds.add(id))

    const sortedIds = Array.from(accountIds).sort()
    
    // CREATE NODES with fixed positions
    const nodes = sortedIds.map((id, index) => {
      const suspicious = suspiciousMap.get(id)
      const isSuspicious = !!suspicious
      const patterns = suspicious?.detected_patterns || []
      
      // Determine pattern type and colors
      let color = '#94a3b8'
      let borderColor = '#64748b'
      let size = 6
      let patternIcon = '⚪'
      let patternName = 'Normal'
      
      if (isSuspicious) {
        size = 10
        if (patterns.some(p => p.includes('cycle'))) {
          color = '#e11d48'
          borderColor = '#9f1239'
          patternIcon = '🔄'
          patternName = 'Cycle'
        } else if (patterns.includes('fan_in')) {
          color = '#f97316'
          borderColor = '#c2410c'
          patternIcon = '📥'
          patternName = 'Fan-in'
        } else if (patterns.includes('fan_out')) {
          color = '#eab308'
          borderColor = '#a16207'
          patternIcon = '📤'
          patternName = 'Fan-out'
        } else if (patterns.some(p => p.includes('shell'))) {
          color = '#84cc16'
          borderColor = '#4d7c0f'
          patternIcon = '🐚'
          patternName = 'Shell'
        } else {
          color = '#e11d48'
          borderColor = '#9f1239'
          patternIcon = '⚠️'
          patternName = 'Suspicious'
        }
      }

      // Fixed positions in a circle layout - NO RANDOMNESS
      const angle = (index / sortedIds.length) * 2 * Math.PI
      const radius = 150

      return {
        id: String(id),
        name: String(id),
        displayName: id.startsWith('ACC_') ? id.replace('ACC_', '') : id,
        isSuspicious,
        suspicion_score: suspicious?.suspicion_score || 0,
        detected_patterns: patterns,
        patternIcon,
        patternName,
        ringId: suspicious?.ring_id,
        color,
        borderColor,
        val: size,
        // FIXED POSITIONS - NO MOVEMENT
        x: 400 + radius * Math.cos(angle),
        y: 250 + radius * Math.sin(angle),
        fx: 400 + radius * Math.cos(angle), // Fixed x
        fy: 250 + radius * Math.sin(angle)  // Fixed y
      }
    })

    // CREATE EDGES
    let links = []
    if (data.fraud_rings) {
      data.fraud_rings.forEach(ring => {
        const members = ring.member_accounts || []
        const pattern = ring.pattern_type?.toLowerCase() || ''
        
        let color = '#94a3b8'
        let patternIcon = '➡️'
        let patternName = 'Normal'
        
        if (pattern.includes('cycle')) {
          color = '#e11d48'
          patternIcon = '🔄'
          patternName = 'Cycle'
        } else if (pattern.includes('fan_in')) {
          color = '#f97316'
          patternIcon = '📥'
          patternName = 'Fan-in'
        } else if (pattern.includes('fan_out')) {
          color = '#eab308'
          patternIcon = '📤'
          patternName = 'Fan-out'
        } else if (pattern.includes('shell')) {
          color = '#84cc16'
          patternIcon = '🐚'
          patternName = 'Shell'
        }
        
        if (pattern.includes('cycle')) {
          for (let i = 0; i < members.length; i++) {
            links.push({
              source: String(members[i]),
              target: String(members[(i + 1) % members.length]),
              pattern: 'cycle',
              patternIcon,
              patternName,
              color,
              isSuspicious: true
            })
          }
        } else if (pattern.includes('fan_in') && members.length >= 2) {
          const receiver = members[members.length - 1]
          for (let i = 0; i < members.length - 1; i++) {
            links.push({
              source: String(members[i]),
              target: String(receiver),
              pattern: 'fan_in',
              patternIcon,
              patternName,
              color,
              isSuspicious: true
            })
          }
        } else if (pattern.includes('fan_out') && members.length >= 2) {
          const sender = members[0]
          for (let i = 1; i < members.length; i++) {
            links.push({
              source: String(sender),
              target: String(members[i]),
              pattern: 'fan_out',
              patternIcon,
              patternName,
              color,
              isSuspicious: true
            })
          }
        } else if (pattern.includes('shell')) {
          for (let i = 0; i < members.length - 1; i++) {
            links.push({
              source: String(members[i]),
              target: String(members[i + 1]),
              pattern: 'shell',
              patternIcon,
              patternName,
              color,
              isSuspicious: true
            })
          }
        }
      })
    }

    // Remove duplicates
    const uniqueLinks = []
    const linkSet = new Set()
    links.forEach(link => {
      const key = `${link.source}-${link.target}`
      if (!linkSet.has(key)) {
        linkSet.add(key)
        uniqueLinks.push(link)
      }
    })

    // Apply ghost filter
    if (isFilterOn) {
      const suspiciousIds = new Set(nodes.filter(n => n.isSuspicious).map(n => n.id))
      return {
        nodes: nodes.filter(n => n.isSuspicious),
        links: uniqueLinks.filter(l => suspiciousIds.has(l.source) && suspiciousIds.has(l.target))
      }
    }

    return { nodes, links: uniqueLinks }
  }

  const graphData = getGraphData()

  // Zoom to selected ring
  useEffect(() => {
    if (selectedRingId && fgRef.current && graphData.nodes.length) {
      const ringNodes = graphData.nodes.filter(n => n.ringId === selectedRingId)
      if (ringNodes.length && ringNodes[0].x) {
        const x = ringNodes.reduce((sum, n) => sum + n.x, 0) / ringNodes.length
        const y = ringNodes.reduce((sum, n) => sum + n.y, 0) / ringNodes.length
        fgRef.current.centerAt(x, y, 1000)
        fgRef.current.zoom(2.5, 1000)
      }
    }
  }, [selectedRingId])

  // ===========================================
  // INTERACTIVE HANDLERS
  // ===========================================
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node)
    if (fgRef.current && node.x) {
      fgRef.current.centerAt(node.x, node.y, 800)
      fgRef.current.zoom(2, 800)
    }
  }, [])

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node)
    document.body.style.cursor = node ? 'pointer' : 'default'
  }, [])

  const handleLinkHover = useCallback((link) => {
    setHoveredLink(link)
  }, [])

  // ===========================================
  // CUSTOM NODE RENDERING
  // ===========================================
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    if (!node?.x || !node?.y) return

    const isSelected = selectedNode?.id === node.id
    const isHovered = hoveredNode?.id === node.id
    const r = node.isSuspicious ? 10 : 6

    // Glow for hovered/selected
    if (isHovered || isSelected) {
      ctx.shadowColor = node.color
      ctx.shadowBlur = 20
    }

    // Draw node
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = node.color
    ctx.fill()

    // White border
    ctx.shadowBlur = 0
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1
    ctx.stroke()

    // Pattern icon
    if (node.isSuspicious && globalScale > 0.7) {
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(node.patternIcon, node.x, node.y)
    }

    // Label
    if (globalScale > 0.6) {
      ctx.font = '9px "Share Tech Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#1e293b'
      ctx.fillText(node.displayName, node.x, node.y + r + 4)
    }
  }, [selectedNode, hoveredNode])

  // ===========================================
  // CUSTOM LINK RENDERING
  // ===========================================
  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    if (!link.source?.x || !link.source?.y || !link.target?.x || !link.target?.y) return

    const isHovered = hoveredLink === link
    const start = link.source
    const end = link.target

    // Draw line
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.strokeStyle = link.color || '#94a3b8'
    ctx.lineWidth = isHovered ? 4 : link.isSuspicious ? 2.5 : 1.5
    ctx.stroke()

    // Draw arrow
    const dx = end.x - start.x
    const dy = end.y - start.y
    const angle = Math.atan2(dy, dx)
    
    const arrowSize = isHovered ? 8 : 6
    ctx.save()
    ctx.translate(end.x, end.y)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(-arrowSize, -arrowSize/2)
    ctx.lineTo(0, 0)
    ctx.lineTo(-arrowSize, arrowSize/2)
    ctx.fillStyle = link.color || '#94a3b8'
    ctx.fill()
    ctx.restore()
  }, [hoveredLink])

  if (!data) {
    return (
      <div ref={containerRef} className="w-full h-[500px] flex items-center justify-center bg-white border border-gray-200 rounded-lg">
        <p className="text-gray-500 font-share">Upload CSV to visualize</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-[500px] bg-white rounded-lg overflow-hidden border border-gray-200">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="text-xs font-rajdhani text-gray-600 mb-2">PATTERNS</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-xs">🔄 Cycle</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className="text-xs">📥 Fan-in</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-xs">📤 Fan-out</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-lime-500"></div><span className="text-xs">🐚 Shell</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400"></div><span className="text-xs">⚪ Normal</span></div>
        </div>
      </div>
      // Add this right after your legend - makes patterns EXPLICIT


      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 border border-gray-200 rounded-lg p-2 text-[10px] shadow-lg">
        <div>🖱️ Hover → Details</div>
        <div>👆 Click → Select</div>
        <div>🔍 Scroll → Zoom</div>
        {isFilterOn && <div className="text-rose-600 font-bold mt-1">👻 GHOST MODE</div>}
      </div>

      {/* Stats */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 border border-gray-200 rounded-lg px-3 py-1 shadow-lg">
        <span className="text-xs font-share">{graphData.nodes.length} nodes · {graphData.links.length} edges</span>
      </div>

      {/* =========================================== */}
      {/* GRAPH - COMPLETELY STABLE, NO MOVEMENT */}
      {/* =========================================== */}
      {GraphComponent ? (
        <GraphComponent
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={500}
          backgroundColor="#ffffff"
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={() => 'replace'}
          linkCanvasObject={linkCanvasObject}
          linkCanvasObjectMode={() => 'replace'}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
          
          // 🚨 CRITICAL: These settings PREVENT JUMBLING
          cooldownTicks={0}           // NO animation after initial render
          cooldownTime={0}             // NO cooldown period
          warmupTicks={0}              // NO warmup
          d3AlphaDecay={1}             // Instant decay
          d3VelocityDecay={1}           // No velocity
          
          // Node positions are FIXED - no force simulation
          nodeRelSize={1}
          enableNodeDrag={false}        // Disable dragging to prevent movement
        />
      ) : (
        <div className="flex items-center justify-center h-full">Loading...</div>
      )}

      {/* Hover Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border-2 rounded-lg p-3 shadow-2xl z-50 min-w-[200px]"
             style={{ borderColor: hoveredNode.color }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{hoveredNode.patternIcon}</span>
            <span className="font-bold text-sm">{hoveredNode.displayName}</span>
          </div>
          <p className="text-xs text-gray-600">{hoveredNode.patternName}</p>
          {hoveredNode.isSuspicious && (
            <p className="text-xs mt-1">Score: {hoveredNode.suspicion_score?.toFixed(1)}%</p>
          )}
        </div>
      )}

      {/* Selected Node Panel */}
      {selectedNode && (
        <div className="absolute bottom-0 right-0 w-72 bg-white border-l-2 border-t-2 rounded-tl-xl p-4 shadow-2xl z-40"
             style={{ borderColor: selectedNode.color }}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{selectedNode.patternIcon}</span>
              <span className="font-bold">{selectedNode.displayName}</span>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          
          <p className="text-xs text-gray-500 mb-2">{selectedNode.patternName}</p>
          
          {selectedNode.isSuspicious && (
            <>
              <div className="h-2 w-full bg-gray-100 rounded-full mb-2">
                <div className="h-2 rounded-full" style={{ width: `${selectedNode.suspicion_score}%`, backgroundColor: selectedNode.color }} />
              </div>
              <p className="text-xs mb-2">Risk Score: {selectedNode.suspicion_score?.toFixed(1)}%</p>
              
              {selectedNode.detected_patterns?.map((p, i) => (
                <div key={i} className="text-xs bg-gray-50 p-2 rounded mb-1">
                  {p.replace(/_/g, ' ')}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
