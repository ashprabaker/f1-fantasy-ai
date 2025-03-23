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
    // Explicitly use 2025 season data
    const currentYear = 2025
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
          // Get drivers and results for the race
          drivers = await getDrivers(raceSession.session_key)
          results = await getRaceResult(raceSession.session_key)
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
      results
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
    
    // Return empty data structure on error
    return {
      currentYear: 2025,
      meetings: [],
      mostRecentMeeting: null,
      sessions: [],
      drivers: [],
      results: {}
    }
  }
}

/**
 * Calculate driver points based on their position
 * This is a simple scoring system - you might want to use a more complex one
 */
export async function calculateDriverPoints(position: number): Promise<number> {
  if (position === 1) return 25
  if (position === 2) return 18
  if (position === 3) return 15
  if (position === 4) return 12
  if (position === 5) return 10
  if (position === 6) return 8
  if (position === 7) return 6
  if (position === 8) return 4
  if (position === 9) return 2
  if (position === 10) return 1
  return 0
}

/**
 * Calculate driver price based on their recent performance and team
 * This is just an example algorithm - you can create your own
 */
export async function calculateDriverPrice(driver: Driver, position: number): Promise<number> {
  // Base price by team tier
  let basePrice = 0
  
  // Top teams
  if (["Red Bull Racing", "Ferrari", "Mercedes"].includes(driver.team_name)) {
    basePrice = 30
  } 
  // Mid teams
  else if (["McLaren", "Aston Martin", "Alpine"].includes(driver.team_name)) {
    basePrice = 20
  } 
  // Lower teams
  else {
    basePrice = 10
  }
  
  // Adjust based on recent performance
  const positionAdjustment = position <= 3 ? 10 : position <= 10 ? 5 : 0
  
  // Specific driver adjustments (star drivers)
  const starDriverAdjustment = [1, 16, 44, 55, 4, 63].includes(driver.driver_number) ? 5 : 0
  
  return basePrice + positionAdjustment + starDriverAdjustment
} 