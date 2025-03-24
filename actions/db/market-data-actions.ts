"use server"

import { 
  getMarketDrivers,
  getMarketConstructors,
  updateMarketDriver,
  updateMarketConstructor,
  createMarketDriver,
  createMarketConstructor,
  updateMarketData
} from "@/db/queries/market-data-queries"
import { InsertMarketDriver, InsertMarketConstructor, SelectMarketDriver, SelectMarketConstructor } from "@/db/schema"
import { ActionState } from "@/types"
import { revalidatePath } from "next/cache"
import { 
  getCurrentSeasonData,
  Driver
} from "@/lib/services/openf1-service"
import {
  scrapeDriverFantasyData,
  scrapeConstructorFantasyData,
  extractDriverData,
  extractConstructorData,
  DriverFantasyData,
  ConstructorFantasyData
} from "@/lib/services/scraping-service"
import { DataExtractionError, FantasyDataError } from "@/lib/services/custom-errors"
import { scrapeWebpage } from "@/lib/services/firecrawl-service"
import * as JinaService from "@/lib/services/jina-service"
import { db } from "@/db/db"
import { eq } from "drizzle-orm"

// Define a type for errors with response details
interface ApiError extends Error {
  code?: string;
  response?: {
    status?: number;
    headers?: Record<string, string>;
    data?: unknown;
  };
  request?: unknown;
  stack?: string;
  status?: number;
}

export async function getMarketDriversAction(): Promise<ActionState<SelectMarketDriver[]>> {
  try {
    const drivers = await getMarketDrivers()
    return {
      isSuccess: true,
      message: "Drivers retrieved successfully",
      data: drivers
    }
  } catch (error) {
    console.error("Error getting market drivers:", error)
    return { isSuccess: false, message: "Failed to get market drivers" }
  }
}

export async function getMarketConstructorsAction(): Promise<ActionState<SelectMarketConstructor[]>> {
  try {
    const constructors = await getMarketConstructors()
    return {
      isSuccess: true,
      message: "Constructors retrieved successfully",
      data: constructors
    }
  } catch (error) {
    console.error("Error getting market constructors:", error)
    return { isSuccess: false, message: "Failed to get market constructors" }
  }
}

export async function syncF1DataAction(): Promise<ActionState<{ 
  driversUpdated: number, 
  constructorsUpdated: number 
}>> {
  try {
    // Get user ID from auth
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Unauthorized",
        data: {
          driversUpdated: 0,
          constructorsUpdated: 0
        }
      };
    }
    
    // Rate limiting is now handled through the subscriptions table
    // We removed the profiles table rate limiting functionality
    
    // Start async processing in the background
    // This prevents timeout by immediately returning while processing continues
    startBackgroundSync();
    
    return {
      isSuccess: true,
      message: "F1 Fantasy data sync started. This may take a minute to complete in the background.",
      data: {
        driversUpdated: 0,
        constructorsUpdated: 0
      }
    }
  } catch (error) {
    console.error("Error initiating F1 Fantasy data sync:", error)
    return { isSuccess: false, message: "Failed to start F1 Fantasy data sync" }
  }
}

// Utility function for exponential backoff retry
async function withRetry<T>(
  fn: () => Promise<T>,
  options = { 
    maxRetries: 3, 
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 2,
    retryOnError: (err: ApiError) => true
  }
): Promise<T> {
  let { maxRetries, initialDelay, factor, maxDelay, retryOnError } = options
  let delay = initialDelay
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt > maxRetries || !retryOnError(err as ApiError)) {
        throw err
      }
      
      console.log(`[F1-SYNC] Retry attempt ${attempt}/${maxRetries} after error: ${(err as Error).message || String(err)}`)
      
      // Wait before next retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Increase delay for next attempt, but cap at maxDelay
      delay = Math.min(delay * factor, maxDelay)
    }
  }
  
  throw new Error("Should not reach here")
}

// This function runs the actual sync process in the background
async function startBackgroundSync() {
  try {
    // STEP 1: Get F1 API data for driver details (names, images, numbers, etc.)
    let f1Drivers: Driver[] = []
    let f1DriverMap = new Map<string, Driver>()
    let f1TeamNameMap = new Map<string, string>() // Maps normalized team names to original casing
    
    try {
      console.log("[F1-SYNC] Fetching F1 API data for 2025 season...")
      // Use retry for the API call that's failing in production
      const currentData = await withRetry(() => getCurrentSeasonData(), {
        maxRetries: 5,
        initialDelay: 2000,
        maxDelay: 15000,
        factor: 2,
        retryOnError: (err: ApiError) => {
          // Only retry on network errors or server errors
          const isNetworkError = err.code === 'ECONNRESET' || 
                                 err.code === 'ETIMEDOUT' || 
                                 err.message?.includes('network') ||
                                 err.message?.includes('connection');
          const isServerError = err.status !== undefined && err.status >= 500;
          console.log(`[F1-SYNC] Error type: network=${isNetworkError}, server=${isServerError}, code=${err.code}`);
          return isNetworkError || isServerError;
        }
      });
      f1Drivers = currentData.drivers || []
      
      if (f1Drivers.length > 0) {
        console.log(`[F1-SYNC] Found ${f1Drivers.length} drivers in OpenF1 API`)
        
        // Create normalized name maps for easier matching
        f1Drivers.forEach(driver => {
          // Full name normalized (e.g., "max verstappen")
          const fullName = `${driver.first_name} ${driver.last_name}`.toLowerCase().trim()
          f1DriverMap.set(fullName, driver)
          
          // Last name only normalized (e.g., "verstappen")
          const lastName = driver.last_name.toLowerCase().trim()
          if (!f1DriverMap.has(lastName)) {
            f1DriverMap.set(lastName, driver)
          }
          
          // Team name mapping for constructors
          const teamName = driver.team_name.toLowerCase().trim()
          if (!f1TeamNameMap.has(teamName)) {
            f1TeamNameMap.set(teamName, driver.team_name)
          }
          
          // Handle special cases like "KICK SAUBER" vs "Sauber"
          if (teamName.includes('sauber')) {
            f1TeamNameMap.set('kick sauber', driver.team_name)
          }
          if (teamName.includes('racing bulls')) {
            f1TeamNameMap.set('racing bulls', driver.team_name)
          }
        })
      } else {
        console.warn("[F1-SYNC] No drivers found in the OpenF1 API")
      }
    } catch (error: any) {
      console.error("[F1-SYNC] Error fetching OpenF1 data:", error)
      console.error("[F1-SYNC] Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      
      if (error.response) {
        console.error("[F1-SYNC] Response error data:", {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data
        })
      } else if (error.request) {
        console.error("[F1-SYNC] Request error:", {
          method: error.request.method,
          path: error.request.path,
          host: error.request.host,
          protocol: error.request.protocol
        })
      }
      
      // We'll continue even without OpenF1 data
      console.log("[F1-SYNC] Continuing without OpenF1 data due to API error")
    }
    
    // STEP 2: Scrape F1 Fantasy data for points and prices
    console.log("[F1-SYNC] Scraping F1 Fantasy data for points and prices...")
    
    // Get driver data
    let fantasyDrivers: DriverFantasyData[] = []
    try {
      console.log("[F1-SYNC] Starting driver fantasy data scraping...")
      const startTime = Date.now()
      const driverContent = await withRetry(() => scrapeDriverFantasyData(), {
        maxRetries: 3,
        initialDelay: 2000,
        maxDelay: 10000,
        factor: 2,
        retryOnError: (err) => {
          // Retry on any error with the scraper
          console.log(`[F1-SYNC] Driver scraper error: ${err.message || err}`);
          return true;
        }
      });
      console.log(`[F1-SYNC] Driver scraping completed in ${Date.now() - startTime}ms`)
      console.log(`[F1-SYNC] Driver content length: ${driverContent.length}`)
      
      console.log("[F1-SYNC] Extracting driver data with AI...")
      const extractStartTime = Date.now()
      
      // Add retry logic using different extraction approaches
      fantasyDrivers = await withRetry(() => extractDriverData(driverContent), {
        maxRetries: 3,
        initialDelay: 2000,
        maxDelay: 8000,
        factor: 2,
        retryOnError: (err) => {
          // Retry extraction on all errors except when we've tried all possible methods
          const message = err.message || String(err);
          const isPermError = message.includes("No driver data found") || 
                             message.includes("parsing AI driver data response");
          
          console.log(`[F1-SYNC] Extraction error: ${message}, retryable: ${!isPermError}`);
          return !isPermError;
        }
      });
      
      console.log(`[F1-SYNC] Driver extraction completed in ${Date.now() - extractStartTime}ms`)
      console.log(`[F1-SYNC] Extracted ${fantasyDrivers.length} drivers from F1 Fantasy`)
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error("[F1-SYNC] Error getting F1 Fantasy driver data:", apiError)
      console.error("[F1-SYNC] Error details:", {
        message: apiError.message,
        code: apiError.code,
        stack: apiError.stack,
        name: apiError.name
      })
      
      // Log error but continue
      console.warn("[F1-SYNC] Continuing with OpenF1 data only due to fantasy driver data error")
    }
    
    // Get constructor data
    let fantasyConstructors: ConstructorFantasyData[] = []
    console.log("[F1-SYNC] Starting constructor fantasy data scraping...");
    try {
      const startTime = Date.now()
      console.log("Attempting to scrape constructor data with Jina AI...");
      
      // We'll try up to 3 URLs to ensure we get constructor data
      const potentialUrls = [
        "https://fantasy.formula1.com/en/statistics/details?tab=constructor&filter=fPoints",
        "https://fantasy.formula1.com/en/statistics",
        "https://fantasy.formula1.com/en/statistics/details"
      ];
      
      // Let's try each URL until we get good content
      let constructorContent = "";
      
      for (const url of potentialUrls) {
        try {
          console.log(`Scraping ${url} with Jina AI...`);
          constructorContent = await withRetry(() => JinaService.scrapeUrl(url), {
            maxRetries: 2,
            initialDelay: 2000,
            maxDelay: 5000,
            factor: 2,
            retryOnError: (err) => {
              // Retry on any error
              console.log(`[F1-SYNC] Scraping error for ${url}: ${err.message || err}`);
              return true;
            }
          });
          
          // If we got substantial content, break the loop
          if (constructorContent && constructorContent.length > 3000) {
            console.log(`Successfully scraped content from ${url} with length ${constructorContent.length}`);
            break;
          } else {
            console.log(`Content from ${url} too short (${constructorContent.length}), trying another URL`);
          }
        } catch (err) {
          console.error(`Error scraping ${url}:`, err);
          // Continue to next URL
        }
      }
      
      // If we still didn't get good content, try the direct API with Jina
      if (!constructorContent || constructorContent.length < 2000) {
        console.log("All URL attempts failed, trying direct constructor scraping...");
        constructorContent = await withRetry(() => JinaService.scrapeConstructorFantasyData(), {
          maxRetries: 3,
          initialDelay: 2000,
          maxDelay: 10000,
          factor: 2,
          retryOnError: (err) => {
            // Retry on any error with the scraper
            console.log(`[F1-SYNC] Constructor scraper error: ${err.message || err}`);
            return true;
          }
        });
      }
      
      console.log(`[F1-SYNC] Constructor scraping completed in ${Date.now() - startTime}ms`)
      console.log(`[F1-SYNC] Constructor content length: ${constructorContent.length}`)
      
      if (constructorContent.length < 1000) {
        throw new Error("Constructor content too short for reliable extraction");
      }
      
      console.log("[F1-SYNC] Extracting constructor data with AI...")
      const extractStartTime = Date.now()
      
      // Try multiple extraction approaches if needed
      try {
        fantasyConstructors = await withRetry(() => extractConstructorData(constructorContent), {
          maxRetries: 2,
          initialDelay: 1000,
          maxDelay: 5000,
          factor: 1.5,
          retryOnError: (err) => {
            console.log("[F1-SYNC] Constructor extraction error, retrying:", err.message);
            return true; // Always retry extraction
          }
        });
        
        console.log(`[F1-SYNC] Constructor extraction completed in ${Date.now() - extractStartTime}ms`)
        console.log(`[F1-SYNC] Extracted ${fantasyConstructors.length} constructors from F1 Fantasy`)
      } catch (error) {
        console.error("[F1-SYNC] Failed to extract constructor data with multiple retries:", error);
        throw error;
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error("[F1-SYNC] Error getting F1 Fantasy constructor data:", apiError)
      console.error("[F1-SYNC] Error details:", {
        message: apiError.message,
        code: apiError.code,
        stack: apiError.stack,
        name: apiError.name
      });
      
      // Throw error to stop the sync
      throw new Error(`Failed to get constructor data: ${apiError.message}`);
    }
    
    // STEP 3: Prepare the driver data by merging API and Fantasy data
    console.log("Preparing merged driver data...")
    const mergedDrivers: InsertMarketDriver[] = []
    const processedDriverNumbers = new Set<number>() // To prevent duplicates
    
    // First, get all OpenF1 drivers 
    const openF1DriversMap = new Map<string, InsertMarketDriver>()
    
    // Prepare all drivers from OpenF1 API first
    for (const apiDriver of f1Drivers) {
      const driverNumber = apiDriver.driver_number
      
      // Skip if we already processed this driver number
      if (processedDriverNumbers.has(driverNumber)) {
        console.log(`Skipping duplicate OpenF1 driver #${driverNumber}`)
        continue
      }
      
      // Create a base driver record with OpenF1 data
      const driverRecord = {
        driverNumber,
        name: `${apiDriver.first_name} ${apiDriver.last_name}`,
        team: apiDriver.team_name,
        teamColor: apiDriver.team_colour || "#FFFFFF",
        imageUrl: apiDriver.headshot_url || "",
        countryCode: apiDriver.country_code || "",
        price: 0, // Will be replaced with fantasy data
        points: 0  // Will be replaced with fantasy data
      }
      
      openF1DriversMap.set(
        `${apiDriver.first_name.toLowerCase()} ${apiDriver.last_name.toLowerCase()}`,
        driverRecord
      )
      
      // Also add just by last name for easier matching
      openF1DriversMap.set(
        apiDriver.last_name.toLowerCase(),
        driverRecord
      )
      
      processedDriverNumbers.add(driverNumber)
    }
    
    console.log(`Prepared ${processedDriverNumbers.size} OpenF1 driver base records (${openF1DriversMap.size} map entries)`)
    
    // Reset for merging process
    processedDriverNumbers.clear()
    
    // If we don't have any fantasy drivers, use just the OpenF1 data
    if (fantasyDrivers.length === 0) {
      console.log("No fantasy driver data - using OpenF1 driver data with default prices and points")
      
      // Get a unique set of drivers (the map may have duplicates with different keys)
      const uniqueDrivers = new Map<number, InsertMarketDriver>()
      
      for (const [_, driver] of openF1DriversMap.entries()) {
        if (!uniqueDrivers.has(driver.driverNumber)) {
          // Assign default price based on team (top teams = higher price)
          let price = 10.0 // default price
          
          const teamNameLower = driver.team.toLowerCase()
          if (teamNameLower.includes('red bull') || teamNameLower.includes('ferrari') || teamNameLower.includes('mercedes')) {
            price = 25.0 // top teams
          } else if (teamNameLower.includes('mclaren') || teamNameLower.includes('aston martin')) {
            price = 18.0 // mid-high teams
          } else if (teamNameLower.includes('alpine') || teamNameLower.includes('williams')) {
            price = 12.0 // mid teams
          }
          
          // Add to unique drivers with default price/points
          uniqueDrivers.set(driver.driverNumber, {
            ...driver,
            price,
            points: 0 // no fantasy points available
          })
        }
      }
      
      // Add all unique drivers to merged drivers array
      for (const [_, driver] of uniqueDrivers.entries()) {
        mergedDrivers.push(driver)
        console.log(`Using OpenF1 driver with default values: ${driver.name} (#${driver.driverNumber}), Price: $${driver.price}M, Points: ${driver.points}`)
      }
    } else {
      // If we have fantasy drivers, merge them with OpenF1 data
      console.log("Merging OpenF1 and fantasy driver data...")
      
      // Track unique drivers by driver number to avoid duplicates
      const uniqueDrivers = new Map<number, InsertMarketDriver>()
      
      // First map all OpenF1 drivers by driver number (each driver only once)
      for (const [_, driver] of openF1DriversMap.entries()) {
        if (!uniqueDrivers.has(driver.driverNumber)) {
          uniqueDrivers.set(driver.driverNumber, driver)
        }
      }
      
      console.log(`Found ${uniqueDrivers.size} unique drivers from OpenF1 data`)
      
      // Now try to match fantasy drivers to OpenF1 drivers and merge the data
      for (const fantasyDriver of fantasyDrivers) {
        // Try to find a matching OpenF1 driver by name similarity
        let bestMatch: InsertMarketDriver | null = null
        
        // Normalize the fantasy driver name for comparison
        const fantasyName = fantasyDriver.name.toLowerCase().replace(/\s+/g, '')
        
        for (const [driverNumber, openF1Driver] of uniqueDrivers.entries()) {
          const openF1Name = openF1Driver.name.toLowerCase().replace(/\s+/g, '')
          
          // Check for name matches
          if (openF1Name.includes(fantasyName) || 
              fantasyName.includes(openF1Name) ||
              // Also try by last name
              fantasyName.includes(openF1Driver.name.split(' ').pop()?.toLowerCase() || '')) {
            bestMatch = openF1Driver
            break
          }
        }
        
        if (bestMatch) {
          // Update the driver with fantasy data
          uniqueDrivers.set(bestMatch.driverNumber, {
            ...bestMatch,
            price: fantasyDriver.price,
            points: fantasyDriver.points
          })
          
          console.log(`Merged driver ${bestMatch.name} (#${bestMatch.driverNumber}) with fantasy data: $${fantasyDriver.price}M, ${fantasyDriver.points} points`)
        } else {
          // Fantasy driver with no OpenF1 match, create new entry
          // Generate a unique driver number for fantasy-only drivers
          const fantasyDriverNumber = -(uniqueDrivers.size + 1) // Use negative numbers to avoid conflicts
          
          uniqueDrivers.set(fantasyDriverNumber, {
            driverNumber: fantasyDriverNumber,
            name: fantasyDriver.name,
            team: fantasyDriver.team,
            teamColor: "#FFFFFF", // Default color
            imageUrl: "", // No image
            countryCode: "", // No country code
            price: fantasyDriver.price,
            points: fantasyDriver.points
          })
          
          console.log(`Added fantasy-only driver ${fantasyDriver.name} with generated number #${fantasyDriverNumber}`)
        }
      }
      
      // Convert the map to an array for the final result
      for (const driver of uniqueDrivers.values()) {
        mergedDrivers.push(driver)
      }
    }
    
    console.log(`Prepared ${mergedDrivers.length} merged driver records`)
    
    // STEP 4: Prepare the constructor data
    console.log("Preparing merged constructor data...")
    const mergedConstructors: InsertMarketConstructor[] = []
    
    // Track unique constructors by name to avoid duplicates
    const uniqueConstructors = new Map<string, InsertMarketConstructor>()
    
    // First, build a map of team names to colors from OpenF1 data
    const teamColorMap = new Map<string, string>()
    
    // Extract team colors from OpenF1 data and normalize team names
    for (const driver of f1Drivers) {
      const teamName = driver.team_name.toLowerCase().trim()
      if (!teamColorMap.has(teamName) && driver.team_colour) {
        teamColorMap.set(teamName, driver.team_colour)
        
        // Add variations of team names
        if (teamName.includes('red bull')) {
          teamColorMap.set('red bull', driver.team_colour)
          teamColorMap.set('redbull', driver.team_colour)
        }
        if (teamName.includes('racing bulls')) {
          teamColorMap.set('racing bulls', driver.team_colour)
          teamColorMap.set('racingbulls', driver.team_colour)
        }
        if (teamName.includes('kick sauber')) {
          teamColorMap.set('kick sauber', driver.team_colour)
          teamColorMap.set('sauber', driver.team_colour)
        }
        if (teamName.includes('aston martin')) {
          teamColorMap.set('aston martin', driver.team_colour)
          teamColorMap.set('astonmartin', driver.team_colour)
        }
      }
    }
    
    console.log(`Built team color map with ${teamColorMap.size} entries`)
    
    // Process fantasy constructors and ensure we only add each one once
    for (const fantasyConstructor of fantasyConstructors) {
      // Normalize the constructor name
      const normalizedName = fantasyConstructor.name.toLowerCase().trim()
      
      // Skip if we already processed this team
      if (uniqueConstructors.has(normalizedName)) {
        console.log(`Skipping duplicate constructor: ${fantasyConstructor.name}`)
        continue
      }
      
      // Find matching team color from OpenF1 data
      let teamColor = "#FFFFFF"
      let matchFound = false
      
      // Look for direct match first
      if (teamColorMap.has(normalizedName)) {
        teamColor = teamColorMap.get(normalizedName)!
        matchFound = true
      } else {
        // Try fuzzy matching
        for (const [key, color] of teamColorMap.entries()) {
          if (normalizedName.includes(key) || key.includes(normalizedName)) {
            teamColor = color
            matchFound = true
            break
          }
        }
      }
      
      const teamInfo = matchFound ? `${fantasyConstructor.name} (using OpenF1 colors)` : `${fantasyConstructor.name} (default color)`
      
      // Create constructor record
      const marketConstructor: InsertMarketConstructor = {
        name: fantasyConstructor.name,
        color: teamColor,
        // Use F1 Fantasy data for points and price
        price: fantasyConstructor.price,
        points: fantasyConstructor.points
      }
      
      // Add to our unique constructors map
      uniqueConstructors.set(normalizedName, marketConstructor)
      console.log(`Added constructor: ${teamInfo}, Price: $${marketConstructor.price}M, Points: ${marketConstructor.points}`)
    }
    
    // Convert the map to an array for the final result
    for (const constructor of uniqueConstructors.values()) {
      mergedConstructors.push(constructor)
    }
    
    console.log(`Prepared ${mergedConstructors.length} merged constructor records`)
    
    // STEP 5: Update database with the merged data (replace all existing records)
    console.log(`Updating database with ${mergedDrivers.length} drivers and ${mergedConstructors.length} constructors...`)
    
    try {
      await updateMarketData(mergedDrivers, mergedConstructors)
      console.log("Database update successful")
      
      // Server components using the data will revalidate on next request
      return {
        isSuccess: true,
        message: "Market data updated successfully",
        data: {
          driversUpdated: mergedDrivers.length,
          constructorsUpdated: mergedConstructors.length
        }
      }
    } catch (error) {
      console.error("Error updating database:", error)
      return {
        isSuccess: false,
        message: "Failed to update market data",
        data: {
          driversUpdated: 0,
          constructorsUpdated: 0
        }
      }
    }
  } catch (error) {
    console.error("Error in background sync process:", error)
    return {
      isSuccess: false,
      message: "Error in background sync process",
      data: {
        driversUpdated: 0,
        constructorsUpdated: 0
      }
    }
  }
}