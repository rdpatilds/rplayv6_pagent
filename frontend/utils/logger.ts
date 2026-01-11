// Get the log level from environment variables
const getLogLevel = (): "debug" | "info" | "warn" | "error" => {
  const level = process.env.LOG_LEVEL?.toLowerCase()
  if (level === "debug" || level === "info" || level === "warn" || level === "error") {
    return level
  }
  return "info" // Default log level
}

type LogLevel = "debug" | "info" | "warn" | "error"

// Get current environment
const environment = process.env.NODE_ENV || "development"

// Set default log level based on environment
const DEFAULT_LOG_LEVEL: LogLevel = environment === "production" ? "info" : "debug"

// Current log level (can be changed at runtime)
let currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || DEFAULT_LOG_LEVEL

// Log level hierarchy (higher number = more severe)
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Module-specific debug flags
interface DebugFlags {
  [key: string]: boolean
}

// Parse debug flags from environment variables
const parseDebugFlags = (): DebugFlags => {
  const flags: DebugFlags = {}

  // Look for all environment variables starting with DEBUG_
  Object.keys(process.env || {}).forEach((key) => {
    if (key.startsWith("DEBUG_")) {
      // Convert DEBUG_EMOTIONAL_STATE=true to emotionalState: true
      const moduleName = key
        .replace("DEBUG_", "")
        .toLowerCase()
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

      flags[moduleName] = process.env[key] === "true"
    }
  })

  return flags
}

const debugFlags = parseDebugFlags()

// Check if a log should be shown based on current level
const shouldLog = (level: "debug" | "info" | "warn" | "error"): boolean => {
  const configLevel = getLogLevel()

  const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  return levels[level] >= levels[configLevel]
}

// Import PII detection (will implement later)
import { redactPII, containsPII } from "./pii-detector"

// Performance tracking for logging operations
const logPerformance: Record<string, { count: number; totalTime: number }> = {}

// Sanitize sensitive data from objects
const sanitizeData = (data: any, skipPiiCheck = false): any => {
  if (!data) return data

  const startTime = performance.now()

  try {
    // For strings, redact potential sensitive content
    if (typeof data === "string") {
      // Check for PII if enabled and not skipped
      if (!skipPiiCheck && process.env.ENABLE_PII_DETECTION === "true") {
        if (containsPII(data)) {
          const result = redactPII(data)

          // Track performance
          const endTime = performance.now()
          const duration = endTime - startTime

          if (!logPerformance["piiDetection"]) {
            logPerformance["piiDetection"] = { count: 0, totalTime: 0 }
          }
          logPerformance["piiDetection"].count++
          logPerformance["piiDetection"].totalTime += duration

          return result
        }
      }

      // If it's a long message, truncate it
      if (data.length > 100) {
        return `${data.substring(0, 50)}... [content truncated]`
      }

      return data
    }

    // For arrays, sanitize each element
    if (Array.isArray(data)) {
      return data.map((item) => sanitizeData(item, skipPiiCheck))
    }

    // For objects, sanitize each property
    if (typeof data === "object" && data !== null) {
      const sanitized: Record<string, any> = {}

      // List of sensitive field names to redact
      const sensitiveFields = [
        "password",
        "token",
        "secret",
        "key",
        "credential",
        "ssn",
        "socialSecurity",
        "creditCard",
        "income",
        "assets",
        "debts",
      ]

      for (const [key, value] of Object.entries(data)) {
        // Check if this is a sensitive field
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
          sanitized[key] = "[REDACTED]"
        } else {
          sanitized[key] = sanitizeData(value, skipPiiCheck)
        }
      }

      return sanitized
    }

    return data
  } finally {
    // Track overall sanitization performance
    const endTime = performance.now()
    const duration = endTime - startTime

    if (!logPerformance["sanitizeData"]) {
      logPerformance["sanitizeData"] = { count: 0, totalTime: 0 }
    }
    logPerformance["sanitizeData"].count++
    logPerformance["sanitizeData"].totalTime += duration
  }
}

// Import consent manager (will implement later)
import { consentManager } from "./consent-manager"

// Base logger implementation
const baseLogger = {
  setLogLevel: (level: LogLevel) => {
    currentLogLevel = level
    if (shouldLog("info")) {
      console.info(`[INFO] Log level set to: ${level}`)
    }
  },

  getPerformanceMetrics: () => {
    return { ...logPerformance }
  },

  resetPerformanceMetrics: () => {
    Object.keys(logPerformance).forEach((key) => {
      logPerformance[key] = { count: 0, totalTime: 0 }
    })
  },

  debug: (message: string, data?: any) => {
    // Check if we have consent for analytics logging in production
    if (!shouldLog("debug") || (environment === "production" && !consentManager.hasConsented("analytics"))) {
      return
    }

    console.debug(`[DEBUG] ${message}`)
    if (data !== undefined) {
      console.debug(environment === "production" ? sanitizeData(data) : data)
    }
  },

  info: (message: string, data?: any) => {
    if (!shouldLog("info")) return

    console.info(`[INFO] ${message}`)
    if (data !== undefined) {
      console.info(environment === "production" ? sanitizeData(data) : data)
    }
  },

  warn: (message: string, data?: any) => {
    if (!shouldLog("warn")) return

    console.warn(`[WARN] ${message}`)
    if (data !== undefined) {
      console.warn(environment === "production" ? sanitizeData(data) : data)
    }
  },

  error: (message: string, error?: any) => {
    // Always log errors in development
    // In production, check for error logging consent
    if (!shouldLog("error") || (environment === "production" && !consentManager.hasConsented("errorLogging"))) {
      return
    }

    console.error(`[ERROR] ${message}`)
    if (error) {
      if (error instanceof Error) {
        console.error(error.message)
        console.error(error.stack)
      } else {
        console.error(error)
      }
    }
  },

  // Create a module-specific logger
  forModule: (moduleName: string) => {
    // Convert camelCase to UPPER_SNAKE_CASE for env var lookup
    const envKey = moduleName.replace(/([A-Z])/g, "_$1").toUpperCase()

    // Check if this specific module has debug enabled
    const moduleDebugEnabled = debugFlags[moduleName] ?? false

    return {
      debug: (message: string, data?: any) => {
        // Only log if either:
        // 1. General debug logging is enabled AND this module isn't specifically disabled
        // 2. This module is specifically enabled (regardless of general setting)
        if ((shouldLog("debug") && debugFlags[moduleName] !== false) || moduleDebugEnabled) {
          if (environment === "production" && !consentManager.hasConsented("analytics")) {
            return
          }

          console.debug(`[DEBUG][${moduleName}] ${message}`)
          if (data !== undefined) {
            console.debug(environment === "production" ? sanitizeData(data) : data)
          }
        }
      },

      info: (message: string, data?: any) => {
        if (shouldLog("info")) {
          console.info(`[INFO][${moduleName}] ${message}`)
          if (data !== undefined) {
            console.info(environment === "production" ? sanitizeData(data) : data)
          }
        }
      },

      warn: (message: string, data?: any) => {
        if (shouldLog("warn")) {
          console.warn(`[WARN][${moduleName}] ${message}`)
          if (data !== undefined) {
            console.warn(environment === "production" ? sanitizeData(data) : data)
          }
        }
      },

      error: (message: string, error?: any) => {
        if (shouldLog("error")) {
          if (environment === "production" && !consentManager.hasConsented("errorLogging")) {
            return
          }

          console.error(`[ERROR][${moduleName}] ${message}`)
          if (error) {
            if (error instanceof Error) {
              console.error(error.message)
              console.error(error.stack)
            } else {
              console.error(error)
            }
          }
        }
      },
    }
  },
}

// Export the logger
export const logger = baseLogger
