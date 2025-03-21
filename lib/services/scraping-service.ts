"use server"

/**
 * Combined service for scraping F1 Fantasy data using multiple providers
 */
import * as JinaService from "./jina-service"
import * as FirecrawlService from "./firecrawl-service"

/**
 * Scrape driver fantasy data using Jina AI first, then falling back to Firecrawl
 */
export async function scrapeDriverFantasyData(): Promise<string> {
  try {
    console.log("Attempting to scrape driver data with Jina AI...")
    const content = await JinaService.scrapeDriverFantasyData()
    console.log("Successfully scraped driver data with Jina AI")
    return content
  } catch (error) {
    console.warn("Jina AI scraping failed for drivers, falling back to Firecrawl:", error)
    return FirecrawlService.scrapeDriverFantasyData()
  }
}

/**
 * Scrape constructor fantasy data using Jina AI first, then falling back to Firecrawl
 */
export async function scrapeConstructorFantasyData(): Promise<string> {
  try {
    console.log("Attempting to scrape constructor data with Jina AI...")
    const content = await JinaService.scrapeConstructorFantasyData()
    console.log("Successfully scraped constructor data with Jina AI")
    return content
  } catch (error) {
    console.warn("Jina AI scraping failed for constructors, falling back to Firecrawl:", error)
    return FirecrawlService.scrapeConstructorFantasyData()
  }
}

// Re-export the extraction functions directly from FirecrawlService
export const {
  extractDriverData,
  extractConstructorData
} = FirecrawlService

// Re-export the interfaces
export type {
  DriverFantasyData,
  ConstructorFantasyData
} from "./firecrawl-service" 