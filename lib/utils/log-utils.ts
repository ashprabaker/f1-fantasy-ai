"use server"

/**
 * Utility functions for logging in a format that's easier to read in Vercel logs
 */

/**
 * Log a message with the F1-SYNC prefix and proper formatting for Vercel logs
 */
export function syncLog(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString()
  const formattedMessage = `[F1-SYNC][${timestamp}] ${message}`
  
  switch (level) {
    case 'warn':
      console.warn(formattedMessage)
      break
    case 'error':
      console.error(formattedMessage)
      break
    default:
      console.log(formattedMessage)
  }
}

/**
 * Log an error with all details in a structured way
 */
export function syncErrorLog(message: string, error: any) {
  const timestamp = new Date().toISOString()
  const prefix = `[F1-SYNC][${timestamp}][ERROR]`
  
  console.error(`${prefix} ${message}`)
  
  // Log basic error info
  console.error(`${prefix} Details: ${error.message || error}`)
  
  // Log error code if available
  if (error.code) {
    console.error(`${prefix} Code: ${error.code}`)
  }
  
  // Log network errors
  if (error.cause) {
    console.error(`${prefix} Cause: ${error.cause}`)
  }
  
  // Log HTTP response details if available
  if (error.response) {
    console.error(`${prefix} Response: Status=${error.response.status}, Headers=${JSON.stringify(error.response.headers)}`)
    if (error.response.data) {
      try {
        console.error(`${prefix} Response Data: ${JSON.stringify(error.response.data)}`)
      } catch (e) {
        console.error(`${prefix} Response Data: [Unable to stringify]`)
      }
    }
  }
  
  // Log stack trace
  if (error.stack) {
    console.error(`${prefix} Stack: ${error.stack}`)
  }
}

/**
 * Format a duration in ms to a human-readable format
 */
export function formatDuration(startTimeMs: number): string {
  const durationMs = Date.now() - startTimeMs
  
  if (durationMs < 1000) {
    return `${durationMs}ms`
  } else if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(2)}s`
  } else {
    const minutes = Math.floor(durationMs / 60000)
    const seconds = ((durationMs % 60000) / 1000).toFixed(2)
    return `${minutes}m ${seconds}s`
  }
}

/**
 * Create a logger that prefixes all messages with a specific tag
 */
export function createLogger(tag: string) {
  return {
    log: (message: string) => syncLog(`[${tag}] ${message}`),
    warn: (message: string) => syncLog(`[${tag}] ${message}`, 'warn'),
    error: (message: string, error?: any) => {
      if (error) {
        syncErrorLog(`[${tag}] ${message}`, error)
      } else {
        syncLog(`[${tag}] ${message}`, 'error')
      }
    },
    time: (startTimeMs: number, label: string) => {
      syncLog(`[${tag}] ${label} completed in ${formatDuration(startTimeMs)}`)
    }
  }
} 