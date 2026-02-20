/**
 * Transforms backend API response to Force-Graph format
 * Handles: cycles, fan-in, fan-out, shell networks
 * Time Complexity: O(n + m) where n = nodes, m = edges
 */

export const buildGraphData = (data) => {
  if (!data) return { nodes: [], links: [] }

  console.log('🎯 Building graph from data:', {
    suspicious: data.suspicious_accounts?.length,
    rings: data.fraud_rings?.length,
    nodes: data.all_nodes?.length,
    edges: data.all_edges?.length
  })

  // Create map of suspicious accounts for O(1) lookup
  const suspiciousMap = new Map()
  data.suspicious_accounts?.forEach(acc => {
    suspiciousMap.set(acc.account_id, {
      suspicion_score: acc.suspicion_score,
      detected_patterns: acc.detected_patterns || [],
      ring_id: acc.ring_id
    })
  })

  // Generate distinct colors for each fraud ring
  const ringColorMap = {}
  const ringColors = [
    '#e11d48', // Rose - Cycle rings
    '#f97316', // Orange - Fan-in rings
    '#eab308', // Yellow - Fan-out rings
    '#84cc16', // Lime - Shell networks
    '#06b6d4', // Cyan - Mixed patterns
    '#8b5cf6', // Violet - High risk
    '#d946ef', // Fuchsia - Critical
    '#ec4899'  // Pink - Severe
  ]

  // ===========================================
  // 1. BUILD NODES (All accounts from CSV)
  // ===========================================
  // Time Complexity: O(n) where n = number of unique accounts
  let nodes = []
  
  if (data.all_nodes && data.all_nodes.length > 0) {
    nodes = data.all_nodes.map(id => {
      const suspicious = suspiciousMap.get(id)
      const isSuspicious = !!suspicious
      
      // Assign color based on ring_id for suspicious nodes
      let color = '#94a3b8' // Default gray for normal accounts
      if (isSuspicious) {
        if (suspicious.ring_id) {
          if (!ringColorMap[suspicious.ring_id]) {
            const ringIndex = Object.keys(ringColorMap).length % ringColors.length
            ringColorMap[suspicious.ring_id] = ringColors[ringIndex]
          }
          color = ringColorMap[suspicious.ring_id]
        } else {
          color = '#e11d48' // Default rose for suspicious without ring
        }
      }

      // Determine pattern type for tooltip reasoning
      const patterns = suspicious?.detected_patterns || []
      
      // Categorize the pattern type
      let patternCategory = 'Normal'
      let patternIcon = '⚪'
      
      if (patterns.length > 0) {
        if (patterns.some(p => p.includes('cycle'))) {
          patternCategory = 'Cycle'
          patternIcon = '🔄'
        } else if (patterns.includes('fan_in')) {
          patternCategory = 'Fan-in'
          patternIcon = '📥'
        } else if (patterns.includes('fan_out')) {
          patternCategory = 'Fan-out'
          patternIcon = '📤'
        } else if (patterns.some(p => p.includes('shell'))) {
          patternCategory = 'Shell'
          patternIcon = '🐚'
        } else if (patterns.includes('high_velocity')) {
          patternCategory = 'High Velocity'
          patternIcon = '⚡'
        }
      }

      return {
        id,
        name: id,
        // Display name without ACC_ prefix for cleaner look
        displayName: id.startsWith('ACC_') ? id.replace('ACC_', '') : id,
        // Suspicion flags
        isSuspicious,
        suspicion_score: suspicious?.suspicion_score || 0,
        detected_patterns: patterns,
        patternCategory,
        patternIcon,
        ringId: suspicious?.ring_id,
        
        // Visual properties
        color,
        
        // Size: bigger for more suspicious
        val: isSuspicious ? 8 + (suspicious.suspicion_score / 25) : 5,
        
        // Border/thickness
        borderWidth: isSuspicious ? 2 : 1,
        
        // Glow effect for critical scores
        glow: isSuspicious && suspicious.suspicion_score > 85
      }
    })
  } else if (data.suspicious_accounts && data.suspicious_accounts.length > 0) {
    // Fallback: just use suspicious accounts
    nodes = data.suspicious_accounts.map(acc => {
      const patterns = acc.detected_patterns || []
      
      let patternCategory = 'Suspicious'
      let patternIcon = '⚠️'
      
      if (patterns.some(p => p.includes('cycle'))) {
        patternCategory = 'Cycle'
        patternIcon = '🔄'
      } else if (patterns.includes('fan_in')) {
        patternCategory = 'Fan-in'
        patternIcon = '📥'
      } else if (patterns.includes('fan_out')) {
        patternCategory = 'Fan-out'
        patternIcon = '📤'
      } else if (patterns.some(p => p.includes('shell'))) {
        patternCategory = 'Shell'
        patternIcon = '🐚'
      }
      
      return {
        id: acc.account_id,
        name: acc.account_id,
        displayName: acc.account_id.startsWith('ACC_') ? acc.account_id.replace('ACC_', '') : acc.account_id,
        isSuspicious: true,
        suspicion_score: acc.suspicion_score || 0,
        detected_patterns: patterns,
        patternCategory,
        patternIcon,
        ringId: acc.ring_id,
        color: ringColorMap[acc.ring_id] || '#e11d48',
        val: 8 + (acc.suspicion_score / 25),
        borderWidth: 2,
        glow: acc.suspicion_score > 85
      }
    })
  }

  // ===========================================
  // 2. BUILD EDGES (All transactions)
  // ===========================================
  // Time Complexity: O(m) where m = number of transactions
  let links = []
  
  // First, add edges from all_edges if available
  if (data.all_edges && data.all_edges.length > 0) {
    links = data.all_edges.map(edge => {
      // Check if this edge is part of a suspicious transaction
      const sourceSuspicious = suspiciousMap.has(edge.source)
      const targetSuspicious = suspiciousMap.has(edge.target)
      const isSuspicious = sourceSuspicious || targetSuspicious

      // Determine pattern for coloring
      let pattern = 'normal'
      let color = '#94a3b8'
      
      if (isSuspicious) {
        // Try to determine pattern from source or target
        const sourcePatterns = suspiciousMap.get(edge.source)?.detected_patterns || []
        const targetPatterns = suspiciousMap.get(edge.target)?.detected_patterns || []
        const allPatterns = [...sourcePatterns, ...targetPatterns]
        
        if (allPatterns.some(p => p.includes('cycle'))) {
          pattern = 'cycle'
          color = '#e11d48'
        } else if (allPatterns.includes('fan_in')) {
          pattern = 'fan_in'
          color = '#f97316'
        } else if (allPatterns.includes('fan_out')) {
          pattern = 'fan_out'
          color = '#eab308'
        } else if (allPatterns.some(p => p.includes('shell'))) {
          pattern = 'shell'
          color = '#84cc16'
        }
      }

      return {
        source: edge.source,
        target: edge.target,
        amount: edge.amount,
        
        // Metadata for filtering and styling
        isSuspicious,
        pattern,
        color,
        sourceSuspicious,
        targetSuspicious,
        
        // Width: thicker for suspicious edges
        width: isSuspicious ? 2 : 1
      }
    })
  } 
  // If no all_edges but we have fraud_rings, create edges from rings
  else if (data.fraud_rings && data.fraud_rings.length > 0) {
    console.log('Creating edges from fraud_rings')
    
    data.fraud_rings.forEach(ring => {
      const members = ring.member_accounts || []
      const pattern = ring.pattern_type?.toLowerCase() || ''
      
      let color = '#94a3b8'
      if (pattern.includes('cycle')) color = '#e11d48'
      else if (pattern.includes('fan_in')) color = '#f97316'
      else if (pattern.includes('fan_out')) color = '#eab308'
      else if (pattern.includes('shell')) color = '#84cc16'
      
      if (pattern.includes('cycle')) {
        // Cycle: A->B, B->C, C->A
        for (let i = 0; i < members.length; i++) {
          const source = members[i]
          const target = members[(i + 1) % members.length]
          links.push({
            source: String(source),
            target: String(target),
            pattern: 'cycle',
            color,
            isSuspicious: true,
            width: 2
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
              color,
              isSuspicious: true,
              width: 2
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
              color,
              isSuspicious: true,
              width: 2
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
            color,
            isSuspicious: true,
            width: 2
          })
        }
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

  // ===========================================
  // 3. PATTERN DETECTION SUMMARY
  // ===========================================
  const patternStats = {
    cycles: data.suspicious_accounts?.filter(a => 
      a.detected_patterns?.some(p => p.includes('cycle'))
    ).length || 0,
    fanIn: data.suspicious_accounts?.filter(a => 
      a.detected_patterns?.includes('fan_in')
    ).length || 0,
    fanOut: data.suspicious_accounts?.filter(a => 
      a.detected_patterns?.includes('fan_out')
    ).length || 0,
    shell: data.suspicious_accounts?.filter(a => 
      a.detected_patterns?.some(p => p.includes('shell'))
    ).length || 0,
    velocity: data.suspicious_accounts?.filter(a => 
      a.detected_patterns?.includes('high_velocity')
    ).length || 0
  }

  console.log('📊 Pattern Detection Summary:', patternStats)
  console.log('🎨 Ring colors:', ringColorMap)
  console.log('📊 Final graph data:', { nodes: nodes.length, links: uniqueLinks.length })

  return {
    nodes,
    links: uniqueLinks,
    ringColorMap,
    patternStats
  }
}

/**
 * Time Complexity Analysis:
 * ----------------------------------------
 * Cycle Detection: O(V + E) using DFS
 * Fan-in/Fan-out: O(V + E) using degree counting
 * Shell Networks: O(V * E) for path analysis
 * Overall: O(V * E) worst case, but optimized with early termination
 * 
 * Where:
 * V = number of accounts (vertices)
 * E = number of transactions (edges)
 */