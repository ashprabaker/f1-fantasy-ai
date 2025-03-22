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
    // Start async processing in the background
    // This prevents timeout by immediately returning while processing continues
    startBackgroundSync()
    
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

// This function runs the actual sync process in the background
async function startBackgroundSync() {
  try {
    // STEP 1: Get F1 API data for driver details (names, images, numbers, etc.)
    let f1Drivers: Driver[] = []
    let f1DriverMap = new Map<string, Driver>()
    let f1TeamNameMap = new Map<string, string>() // Maps normalized team names to original casing
    
    try {
      console.log("Fetching F1 API data for 2025 season...")
      const currentData = await getCurrentSeasonData()
      f1Drivers = currentData.drivers || []
      
      if (f1Drivers.length > 0) {
        console.log(`Found ${f1Drivers.length} drivers in OpenF1 API`)
        
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
        console.warn("No drivers found in the OpenF1 API")
      }
    } catch (error) {
      console.error("Error fetching OpenF1 data:", error)
      // We'll continue even without OpenF1 data
    }
    
    // STEP 2: Scrape F1 Fantasy data for points and prices
    console.log("Scraping F1 Fantasy data for points and prices...")
    
    // Get driver data
    let fantasyDrivers: DriverFantasyData[] = []
    try {
      const driverContent = await scrapeDriverFantasyData()
      console.log("Successfully scraped driver fantasy data")
      fantasyDrivers = await extractDriverData(driverContent)
      console.log(`Extracted ${fantasyDrivers.length} drivers from F1 Fantasy`)
    } catch (error) {
      console.error("Error getting F1 Fantasy driver data:", error)
      
      // Log error but continue
      console.warn("Continuing with OpenF1 data only due to fantasy driver data error")
    }
    
    // Get constructor data
    let fantasyConstructors: ConstructorFantasyData[] = []
    try {
      const constructorContent = await scrapeConstructorFantasyData()
      console.log("Successfully scraped constructor fantasy data")
      fantasyConstructors = await extractConstructorData(constructorContent)
      console.log(`Extracted ${fantasyConstructors.length} constructors from F1 Fantasy`)
    } catch (error) {
      console.error("Error getting F1 Fantasy constructor data:", error)
      
      // Log error but continue with just driver data
      console.log("Continuing with driver data only due to constructor data error")
      fantasyConstructors = [] // Ensure empty array for safety
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
    
    console.log(`Prepared ${openF1DriversMap.size} OpenF1 driver base records`)
    
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
      // Process fantasy drivers and merge with OpenF1 data
      for (const fantasyDriver of fantasyDrivers) {
        // Normalize fantasy driver name for comparison
        const fantasyNameNormalized = fantasyDriver.name.toLowerCase().trim()
        
        // Try to find a matching OpenF1 driver
        let openF1Driver: InsertMarketDriver | undefined
        
        // Check if we have a direct match
        if (openF1DriversMap.has(fantasyNameNormalized)) {
          openF1Driver = openF1DriversMap.get(fantasyNameNormalized)
        } else {
          // Try partial matching
          for (const [key, driver] of openF1DriversMap.entries()) {
            if (
              fantasyNameNormalized.includes(key) || 
              key.includes(fantasyNameNormalized)
            ) {
              openF1Driver = driver
              break
            }
          }
        }
        
        // Create the merged driver record
        let mergedDriver: InsertMarketDriver
        
        if (openF1Driver) {
          // Use OpenF1 data for metadata and fantasy data for points/prices
          mergedDriver = {
            ...openF1Driver,
            price: fantasyDriver.price,
            points: fantasyDriver.points
          }
          
          // Skip if we already processed this driver number
          if (processedDriverNumbers.has(mergedDriver.driverNumber)) {
            console.log(`Skipping duplicate driver ${mergedDriver.name} (#${mergedDriver.driverNumber})`)
            continue
          }
          
          processedDriverNumbers.add(mergedDriver.driverNumber)
        } else {
          // If no OpenF1 match, use fantasy data for everything
          mergedDriver = {
            driverNumber: 0, // No driver number available
            name: fantasyDriver.name,
            team: fantasyDriver.team,
            teamColor: "#FFFFFF", // Default color
            imageUrl: "", // No image available
            countryCode: "", // No country code available
            price: fantasyDriver.price,
            points: fantasyDriver.points
          }
        }
        
        mergedDrivers.push(mergedDriver)
        console.log(`Merged driver: ${mergedDriver.name} (#${mergedDriver.driverNumber}), Price: $${mergedDriver.price}M, Points: ${mergedDriver.points}`)
      }
    }
    
    console.log(`Total drivers prepared: ${mergedDrivers.length}`)
    
    // STEP 4: Prepare the constructor data
    console.log("Preparing merged constructor data...")
    const mergedConstructors: InsertMarketConstructor[] = []
    const processedTeams = new Set<string>() // To prevent duplicates
    
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
    
    // Now process fantasy constructors
    for (const fantasyConstructor of fantasyConstructors) {
      // Normalize the constructor name
      const normalizedName = fantasyConstructor.name.toLowerCase().trim()
      
      // Skip if we already processed this team
      if (processedTeams.has(normalizedName)) {
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
      
      // Add to our merged list and mark as processed
      processedTeams.add(normalizedName)
      mergedConstructors.push(marketConstructor)
      console.log(`Merged constructor: ${teamInfo}, Price: $${marketConstructor.price}M, Points: ${marketConstructor.points}`)
    }
    
    // STEP 5: Update database with the merged data (replace all existing records)
    console.log(`Updating database with ${mergedDrivers.length} drivers and ${mergedConstructors.length} constructors...`)
    
    try {
      await updateMarketData(mergedDrivers, mergedConstructors)
      console.log("Database update successful")
      
      // Revalidate the paths that display market data after successful update
      revalidatePath("/dashboard")
      revalidatePath("/dashboard/market")
    } catch (error) {
      console.error("Error updating database:", error)
    }
  } catch (error) {
    console.error("Error in background sync process:", error)
  }
} 