// Performance monitoring and optimization utilities

// Performance metrics collection
export interface PerformanceMetrics {
  pageLoadTime: number
  domContentLoaded: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  timeToInteractive: number
}

// Collect Core Web Vitals and other performance metrics
export function collectPerformanceMetrics(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    const metrics: Partial<PerformanceMetrics> = {}

    // Page load time
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      metrics.pageLoadTime = navigationEntry.loadEventEnd - navigationEntry.loadEventStart
      metrics.domContentLoaded = navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart
    }

    // Use PerformanceObserver for Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              metrics.firstContentfulPaint = entry.startTime
            }
            break
          case 'largest-contentful-paint':
            metrics.largestContentfulPaint = entry.startTime
            break
          case 'first-input':
            metrics.firstInputDelay = (entry as any).processingStart - entry.startTime
            break
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              metrics.cumulativeLayoutShift = (metrics.cumulativeLayoutShift || 0) + (entry as any).value
            }
            break
        }
      }

      // Check if we have enough metrics
      const requiredMetrics = ['firstContentfulPaint', 'largestContentfulPaint']
      const hasEnoughMetrics = requiredMetrics.every(metric => metrics[metric as keyof PerformanceMetrics] !== undefined)

      if (hasEnoughMetrics) {
        observer.disconnect()
        resolve(metrics as PerformanceMetrics)
      }
    })

    // Observe different entry types
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })
    } catch (error) {
      console.warn('Performance observer not supported:', error)
      resolve(metrics as PerformanceMetrics)
    }

    // Fallback timeout
    setTimeout(() => {
      observer.disconnect()
      resolve(metrics as PerformanceMetrics)
    }, 10000)
  })
}

// Report performance metrics to analytics
export async function reportPerformanceMetrics(metrics: PerformanceMetrics) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance Metrics:', metrics)
    return
  }

  try {
    // In production, send to your analytics service
    await fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    })
  } catch (error) {
    console.error('Failed to report performance metrics:', error)
  }
}

// Lazy loading utility
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  })
}

// Image lazy loading hook
export function useLazyLoading(ref: React.RefObject<HTMLElement>) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = createIntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer?.unobserve(element)
        }
      }
    )

    if (observer) {
      observer.observe(element)
      return () => observer.disconnect()
    } else {
      // Fallback for browsers without IntersectionObserver
      setIsVisible(true)
    }
  }, [ref])

  return isVisible
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if ('memory' in performance) {
    const memInfo = (performance as any).memory
    return {
      usedJSHeapSize: memInfo.usedJSHeapSize,
      totalJSHeapSize: memInfo.totalJSHeapSize,
      jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
      usagePercentage: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100,
    }
  }
  return null
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return

  const scripts = Array.from(document.querySelectorAll('script[src]'))
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))

  const bundleInfo = {
    scripts: scripts.map(script => ({
      src: (script as HTMLScriptElement).src,
      async: (script as HTMLScriptElement).async,
      defer: (script as HTMLScriptElement).defer,
    })),
    styles: styles.map(style => ({
      href: (style as HTMLLinkElement).href,
    })),
  }

  console.log('Bundle Analysis:', bundleInfo)
  return bundleInfo
}

// Performance budget checker
export function checkPerformanceBudget(metrics: PerformanceMetrics) {
  const budgets = {
    firstContentfulPaint: 1800, // 1.8s
    largestContentfulPaint: 2500, // 2.5s
    firstInputDelay: 100, // 100ms
    cumulativeLayoutShift: 0.1, // 0.1
  }

  const violations: string[] = []

  Object.entries(budgets).forEach(([metric, budget]) => {
    const value = metrics[metric as keyof PerformanceMetrics]
    if (value > budget) {
      violations.push(`${metric}: ${value} exceeds budget of ${budget}`)
    }
  })

  if (violations.length > 0) {
    console.warn('Performance Budget Violations:', violations)
  }

  return violations
}

// Preload critical resources
export function preloadCriticalResources() {
  const criticalResources = [
    '/icons/icon-192x192.png',
    '/manifest.json',
  ]

  criticalResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = resource
    
    if (resource.endsWith('.png')) {
      link.as = 'image'
    } else if (resource.endsWith('.json')) {
      link.as = 'fetch'
      link.crossOrigin = 'anonymous'
    }
    
    document.head.appendChild(link)
  })
}

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return

  // Collect and report metrics after page load
  window.addEventListener('load', async () => {
    // Wait a bit for all resources to load
    setTimeout(async () => {
      try {
        const metrics = await collectPerformanceMetrics()
        await reportPerformanceMetrics(metrics)
        checkPerformanceBudget(metrics)
        
        // Monitor memory usage periodically
        setInterval(() => {
          const memoryInfo = monitorMemoryUsage()
          if (memoryInfo && memoryInfo.usagePercentage > 80) {
            console.warn('High memory usage detected:', memoryInfo)
          }
        }, 30000) // Check every 30 seconds
      } catch (error) {
        console.error('Performance monitoring failed:', error)
      }
    }, 1000)
  })

  // Preload critical resources
  preloadCriticalResources()
}

// React import for useLazyLoading hook
import React from 'react' 