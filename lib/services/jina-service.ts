"use server"

/**
 * Service for scraping F1 Fantasy data using Jina AI
 */

const JINA_API_KEY = "jina_5957feb36e7d4b0fa2e9362b7c86feb8VgdF96LSYdgumTxhgRGF7bUy-7LF"
const JINA_API_URL = "https://r.jina.ai/"

/**
 * Scrape content from a URL using Jina AI
 */
export async function scrapeUrl(url: string): Promise<string> {
  try {
    console.log(`Scraping ${url} with Jina AI...`)
    
    // Use URL directly without additional parameters
    const encodedUrl = encodeURIComponent(url)
    const jinaUrl = `${JINA_API_URL}${encodedUrl}`
    
    const response = await fetch(jinaUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${JINA_API_KEY}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to scrape with Jina AI: ${response.statusText} (${response.status})`)
    }
    
    const data = await response.text()
    console.log(`Jina AI response length: ${data.length}`)
    
    if (!data || data.length < 100) {
      throw new Error("Empty or insufficient content received from Jina AI")
    }
    
    console.log(`Jina AI response preview: ${data.substring(0, 300)}`)
    
    return data
  } catch (error) {
    console.error("Error using Jina AI scraping service:", error)
    throw error
  }
}

/**
 * Scrape driver fantasy data from the F1 Fantasy website using Jina AI
 */
export async function scrapeDriverFantasyData(): Promise<string> {
  return scrapeUrl("https://fantasy.formula1.com/en/statistics/details?tab=driver&filter=fPoints")
}

/**
 * Scrape constructor fantasy data from the F1 Fantasy website using Jina AI
 */
export async function scrapeConstructorFantasyData(): Promise<string> {
  return scrapeUrl("https://fantasy.formula1.com/en/statistics/details?tab=constructor&filter=fPoints")
} 