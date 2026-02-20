import { useState } from 'react'
import mockResponse from '../mockResponse.json'

const API_URL = import.meta.env.VITE_API_URL || 'https://crimson-trace.onrender.com/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function useAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  // ===========================================
  // FALSE POSITIVE FILTERING FUNCTIONS
  // ===========================================
  
  /**
   * Filter out legitimate accounts based on patterns
   * Prevents flagging merchants, payroll, utilities
   */
  const filterFalsePositives = (suspiciousAccounts, transactions = []) => {
    if (!suspiciousAccounts || suspiciousAccounts.length === 0) return []
    
    console.log('🔍 Filtering false positives from', suspiciousAccounts.length, 'accounts')
    
    // Known legitimate patterns (merchants, payroll, utilities)
    const legitimatePatterns = {
      payroll: ['PAYROLL', 'SALARY', 'HR_', 'EMPLOYEE', 'STAFF'],
      merchant: ['MERCHANT', 'SHOP', 'STORE_', 'RETAIL', 'MART'],
      utility: ['UTILITY', 'BILL', 'TAX_', 'WATER', 'ELECTRIC', 'GAS'],
      business: ['BUSINESS', 'CORP', 'INC', 'LTD', 'LLC']
    }
    
    const filteredAccounts = suspiciousAccounts.filter(acc => {
      const accountId = acc.account_id.toUpperCase()
      
      // Check if this looks like a legitimate account
      const isLegitimate = 
        legitimatePatterns.payroll.some(p => accountId.includes(p)) ||
        legitimatePatterns.merchant.some(m => accountId.includes(m)) ||
        legitimatePatterns.utility.some(u => accountId.includes(u)) ||
        legitimatePatterns.business.some(b => accountId.includes(b))
      
      if (isLegitimate) {
        console.log('✅ Filtered out legitimate account:', accountId)
        return false
      }
      
      // Additional check for consistent high volume (merchant pattern)
      if (acc.detected_patterns && acc.detected_patterns.includes('high_velocity') && 
          acc.suspicion_score < 70) {
        console.log('✅ Filtered out high-velocity legitimate account:', accountId)
        return false
      }
      
      return true
    })
    
    console.log('📊 After filtering:', filteredAccounts.length, 'suspicious accounts remain')
    return filteredAccounts
  }

  /**
   * Check if a high-volume account is legitimate
   * Analyzes transaction timing and amount consistency
   */
  const isLegitimateHighVolume = (account, transactions) => {
    if (!transactions || transactions.length === 0) return false
    
    // Get all transactions involving this account
    const accountTransactions = transactions.filter(t => 
      t.sender === account || t.receiver === account
    )
    
    if (accountTransactions.length < 10) return false
    
    // Check transaction timing
    const timestamps = accountTransactions
      .map(t => new Date(t.timestamp).getHours())
    
    // If all transactions during business hours (9-5), might be legitimate
    const businessHours = timestamps.every(h => h >= 9 && h <= 17)
    
    // Check if amounts are consistent (like salaries or regular payments)
    const amounts = accountTransactions
      .filter(t => t.receiver === account)
      .map(t => parseFloat(t.amount))
    
    const isConsistent = amounts.length > 5 && 
      (Math.max(...amounts) - Math.min(...amounts)) < 100
    
    // Regular patterns indicate legitimate business
    if (businessHours && isConsistent) {
      console.log('💰 Legitimate high-volume account detected:', account)
      return true
    }
    
    return false
  }

  // Normalize response to handle potential backend typos
  const normalizeResponse = (rawData) => {
    return {
      suspicious_accounts: rawData.suspicious_accounts || [],
      fraud_rings: rawData.fraud_rings || rawData.fraud_rngs || [],
      summary: rawData.summary || {
        total_accounts_analyzed: 0,
        suspicious_accounts_flagged: 0,
        fraud_rings_detected: 0,
        processing_time_seconds: 0
      },
      all_nodes: rawData.all_nodes || [],
      all_edges: rawData.all_edges || []
    }
  }

  const analyze = async (file) => {
    setLoading(true)
    setError(null)
    setData(null)
    setProgress(10)

    try {
      let result

      if (USE_MOCK) {
        console.log('📱 Using mock data')
        await new Promise(r => setTimeout(r, 1500))
        setProgress(60)
        await new Promise(r => setTimeout(r, 800))
        setProgress(90)
        await new Promise(r => setTimeout(r, 400))
        result = mockResponse
      } else {
        const formData = new FormData()
        formData.append('file', file)

        console.log('🌐 Calling API:', `${API_URL}/analyze`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000)

        try {
          const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
          })

          clearTimeout(timeoutId)
          setProgress(60)

          if (!response.ok) {
            const errText = await response.text()
            throw new Error(`Server error (${response.status}): ${errText}`)
          }

          result = await response.json()
          console.log('✅ API Response received')
          setProgress(90)
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error('Request timeout after 60 seconds')
          }
          throw fetchError
        }
      }

      // Normalize the response
      const normalized = normalizeResponse(result)
      
      // ===========================================
      // APPLY FALSE POSITIVE FILTERING
      // ===========================================
      if (normalized.suspicious_accounts) {
        const beforeCount = normalized.suspicious_accounts.length
        
        // First pass: filter by name patterns
        let filtered = filterFalsePositives(normalized.suspicious_accounts, normalized.all_edges)
        
        // Second pass: check for legitimate high-volume accounts
        filtered = filtered.filter(acc => {
          const isLegit = isLegitimateHighVolume(acc.account_id, normalized.all_edges || [])
          if (isLegit) {
            console.log('💰 Filtered out legitimate high-volume account:', acc.account_id)
            return false
          }
          return true
        })
        
        normalized.suspicious_accounts = filtered
        
        console.log('📊 False positive filtering complete:', {
          before: beforeCount,
          after: filtered.length,
          removed: beforeCount - filtered.length
        })
      }
      
      // Sort suspicious accounts by score descending
      if (normalized.suspicious_accounts) {
        normalized.suspicious_accounts.sort((a, b) => b.suspicion_score - a.suspicion_score)
      }

      // Update summary with filtered count
      if (normalized.summary) {
        normalized.summary.suspicious_accounts_flagged = normalized.suspicious_accounts?.length || 0
      }

      setData(normalized)
      setProgress(100)
      console.log('🎉 Analysis complete with false positive filtering')
    } catch (err) {
      console.error('❌ Analysis error:', err)
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setData(null)
    setError(null)
    setProgress(0)
  }

  return { data, loading, error, progress, analyze, reset }
}