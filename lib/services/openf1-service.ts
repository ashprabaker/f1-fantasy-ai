"use server"

/**
 * Service for fetching F1 data from the OpenF1 API
 */

const BASE_URL = "https://api.openf1.org/v1"

// Remove unused imports
// import { pgTable, text, uuid, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";

// Add error type definitions
interface ApiError extends Error {
  code?: string;
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
  };
  request?: {
    method?: string;
    path?: string;
    host?: string;
    protocol?: string;
  };
  status?: number;
  cause?: unknown;
}

export interface Meeting {
  meeting_key: number
  meeting_code: string
  meeting_name: string
  meeting_official_name: string
  circuit_key: number
  circuit_short_name: string
  location: string
  country_key: number
  country_code: string
  country_name: string
  date_start: string
  year: number
  gmt_offset: string
}

export interface Session {
  session_key: number
  session_name: string
  session_type: string
  date_start: string
  date_end: string
  meeting_key: number
  circuit_key: number
  circuit_short_name: string
  location: string
  country_key: number
  country_code: string
  country_name: string
  year: number
  gmt_offset: string
}

export interface Driver {
  driver_number: number
  broadcast_name: string
  full_name: string
  name_acronym: string
  team_name: string
  team_colour: string
  first_name: string
  last_name: string
  headshot_url: string | null
  country_code: string
  session_key: number
  meeting_key: number
}

export interface Position {
  position: number
  driver_number: number
  date: string
  session_key: number
  meeting_key: number
}

export interface FastestLap {
  driver_number: number
  lap_number: number
  lap_time: string
  session_key: number
  meeting_key: number
}

/**
 * Fetches all meetings (race weekends) for a given year
 */
export async function getMeetings(year: number): Promise<Meeting[]> {
  const url = `${BASE_URL}/meetings?year=${year}`
  console.log(`[F1-SYNC] Fetching meetings from: ${url}`)
  const startTime = Date.now()
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'F1-Fantasy-AI/1.0' },
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    console.log(`[F1-SYNC] Meetings fetch response status: ${response.status} (${Date.now() - startTime}ms)`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch meetings: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`[F1-SYNC] Successfully parsed meetings JSON, count: ${data.length}`)
    return data
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error(`[F1-SYNC] Error fetching meetings for year ${year}:`, apiError)
    console.error(`[F1-SYNC] Error details:`, {
      message: apiError.message,
      code: apiError.code,
      name: apiError.name,
      stack: apiError.stack
    })
    throw apiError
  }
}

/**
 * Fetches all sessions for a specific meeting
 */
export async function getSessions(meetingKey: number): Promise<Session[]> {
  const url = `${BASE_URL}/sessions?meeting_key=${meetingKey}`
  console.log(`[F1-SYNC] Fetching sessions from: ${url}`)
  const startTime = Date.now()
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'F1-Fantasy-AI/1.0' },
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    console.log(`[F1-SYNC] Sessions fetch response status: ${response.status} (${Date.now() - startTime}ms)`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`[F1-SYNC] Successfully parsed sessions JSON, count: ${data.length}`)
    return data
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error(`[F1-SYNC] Error fetching sessions for meeting ${meetingKey}:`, apiError)
    console.error(`[F1-SYNC] Error details:`, {
      message: apiError.message,
      code: apiError.code,
      name: apiError.name,
      stack: apiError.stack
    })
    throw apiError
  }
}

/**
 * Fetches all drivers for a specific session
 */
export async function getDrivers(sessionKey: number): Promise<Driver[]> {
  const url = `${BASE_URL}/drivers?session_key=${sessionKey}`
  console.log(`[F1-SYNC] Fetching drivers from: ${url}`)
  const startTime = Date.now()
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'F1-Fantasy-AI/1.0' },
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    console.log(`[F1-SYNC] Drivers fetch response status: ${response.status} (${Date.now() - startTime}ms)`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch drivers: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`[F1-SYNC] Successfully parsed drivers JSON, count: ${data.length}`)
    return data
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error(`[F1-SYNC] Error fetching drivers for session ${sessionKey}:`, apiError)
    console.error(`[F1-SYNC] Error details:`, {
      message: apiError.message,
      code: apiError.code,
      name: apiError.name,
      stack: apiError.stack
    })
    throw apiError
  }
}

/**
 * Fetches the driver who set the fastest lap in a session
 */
export async function getFastestLap(sessionKey: number): Promise<number | null> {
  console.log(`[F1-SYNC] Fetching fastest lap data for session ${sessionKey}`)
  
  try {
    const url = `${BASE_URL}/laps?session_key=${sessionKey}&fastest=true`
    console.log(`[F1-SYNC] Fetching fastest lap from: ${url}`)
    const startTime = Date.now()
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'F1-Fantasy-AI/1.0' },
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    console.log(`[F1-SYNC] Fastest lap fetch response status: ${response.status} (${Date.now() - startTime}ms)`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fastest lap: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`[F1-SYNC] Successfully parsed fastest lap JSON, count: ${data.length}`)
    
    if (data.length > 0) {
      // Return the driver number who set the fastest lap
      return data[0].driver_number
    }
    
    return null
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error(`[F1-SYNC] Error fetching fastest lap for session ${sessionKey}:`, apiError)
    console.error(`[F1-SYNC] Error details:`, {
      message: apiError.message,
      code: apiError.code,
      name: apiError.name,
      stack: apiError.stack
    })
    return null
  }
}

/**
 * Fetches the latest race result positions for all drivers in a session
 */
export async function getRaceResult(sessionKey: number): Promise<Record<number, number>> {
  console.log(`[F1-SYNC] Fetching race results for session ${sessionKey}`)
  const positions: Record<number, Position[]> = {}
  
  try {
    // Get positions for each driver in the session
    const drivers = await getDrivers(sessionKey)
    
    for (const driver of drivers) {
      const url = `${BASE_URL}/position?session_key=${sessionKey}&driver_number=${driver.driver_number}`
      console.log(`[F1-SYNC] Fetching positions from: ${url}`)
      const startTime = Date.now()
      
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'F1-Fantasy-AI/1.0' },
          next: { revalidate: 3600 } // Cache for 1 hour
        })
        
        console.log(`[F1-SYNC] Position fetch for driver ${driver.driver_number} status: ${response.status} (${Date.now() - startTime}ms)`)
        
        if (!response.ok) {
          console.error(`[F1-SYNC] Failed to fetch positions for driver ${driver.driver_number}: ${response.statusText}`)
          continue
        }
        
        const driverPositions: Position[] = await response.json()
        positions[driver.driver_number] = driverPositions
      } catch (error: unknown) {
        const apiError = error as ApiError
        console.error(`[F1-SYNC] Error fetching positions for driver ${driver.driver_number}:`, apiError)
        console.error(`[F1-SYNC] Error details:`, {
          message: apiError.message,
          code: apiError.code,
          name: apiError.name
        })
        // Continue with next driver even if this one fails
      }
      
      // Add a small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Get the final position for each driver
    const results: Record<number, number> = {}
    
    for (const [driverNumber, driverPositions] of Object.entries(positions)) {
      // Sort by date in descending order to get the most recent position
      const sortedPositions = [...driverPositions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      
      if (sortedPositions.length > 0) {
        results[parseInt(driverNumber)] = sortedPositions[0].position
      }
    }
    
    console.log(`[F1-SYNC] Successfully processed race results for ${Object.keys(results).length} drivers`)
    return results
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error(`[F1-SYNC] Error processing race results:`, apiError)
    console.error(`[F1-SYNC] Error details:`, {
      message: apiError.message,
      code: apiError.code,
      name: apiError.name,
      stack: apiError.stack
    })
    return {}
  }
}

/**
 * Fetches the current season data including meetings, sessions, and most recent race
 */
export async function getCurrentSeasonData() {
  console.log(`[F1-SYNC] Starting to fetch current season data`)
  const startTime = Date.now()
  
  try {
    // Use current year instead of hardcoded value
    const currentYear = new Date().getFullYear()
    console.log(`[F1-SYNC] Fetching data for ${currentYear} season`)
    
    const meetings = await getMeetings(currentYear)
    
    // Sort meetings by date
    const sortedMeetings = [...meetings].sort(
      (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
    )
    
    // Find the most recent meeting
    const now = new Date()
    const pastMeetings = sortedMeetings.filter(meeting => new Date(meeting.date_start) < now)
    const mostRecentMeeting = pastMeetings.length ? pastMeetings[pastMeetings.length - 1] : sortedMeetings[0]
    
    // Get sessions for the most recent meeting
    let sessions: Session[] = []
    let drivers: Driver[] = []
    let results: Record<number, number> = {}
    let fastestLapDriver: number | null = null
    
    if (mostRecentMeeting) {
      try {
        console.log(`[F1-SYNC] Using meeting: ${mostRecentMeeting.meeting_name}`)
        // Get sessions for the most recent meeting
        sessions = await getSessions(mostRecentMeeting.meeting_key)
        
        // Find the race session
        const raceSession = sessions.find(session => 
          session.session_type === "Race" && session.session_name === "Race"
        )
        
        if (raceSession) {
          console.log(`[F1-SYNC] Found race session: ${raceSession.session_name}`)
          // Get drivers, results, and fastest lap for the race
          drivers = await getDrivers(raceSession.session_key)
          results = await getRaceResult(raceSession.session_key)
          
          // Also fetch fastest lap data
          fastestLapDriver = await getFastestLap(raceSession.session_key)
        } else if (sessions.length) {
          console.log(`[F1-SYNC] No race session found, using first available session: ${sessions[0].session_name}`)
          // If no race session found, try to get drivers from any session
          const anySession = sessions[0]
          drivers = await getDrivers(anySession.session_key)
        }
      } catch (error: unknown) {
        const apiError = error as ApiError
        console.error(`[F1-SYNC] Error fetching session details:`, apiError)
        console.error(`[F1-SYNC] Error details:`, {
          message: apiError.message,
          code: apiError.code,
          name: apiError.name,
          stack: apiError.stack
        })
        // Continue with empty data
      }
    }
    
    console.log(`[F1-SYNC] Completed current season data fetch in ${Date.now() - startTime}ms`)
    return {
      currentYear,
      meetings: sortedMeetings,
      mostRecentMeeting,
      sessions,
      drivers,
      results,
      fastestLapDriver
    }
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error(`[F1-SYNC] Error in getCurrentSeasonData:`, apiError)
    console.error(`[F1-SYNC] Error details:`, {
      message: apiError.message,
      code: apiError.code,
      name: apiError.name,
      stack: apiError.stack
    })
    
    // Get current year instead of hardcoded value
    const currentYear = new Date().getFullYear()
    
    // Return empty data structure on error
    return {
      currentYear,
      meetings: [],
      mostRecentMeeting: null,
      sessions: [],
      drivers: [],
      results: {},
      fastestLapDriver: null
    }
  }
}

/**
 * Calculate driver points based on their position
 * Uses the standard F1 scoring system, with bonuses for other achievements
 */
export interface ConstructorDetails {
  name: string
  color: string
  drivers: Driver[]
}

export async function calculateDriverPoints(position: number, fastestLap: boolean = false): Promise<number> {
  // Standard F1 points system
  let points = 0
  if (position === 1) points = 25
  else if (position === 2) points = 18
  else if (position === 3) points = 15
  else if (position === 4) points = 12
  else if (position === 5) points = 10
  else if (position === 6) points = 8
  else if (position === 7) points = 6
  else if (position === 8) points = 4
  else if (position === 9) points = 2
  else if (position === 10) points = 1
  
  // Add bonus point for fastest lap (if driver finished in top 10)
  if (fastestLap && position <= 10) {
    points += 1
  }
  
  return points
}

/**
 * Calculate driver price based on their recent performance, team, and historical data
 * Uses a more complex formula that accounts for multiple factors
 */
export async function calculateDriverPrice(driver: Driver, position: number): Promise<number> {
  // Team tier categorization based on recent performance
  const teamTiers: Record<string, number> = {
    // Dynamically updated based on constructor championship standings
    "Red Bull Racing": 30,
    "Ferrari": 28,
    "Mercedes": 26,
    "McLaren": 26,
    "Aston Martin": 22,
    "Alpine": 18,
    "Williams": 15,
    "RB": 15,
    "Kick Sauber": 12,
    "Haas F1 Team": 12,
    // Fallback for other teams
    "default": 15
  }
  
  // Base price based on team tier
  const basePrice = teamTiers[driver.team_name] || teamTiers["default"]
  
  // Performance-based adjustment
  let positionAdjustment = 0
  if (position === 1) positionAdjustment = 10
  else if (position <= 3) positionAdjustment = 8
  else if (position <= 5) positionAdjustment = 6
  else if (position <= 8) positionAdjustment = 4
  else if (position <= 10) positionAdjustment = 2
  else if (position <= 15) positionAdjustment = 0
  else positionAdjustment = -2 // Penalty for poor performance
  
  // Star driver premium (identified by driver numbers)
  // Includes top drivers across different teams
  const starDriverNumbers = [1, 16, 44, 55, 4, 63, 11, 14, 81, 10, 22, 23, 77, 31]
  const starDriverPremium = starDriverNumbers.includes(driver.driver_number) ? 4 : 0
  
  // Special case for rookie drivers (slight discount)
  const rookieNumbers = [24, 30] // Update each season
  const rookieAdjustment = rookieNumbers.includes(driver.driver_number) ? -2 : 0
  
  // Calculate final price (with min/max bounds)
  const calculatedPrice = basePrice + positionAdjustment + starDriverPremium + rookieAdjustment
  
  // Ensure price is within reasonable bounds (10-35 million)
  return Math.max(10, Math.min(35, calculatedPrice))
}

/**
 * Calculate constructor price based on their drivers and recent performance
 */
export async function calculateConstructorPrice(constructor: ConstructorDetails): Promise<number> {
  // Base prices by constructor name
  const basePriceMap: Record<string, number> = {
    "Red Bull Racing": 35,
    "McLaren": 30,
    "Ferrari": 30,
    "Mercedes": 28,
    "Aston Martin": 23,
    "Alpine": 18,
    "Williams": 16,
    "Racing Bulls": 15,
    "Kick Sauber": 12,
    "Haas F1 Team": 12
  }
  
  // Default base price if not in map
  const basePrice = basePriceMap[constructor.name] || 20
  
  // Calculate average driver price as a factor
  let driverPriceSum = 0
  for (const driver of constructor.drivers) {
    // Get position from results if available
    const position = 0 // This would come from results
    const driverPrice = await calculateDriverPrice(driver, position)
    driverPriceSum += driverPrice
  }
  
  // Adjust price based on average driver price
  const avgDriverPrice = constructor.drivers.length > 0 ? driverPriceSum / constructor.drivers.length : 0
  const driverFactor = avgDriverPrice >= 25 ? 1.1 : avgDriverPrice >= 20 ? 1.0 : 0.9
  
  // Calculate final price
  const calculatedPrice = basePrice * driverFactor
  
  // Ensure price is within reasonable bounds (12-40 million)
  return Math.max(12, Math.min(40, calculatedPrice))
}

/**
 * Calculate constructor points based on their drivers' performances
 */
export async function calculateConstructorPoints(constructor: ConstructorDetails, results: Record<number, number>): Promise<number> {
  let totalPoints = 0
  
  // Add up points from all drivers
  for (const driver of constructor.drivers) {
    const position = results[driver.driver_number] || 0
    if (position > 0) {
      const driverPoints = await calculateDriverPoints(position, false)
      totalPoints += driverPoints
    }
  }
  
  return totalPoints
} 