import { logger } from "./logger"

// Create module-specific logger
const log = logger.forModule("performanceMonitor")

interface PerformanceMetric {
  count: number
  totalTime: number
  minTime: number
  maxTime: number
  avgTime: number
  lastTime: number
}

interface PerformanceReport {
  metrics: Record<string, PerformanceMetric>
  totalOperations: number
  slowestOperation: {
    name: string
    time: number
  } | null
  fastestOperation: {
    name: string
    time: number
  } | null
  overallAverage: number
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Record<string, PerformanceMetric> = {}
  private startTimes: Record<string, number> = {}
  private enabled = true
  private thresholds: Record<string, number> = {
    default: 100, // Default threshold in ms
  }

  private constructor() {
    // Initialize with default thresholds for common operations
    this.thresholds = {
      default: 100,
      "sentiment-analysis": 500,
      "emotional-state-update": 50,
      "prompt-injection": 200,
      "pii-detection": 20,
    }

    // Check if performance monitoring is enabled
    this.enabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_PERFORMANCE_MONITORING === "true"
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Start timing an operation
   */
  public start(operationName: string): void {
    if (!this.enabled) return

    this.startTimes[operationName] = performance.now()
  }

  /**
   * End timing an operation and record the metric
   */
  public end(operationName: string, metadata?: Record<string, any>): number {
    if (!this.enabled || !this.startTimes[operationName]) return 0

    const endTime = performance.now()
    const startTime = this.startTimes[operationName]
    const duration = endTime - startTime

    // Initialize metric if it doesn't exist
    if (!this.metrics[operationName]) {
      this.metrics[operationName] = {
        count: 0,
        totalTime: 0,
        minTime: Number.POSITIVE_INFINITY,
        maxTime: 0,
        avgTime: 0,
        lastTime: 0,
      }
    }

    const metric = this.metrics[operationName]
    metric.count++
    metric.totalTime += duration
    metric.minTime = Math.min(metric.minTime, duration)
    metric.maxTime = Math.max(metric.maxTime, duration)
    metric.avgTime = metric.totalTime / metric.count
    metric.lastTime = duration

    // Check if this operation exceeded its threshold
    const threshold = this.thresholds[operationName] || this.thresholds.default
    if (duration > threshold) {
      log.warn(`Performance warning: ${operationName} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`, {
        ...metadata,
        duration,
        threshold,
        avgTime: metric.avgTime,
      })
    }

    // Clean up
    delete this.startTimes[operationName]

    return duration
  }

  /**
   * Measure the execution time of a function
   */
  public async measure<T>(operationName: string, fn: () => Promise<T> | T, metadata?: Record<string, any>): Promise<T> {
    if (!this.enabled) {
      return fn()
    }

    this.start(operationName)
    try {
      const result = await fn()
      this.end(operationName, metadata)
      return result
    } catch (error) {
      this.end(operationName, { ...metadata, error: true })
      throw error
    }
  }

  /**
   * Set a custom threshold for an operation
   */
  public setThreshold(operationName: string, thresholdMs: number): void {
    this.thresholds[operationName] = thresholdMs
  }

  /**
   * Get a report of all performance metrics
   */
  public getReport(): PerformanceReport {
    let totalOperations = 0
    let totalTime = 0
    let slowestOperation: { name: string; time: number } | null = null
    let fastestOperation: { name: string; time: number } | null = null

    // Calculate overall statistics
    Object.entries(this.metrics).forEach(([name, metric]) => {
      totalOperations += metric.count
      totalTime += metric.totalTime

      if (!slowestOperation || metric.maxTime > slowestOperation.time) {
        slowestOperation = { name, time: metric.maxTime }
      }

      if (!fastestOperation || metric.minTime < fastestOperation.time) {
        fastestOperation = { name, time: metric.minTime }
      }
    })

    return {
      metrics: { ...this.metrics },
      totalOperations,
      slowestOperation,
      fastestOperation,
      overallAverage: totalOperations > 0 ? totalTime / totalOperations : 0,
    }
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.metrics = {}
    this.startTimes = {}
  }

  /**
   * Enable or disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Decorator for measuring method performance
export function measure(operationName?: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value
    const methodName = operationName || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(methodName, () => originalMethod.apply(this, args), {
        class: target.constructor.name,
        method: propertyKey,
      })
    }

    return descriptor
  }
}
