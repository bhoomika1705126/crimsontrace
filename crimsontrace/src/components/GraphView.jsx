import { useRef, useEffect, useCallback, useState } from 'react'

export default function GraphView({ data, selectedRingId, isFilterOn }) {
  const containerRef = useRef(null)
  const fgRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const [graphLoaded, setGraphLoaded] = useState(false)
  const [GraphComponent, setGraphComponent] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)

  // Load graph library
  useEffect(() => {
    import('react-force-graph-2d').then(mod => {
      setGraphComponent(() => mod.default)
      setGraphLoaded(true)
      console.log('✅ Graph library loaded')
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
  // TRANSFORM DATA FOR VISUALIZATION
  // ===========================================
  const getGraphData = () => {
    if (!data) {
      return { nodes: [], links: [] }
    }

    console.log('📊 Raw data:', data)

    // Create a map of suspicious accounts
    const suspiciousMap = new Map()
    if (data.suspicious_accounts) {
      data.suspicious_accounts.forEach(acc => {
        suspiciousMap.set(acc.account_id, acc)
      })
    }

    // Collect all unique account IDs
    const accountIds = new Set()
    
    // Add from suspicious_accounts
    if (data.suspicious_accounts) {
      data.suspicious_accounts.forEach(acc => {
        accountIds.add(acc.account_id)
      })
    }

    // Add from fraud_rings member_accounts
    if (data.fraud_rings) {
      data.fraud_rings.forEach(ring => {
        if (ring.member_accounts) {
          ring.member_accounts.forEach(id => accountIds.add(id))
        }
      })
    }

    // Add from all_nodes if available (for complete graph)
    if (data.all_nodes) {
      data.all_nodes.forEach(id => accountIds.add(id))
    }

    const sortedIds = Array.from(accountIds).sort()
    
    // ===========================================
    // CREATE NODES with visual distinction
    // ===========================================
    const nodes = sortedIds.map((id) => {
      const suspicious = suspiciousMap.get(id)
      const isSuspicious = !!suspicious
      
      // Different colors for different rings
      let color = '#94a3b8' // Default gray for normal
      let borderColor = '#64748b'
      let size = 6 // Base size for normal nodes
      
      if (isSuspicious) {
        // Suspicious nodes are larger and have distinct colors
        size = 12
        
        // Color based on ring_id for visual distinction
        if (suspicious.ring_id === 'RING_001') {
          color = '#e11d48' // Rose
          borderColor = '#9f1239'
        } else if (suspicious.ring_id === 'RING_002') {
          color = '#f97316' // Orange
          borderColor = '#c2410c'
        } else if (suspicious.ring_id === 'RING_003') {
          color = '#eab308' // Yellow
          borderColor = '#a16207'
        } else if (suspicious.ring_id === 'RING_004') {
          color = '#84cc16' // Lime
          borderColor = '#4d7c0f'
        } else if (suspicious.ring_id === 'RING_005') {
          color = '#06b6d4' // Cyan
          borderColor = '#0891b2'
        } else {
          color = '#e11d48' // Default rose
          borderColor = '#9f1239'
        }
      }

      return {
        id: String(id),
        name: String(id),
        displayName: id.startsWith('ACC_') ? id.replace('ACC_', '') : id,
        isSuspicious,
        suspicion_score: suspicious?.suspicion_score || 0,
        detected_patterns: suspicious?.detected_patterns || [],
        ringId: suspicious?.ring_id,
        color: color,
        borderColor: borderColor,
        val: size,
        // Add some randomness for initial layout
        x: Math.random() * 100,
        y: Math.random() * 100
      }
    })

    // ===========================================
    // CREATE EDGES (directed money flow)
    // ===========================================
    let links = []
    
    // Create edges from fraud_rings
    if (data.fraud_rings && data.fraud_rings.length > 0) {
      data.fraud_rings.forEach(ring => {
        const members = ring.member_accounts || []
        const pattern = ring.pattern_type?.toLowerCase() || ''
        
        if (pattern.includes('cycle')) {
          // Cycle: A->B, B->C, C->A
          for (let i = 0; i < members.length; i++) {
            const source = members[i]
            const target = members[(i + 1) % members.length]
            links.push({
              source: String(source),
              target: String(target),
              pattern: 'cycle',
              ringId: ring.ring_id,
              color: '#e11d48'
            })
          }
        }
        else if (pattern.includes('fan_in')) {
          // Fan-in: all point to last member
          if (members.length >= 2) {
            const receiver = members[members.length - 1]
            for (let i = 0; i < members.length - 1; i++) {
              links.push({
                source: String(members[i]),
                target: String(receiver),
                pattern: 'fan_in',
                ringId: ring.ring_id,
                color: '#f97316'
              })
            }
          }
        }
        else if (pattern.includes('fan_out')) {
          // Fan-out: first member points to all others
          if (members.length >= 2) {
            const sender = members[0]
            for (let i = 1; i < members.length; i++) {
              links.push({
                source: String(sender),
                target: String(members[i]),
                pattern: 'fan_out',
                ringId: ring.ring_id,
                color: '#eab308'
              })
            }
          }
        }
        else if (pattern.includes('shell')) {
          // Shell: chain of transactions
          for (let i = 0; i < members.length - 1; i++) {
            links.push({
              source: String(members[i]),
              target: String(members[i + 1]),
              pattern: 'shell',
              ringId: ring.ring_id,
              color: '#84cc16'
            })
          }
        }
        else {
          // Default chain
          for (let i = 0; i < members.length - 1; i++) {
            links.push({
              source: String(members[i]),
              target: String(members[i + 1]),
              pattern: 'unknown',
              ringId: ring.ring_id,
              color: '#64748b'
            })
          }
        }
      })
    }

    // Create edges from all_edges if available
    if (data.all_edges) {
      data.all_edges.forEach(edge => {
        const source = String(edge.source || edge.sender_id)
        const target = String(edge.target || edge.receiver_id)
        
        // Check if this edge is already added
        const exists = links.some(l => 
          l.source === source && l.target === target
        )
        
        if (!exists && source && target) {
          links.push({
            source: source,
            target: target,
            pattern: 'normal',
            color: '#94a3b8'
          })
        }
      })
    }

    // Remove duplicate edges
    const uniqueLinks = []
    const linkSet = new Set()
    
    links.forEach(link => {
      const key = `${link.source}-${link.target}`
      if (!linkSet.has(key)) {
        linkSet.add(key)
        uniqueLinks.push(link)
      }
    })

    console.log('📊 Processed:', {
      nodes: nodes.length,
      links: uniqueLinks.length,
      suspicious: nodes.filter(n => n.isSuspicious).length
    })

    // Apply ghost filter if enabled
    if (isFilterOn && nodes.length > 0) {
      const suspiciousNodeIds = new Set(
        nodes.filter(n => n.isSuspicious).map(n => n.id)
      )
      const filteredLinks = uniqueLinks.filter(l => 
        suspiciousNodeIds.has(l.source) && suspiciousNodeIds.has(l.target)
      )
      
      return { 
        nodes: nodes.filter(n => n.isSuspicious), 
        links: filteredLinks 
      }
    }

    return { nodes, links: uniqueLinks }
  }

  const graphData = getGraphData()

  // Zoom to selected ring
  useEffect(() => {
    if (selectedRingId && fgRef.current && graphData.nodes.length > 0) {
      const ringNodes = graphData.nodes.filter(n => n.ringId === selectedRingId)
      if (ringNodes.length > 0 && ringNodes[0].x && ringNodes[0].y) {
        const x = ringNodes.reduce((sum, n) => sum + (n.x || 0), 0) / ringNodes.length
        const y = ringNodes.reduce((sum, n) => sum + (n.y || 0), 0) / ringNodes.length
        fgRef.current.centerAt(x, y, 1000)
        fgRef.current.zoom(2, 1000)
      }
    }
  }, [selectedRingId, graphData.nodes])

  // ===========================================
  // INTERACTIVE FEATURES
  // ===========================================
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node)
    // Center on clicked node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 800)
      fgRef.current.zoom(2, 800)
    }
  }, [])

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node)
    document.body.style.cursor = node ? 'pointer' : 'default'
  }, [])

  // ===========================================
  // CUSTOM NODE RENDERING
  // ===========================================
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    if (!node || !node.x || !node.y) return

    const label = node.displayName || node.id
    const isSelected = selectedNode?.id === node.id
    const isHovered = hoveredNode?.id === node.id
    
    // Different sizes for suspicious vs normal nodes
    const baseSize = node.isSuspicious ? 8 : 5
    const r = isSelected ? baseSize * 1.5 : isHovered ? baseSize * 1.3 : baseSize

    // Draw outer glow for selected/hovered nodes
    if (isSelected || isHovered) {
      ctx.shadowColor = node.isSuspicious ? node.color : '#94a3b8'
      ctx.shadowBlur = 15
    }

    // Draw node circle
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    
    // Fill color
    ctx.fillStyle = node.color
    ctx.fill()

    // Reset shadow
    ctx.shadowBlur = 0

    // Draw border (thicker for suspicious nodes)
    if (node.isSuspicious) {
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Draw selection ring
    if (isSelected) {
      ctx.strokeStyle = '#e11d48'
      ctx.lineWidth = 2.5
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw label
    if (globalScale > 0.6) {
      ctx.font = '10px "Share Tech Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#1e293b'
      ctx.fillText(label, node.x, node.y + r + 4)
    }
  }, [selectedNode, hoveredNode])

  // ===========================================
  // CUSTOM LINK RENDERING (directed edges)
  // ===========================================
  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    if (!link.source.x || !link.source.y || !link.target.x || !link.target.y) return

    const start = link.source
    const end = link.target

    // Calculate direction
    const dx = end.x - start.x
    const dy = end.y - start.y
    const angle = Math.atan2(dy, dx)
    
    // Adjust end point to node edge
    const targetRadius = end.isSuspicious ? 8 : 5
    const sourceRadius = start.isSuspicious ? 8 : 5
    
    const endX = end.x - Math.cos(angle) * targetRadius
    const endY = end.y - Math.sin(angle) * targetRadius
    const startX = start.x + Math.cos(angle) * sourceRadius
    const startY = start.y + Math.sin(angle) * sourceRadius

    // Draw the line
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    
    // Color based on pattern
    if (link.pattern === 'cycle') ctx.strokeStyle = '#e11d48'
    else if (link.pattern === 'fan_in') ctx.strokeStyle = '#f97316'
    else if (link.pattern === 'fan_out') ctx.strokeStyle = '#eab308'
    else if (link.pattern === 'shell') ctx.strokeStyle = '#84cc16'
    else ctx.strokeStyle = '#94a3b8'
    
    ctx.lineWidth = link.isSuspicious ? 2 : 1.5
    ctx.stroke()

    // Draw arrow (direction indicator)
    const arrowSize = 6
    ctx.save()
    ctx.translate(endX, endY)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(-arrowSize, -arrowSize/2)
    ctx.lineTo(0, 0)
    ctx.lineTo(-arrowSize, arrowSize/2)
    ctx.fillStyle = ctx.strokeStyle
    ctx.fill()
    ctx.restore()
  }, [])

  if (!data) {
    return (
      <div ref={containerRef} className="w-full h-[500px] flex items-center justify-center bg-white border border-gray-200 rounded-lg">
        <p className="text-gray-500 font-share text-sm">Upload a CSV file to see the graph</p>
      </div>
    )
  }

  if (graphLoaded === 'error') {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-white border border-gray-200 rounded-lg">
        <p className="text-gray-500 font-share text-sm">Failed to load graph library</p>
      </div>
    )
  }

  if (graphData.nodes.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-[500px] flex items-center justify-center bg-white border border-gray-200 rounded-lg">
        <p className="text-gray-500 font-share text-sm">No nodes to display</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-[500px] bg-white rounded-lg overflow-hidden border border-gray-200">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-sm">
        <p className="text-xs font-rajdhani text-gray-600 mb-2">LEGEND</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 border-2 border-rose-800"></div>
            <span className="text-xs font-share text-gray-700">Suspicious - Cycle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-orange-800"></div>
            <span className="text-xs font-share text-gray-700">Suspicious - Fan-in</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-yellow-800"></div>
            <span className="text-xs font-share text-gray-700">Suspicious - Fan-out</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-lime-500 border-2 border-lime-800"></div>
            <span className="text-xs font-share text-gray-700">Suspicious - Shell</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-gray-600"></div>
            <span className="text-xs font-share text-gray-700">Normal</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-2 text-[10px] font-rajdhani text-gray-600 shadow-sm">
        SCROLL → ZOOM<br />
        DRAG → PAN<br />
        CLICK → SELECT
        {isFilterOn && <div className="text-rose-600 mt-1 font-bold">👻 GHOST MODE</div>}
      </div>

      {/* Node Count */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1 shadow-sm">
        <span className="text-xs font-share text-gray-700">
          {graphData.nodes.length} nodes · {graphData.links.length} edges
        </span>
      </div>

      {/* Graph */}
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
          cooldownTicks={50}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          nodeRelSize={1}
        />
      ) : (
        <div className="flex items-center justify-center h-full gap-2">
          <div className="spinner border-2 border-gray-300 border-t-rose-500"></div>
          <span className="text-gray-500 font-share text-sm">Loading graph...</span>
        </div>
      )}

      {/* Tooltip - Shows account details on hover */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg p-3 shadow-xl z-20 min-w-[200px]">
          <p className="font-share text-sm font-bold text-gray-800 mb-1">
            {hoveredNode.displayName || hoveredNode.id}
          </p>
          {hoveredNode.isSuspicious ? (
            <>
              <p className="text-xs text-rose-600 mb-1">
                ⚠ Suspicion Score: {hoveredNode.suspicion_score?.toFixed(1)}%
              </p>
              {hoveredNode.detected_patterns?.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-500 mb-1">Detected Patterns:</p>
                  <div className="flex flex-wrap gap-1">
                    {hoveredNode.detected_patterns.map(p => (
                      <span key={p} className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-share border border-rose-200">
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hoveredNode.ringId && (
                <p className="text-xs text-gray-600 mt-2">
                  Ring: <span className="font-bold" style={{color: hoveredNode.color}}>{hoveredNode.ringId}</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500">Normal account - No suspicious activity</p>
          )}
        </div>
      )}

      {/* Selected Node Details Panel */}
      {selectedNode && (
        <div className="absolute bottom-0 right-0 w-64 bg-white border-l border-t border-gray-200 rounded-tl-lg p-4 shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-rajdhani text-gray-500">SELECTED ACCOUNT</p>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <p className="font-share text-sm font-bold text-gray-800 mb-3">
            {selectedNode.displayName || selectedNode.id}
          </p>

          {selectedNode.isSuspicious ? (
            <div className="space-y-3">
              <div className="bg-rose-50 border border-rose-200 rounded p-2">
                <p className="text-[10px] text-gray-500 mb-1">SUSPICION SCORE</p>
                <p className="text-xl font-bold" style={{color: selectedNode.color}}>
                  {selectedNode.suspicion_score?.toFixed(1)}%
                </p>
              </div>
              
              {selectedNode.detected_patterns?.length > 0 && (
                <>
                  <p className="text-[10px] text-gray-500">DETECTED PATTERNS</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.detected_patterns.map(p => (
                      <span 
                        key={p}
                        className="px-2 py-1 text-[10px] font-share bg-rose-50 text-rose-700 rounded border border-rose-200"
                      >
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </>
              )}
              
              {selectedNode.ringId && (
                <p className="text-xs text-gray-600">
                  Ring: <span className="font-bold" style={{color: selectedNode.color}}>{selectedNode.ringId}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No suspicious activity detected</p>
          )}
        </div>
      )}
    </div>
  )
}