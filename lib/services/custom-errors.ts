/**
 * Custom errors for F1 Fantasy AI
 */

/**
 * Error thrown when data extraction fails
 */
export class DataExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataExtractionError';
  }
}

/**
 * Error thrown when F1 Fantasy API returns insufficient data
 */
export class FantasyDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FantasyDataError';
  }
} 