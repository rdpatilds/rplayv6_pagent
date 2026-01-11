import { logger } from "./logger"

// Create module-specific logger with fallback
let log = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
}

// Try to use the logger if available
try {
  if (logger && typeof logger.forModule === "function") {
    log = logger.forModule("piiDetector")
  }
} catch (e) {
  console.warn("Logger not available, using console fallback")
}

type PIIType = "email" | "phone" | "creditCard" | "ssn" | "address" | "financialAmount"

interface PIIMatch {
  type: PIIType
  value: string
  index: number
}

// Performance tracking
interface PerformanceMetrics {
  scanCount: number
  totalScanTime: number
  redactCount: number
  totalRedactTime: number
  averageScanTimeMs: number
  averageRedactTimeMs: number
  patternMatchCounts: Record<PIIType, number>
}

const metrics: PerformanceMetrics = {
  scanCount: 0,
  totalScanTime: 0,
  redactCount: 0,
  totalRedactTime: 0,
  averageScanTimeMs: 0,
  averageRedactTimeMs: 0,
  patternMatchCounts: {
    email: 0,
    phone: 0,
    creditCard: 0,
    ssn: 0,
    address: 0,
    financialAmount: 0,
  },
}

// Regular expressions for common PII patterns
const PII_PATTERNS: Record<PIIType, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+\d{1,3}[\s.-]?)?($$\d{3}$$|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  address:
    /\d+\s+[a-zA-Z0-9\s,]+\b(?:street|st|avenue|ave|road|rd|highway|hwy|square|sq|trail|trl|drive|dr|court|ct|parkway|pkwy|circle|cir|boulevard|blvd)\b/gi,
  financialAmount: /\$\s*\d+(?:[,.]\d{1,2})?|\d+\s*(?:dollars|USD|€|£|¥)/g,
}

// Financial keywords that might indicate sensitive data
const FINANCIAL_KEYWORDS = [
  "salary",
  "income",
  "earn",
  "mortgage",
  "loan",
  "debt",
  "credit",
  "account",
  "balance",
  "payment",
  "investment",
  "portfolio",
  "retirement",
  "401k",
  "ira",
]

/**
 * Scans text for potential PII
 */
export function scanForPII(text: string): PIIMatch[] {
  if (!text || typeof text !== "string") return []

  const startTime = performance.now()

  try {
    const matches: PIIMatch[] = []

    // Check for each PII pattern
    Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
      const typeMatches = [...text.matchAll(pattern)]
      typeMatches.forEach((match) => {
        matches.push({
          type: type as PIIType,
          value: match[0],
          index: match.index || 0,
        })

        // Update pattern match count for metrics
        metrics.patternMatchCounts[type as PIIType]++
      })
    })

    // Check for financial context with numbers (potential sensitive financial data)
    FINANCIAL_KEYWORDS.forEach((keyword) => {
      const keywordRegex = new RegExp(`\\b${keyword}\\b[^.!?]*?\\$?\\d+`, "gi")
      const keywordMatches = [...text.matchAll(keywordRegex)]

      keywordMatches.forEach((match) => {
        matches.push({
          type: "financialAmount",
          value: match[0],
          index: match.index || 0,
        })

        // Update pattern match count for metrics
        metrics.patternMatchCounts.financialAmount++
      })
    })

    return matches
  } finally {
    // Update performance metrics
    const endTime = performance.now()
    metrics.scanCount++
    metrics.totalScanTime += endTime - startTime
    metrics.averageScanTimeMs = metrics.totalScanTime / metrics.scanCount

    // Log performance if it's slow (over 5ms)
    if (endTime - startTime > 5) {
      log.debug(`PII scan took ${(endTime - startTime).toFixed(2)}ms for ${text.length} chars`)
    }
  }
}

/**
 * Redacts PII from text
 */
export function redactPII(text: string): string {
  if (!text) return text

  const startTime = performance.now()

  try {
    const matches = scanForPII(text)
    if (matches.length === 0) return text

    // Sort matches by index in descending order to avoid offset issues when replacing
    matches.sort((a, b) => b.index - a.index)

    let redactedText = text
    matches.forEach((match) => {
      const replacement = `[REDACTED ${match.type.toUpperCase()}]`
      redactedText =
        redactedText.substring(0, match.index) + replacement + redactedText.substring(match.index + match.value.length)
    })

    return redactedText
  } finally {
    // Update performance metrics
    const endTime = performance.now()
    metrics.redactCount++
    metrics.totalRedactTime += endTime - startTime
    metrics.averageRedactTimeMs = metrics.totalRedactTime / metrics.redactCount

    // Log performance if it's slow (over 10ms)
    if (endTime - startTime > 10) {
      log.debug(`PII redaction took ${(endTime - startTime).toFixed(2)}ms`)
    }
  }
}

/**
 * Checks if text contains PII
 */
export function containsPII(text: string): boolean {
  return scanForPII(text).length > 0
}

/**
 * Get performance metrics for PII detection
 */
export function getPIIPerformanceMetrics(): PerformanceMetrics {
  return { ...metrics }
}

/**
 * Reset performance metrics
 */
export function resetPIIPerformanceMetrics(): void {
  metrics.scanCount = 0
  metrics.totalScanTime = 0
  metrics.redactCount = 0
  metrics.totalRedactTime = 0
  metrics.averageScanTimeMs = 0
  metrics.averageRedactTimeMs = 0
  Object.keys(metrics.patternMatchCounts).forEach((key) => {
    metrics.patternMatchCounts[key as PIIType] = 0
  })
}

// Optimization: Skip PII detection for short messages in production
export function shouldSkipPIICheck(text: string): boolean {
  // Skip if PII detection is disabled
  if (process.env.ENABLE_PII_DETECTION !== "true") {
    return true
  }

  // In production, skip PII check for very short messages (unlikely to contain PII)
  if (process.env.NODE_ENV === "production" && text.length < 20) {
    return true
  }

  // Skip if the text doesn't contain any digits (most PII contains numbers)
  if (!/\d/.test(text) && text.length < 100) {
    return true
  }

  return false
}
