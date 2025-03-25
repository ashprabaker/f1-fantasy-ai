"use server"

import { formatNumber } from "@/lib/utils"
import { type Driver } from "@/types"

// Mock Data
export async function getDriversAction() {
  try {
    // This would fetch from a real API in production
    const driversRaw = [
      {
        driverId: "max_verstappen",
        permanentNumber: "1",
        code: "VER",
        url: "http://en.wikipedia.org/wiki/Max_Verstappen",
        givenName: "Max",
        familyName: "Verstappen",
        dateOfBirth: "1997-09-30",
        nationality: "Dutch",
        constructor: {
          constructorId: "red_bull",
          name: "Red Bull Racing",
          nationality: "Austrian",
        },
      },
      {
        driverId: "lewis_hamilton",
        permanentNumber: "44",
        code: "HAM",
        url: "http://en.wikipedia.org/wiki/Lewis_Hamilton",
        givenName: "Lewis",
        familyName: "Hamilton",
        dateOfBirth: "1985-01-07",
        nationality: "British",
        constructor: {
          constructorId: "mercedes",
          name: "Mercedes",
          nationality: "German",
        },
      },
      {
        driverId: "charles_leclerc",
        permanentNumber: "16",
        code: "LEC",
        url: "http://en.wikipedia.org/wiki/Charles_Leclerc",
        givenName: "Charles",
        familyName: "Leclerc",
        dateOfBirth: "1997-10-16",
        nationality: "Monégasque",
        constructor: {
          constructorId: "ferrari",
          name: "Ferrari",
          nationality: "Italian",
        },
      },
      {
        driverId: "sergio_perez",
        permanentNumber: "11",
        code: "PER",
        url: "http://en.wikipedia.org/wiki/Sergio_P%C3%A9rez",
        givenName: "Sergio",
        familyName: "Pérez",
        dateOfBirth: "1990-01-26",
        nationality: "Mexican",
        constructor: {
          constructorId: "red_bull",
          name: "Red Bull Racing",
          nationality: "Austrian",
        },
      },
      {
        driverId: "lando_norris",
        permanentNumber: "4",
        code: "NOR",
        url: "http://en.wikipedia.org/wiki/Lando_Norris",
        givenName: "Lando",
        familyName: "Norris",
        dateOfBirth: "1999-11-13",
        nationality: "British",
        constructor: {
          constructorId: "mclaren",
          name: "McLaren",
          nationality: "British",
        },
      },
    ]

    // Transform the data to the format expected by DriverSelector
    const drivers = driversRaw.map(driver => ({
      driverId: driver.driverId,
      fullName: `${driver.givenName} ${driver.familyName}`
    }));

    return {
      data: drivers,
      isSuccess: true,
    }
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return {
      data: [],
      isSuccess: false,
      error: "Failed to load drivers",
    }
  }
}

export async function getDriverPerformanceAction(driverId: string) {
  try {
    // In a real implementation, this would fetch data from a real API
    // For now, using mock data based on the driver ID
    const driverData = mockDriverPerformanceData[driverId] || generateMockDriverData(driverId)

    return {
      data: driverData,
      isSuccess: true,
    }
  } catch (error) {
    console.error(`Error fetching performance data for driver ${driverId}:`, error)
    return {
      data: null,
      isSuccess: false,
      error: "Failed to load driver performance data",
    }
  }
}

// Helper function to generate mock data for any driver ID
function generateMockDriverData(driverId: string) {
  // Parse driverId to extract name components
  const parts = driverId.split('_')
  const givenName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  const familyName = parts.length > 1 
    ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) 
    : "Unknown"

  // Generate random stats
  const wins = Math.floor(Math.random() * 50)
  const podiums = wins + Math.floor(Math.random() * 50)
  const points = podiums * 15 + Math.floor(Math.random() * 500)
  const polePositions = Math.floor(wins * 0.7)
  const fastestLaps = Math.floor(wins * 0.4)
  
  // Random races with random positions
  const races = ["Australia", "Bahrain", "Saudi Arabia", "Japan", "China", "USA", "Italy", "Monaco"]
  const results = races.map(race => ({
    raceName: race,
    season: "2025",
    round: (races.indexOf(race) + 1).toString(),
    position: Math.floor(Math.random() * 20) + 1,
    points: Math.floor(Math.random() * 25),
    grid: Math.floor(Math.random() * 20) + 1,
    laps: "58",
    status: "Finished",
    fastestLapRank: Math.random() > 0.8 ? "1" : "0",
  }))

  // Random circuit performance
  const circuits = ["Monaco", "Silverstone", "Monza", "Spa", "Singapore"]
  const circuitPerformance = circuits.map(circuit => ({
    circuitId: circuit.toLowerCase().replace(' ', '_'),
    circuitName: circuit,
    avgPosition: (Math.random() * 10 + 1).toFixed(1),
    bestPosition: Math.floor(Math.random() * 5) + 1,
    raceCount: Math.floor(Math.random() * 5) + 1,
    pointsPerRace: (Math.random() * 20).toFixed(1),
  }))

  return {
    driver: {
      driverId,
      givenName,
      familyName,
      nationality: "Unknown",
      permanentNumber: Math.floor(Math.random() * 99).toString(),
      code: familyName.substring(0, 3).toUpperCase(),
    },
    stats: {
      championships: Math.floor(Math.random() * 3),
      wins,
      podiums,
      points,
      polePositions,
      fastestLaps,
      seasonsActive: Math.floor(Math.random() * 10) + 1,
      currentPosition: Math.floor(Math.random() * 20) + 1,
    },
    results,
    circuitPerformance,
  }
}

// Mock data for specific popular drivers
const mockDriverPerformanceData: Record<string, any> = {
  "max_verstappen": {
    driver: {
      driverId: "max_verstappen",
      givenName: "Max",
      familyName: "Verstappen", 
      nationality: "Dutch",
      permanentNumber: "1",
      code: "VER",
    },
    stats: {
      championships: 3,
      wins: 56,
      podiums: 102,
      points: 2586.5,
      polePositions: 39,
      fastestLaps: 29,
      seasonsActive: 9,
      currentPosition: 1,
    },
    results: [
      { raceName: "Bahrain Grand Prix", season: "2025", round: "1", position: 1, points: 25, grid: 1, laps: "57", status: "Finished", fastestLapRank: "1" },
      { raceName: "Saudi Arabian Grand Prix", season: "2025", round: "2", position: 1, points: 25, grid: 1, laps: "50", status: "Finished", fastestLapRank: "0" },
      { raceName: "Australian Grand Prix", season: "2025", round: "3", position: 16, points: 0, grid: 1, laps: "58", status: "Brake failure", fastestLapRank: "0" },
      { raceName: "Japanese Grand Prix", season: "2025", round: "4", position: 1, points: 25, grid: 1, laps: "53", status: "Finished", fastestLapRank: "0" },
      { raceName: "Chinese Grand Prix", season: "2025", round: "5", position: 1, points: 25, grid: 2, laps: "56", status: "Finished", fastestLapRank: "0" },
      { raceName: "Miami Grand Prix", season: "2025", round: "6", position: 2, points: 18, grid: 1, laps: "57", status: "Finished", fastestLapRank: "0" },
    ],
    circuitPerformance: [
      { circuitId: "monaco", circuitName: "Monaco", avgPosition: "3.2", bestPosition: 1, raceCount: 5, pointsPerRace: "18.4" },
      { circuitId: "silverstone", circuitName: "Silverstone", avgPosition: "2.1", bestPosition: 1, raceCount: 8, pointsPerRace: "22.3" },
      { circuitId: "monza", circuitName: "Monza", avgPosition: "2.5", bestPosition: 1, raceCount: 6, pointsPerRace: "18.7" },
      { circuitId: "spa", circuitName: "Spa-Francorchamps", avgPosition: "1.3", bestPosition: 1, raceCount: 7, pointsPerRace: "23.5" },
      { circuitId: "cota", circuitName: "Circuit of the Americas", avgPosition: "1.8", bestPosition: 1, raceCount: 4, pointsPerRace: "21.2" },
    ],
  },
  "lewis_hamilton": {
    driver: {
      driverId: "lewis_hamilton",
      givenName: "Lewis",
      familyName: "Hamilton",
      nationality: "British",
      permanentNumber: "44",
      code: "HAM",
    },
    stats: {
      championships: 7,
      wins: 103,
      podiums: 196,
      points: 4639.5,
      polePositions: 104,
      fastestLaps: 62,
      seasonsActive: 17,
      currentPosition: 3,
    },
    results: [
      { raceName: "Bahrain Grand Prix", season: "2025", round: "1", position: 3, points: 15, grid: 4, laps: "57", status: "Finished", fastestLapRank: "0" },
      { raceName: "Saudi Arabian Grand Prix", season: "2025", round: "2", position: 5, points: 10, grid: 6, laps: "50", status: "Finished", fastestLapRank: "0" },
      { raceName: "Australian Grand Prix", season: "2025", round: "3", position: 2, points: 18, grid: 3, laps: "58", status: "Finished", fastestLapRank: "0" },
      { raceName: "Japanese Grand Prix", season: "2025", round: "4", position: 4, points: 12, grid: 5, laps: "53", status: "Finished", fastestLapRank: "0" },
      { raceName: "Chinese Grand Prix", season: "2025", round: "5", position: 1, points: 25, grid: 3, laps: "56", status: "Finished", fastestLapRank: "0" },
      { raceName: "Miami Grand Prix", season: "2025", round: "6", position: 3, points: 15, grid: 5, laps: "57", status: "Finished", fastestLapRank: "1" },
    ],
    circuitPerformance: [
      { circuitId: "silverstone", circuitName: "Silverstone", avgPosition: "1.2", bestPosition: 1, raceCount: 15, pointsPerRace: "23.4" },
      { circuitId: "monza", circuitName: "Monza", avgPosition: "1.8", bestPosition: 1, raceCount: 14, pointsPerRace: "21.7" },
      { circuitId: "spa", circuitName: "Spa-Francorchamps", avgPosition: "2.0", bestPosition: 1, raceCount: 14, pointsPerRace: "20.5" },
      { circuitId: "hungaroring", circuitName: "Hungaroring", avgPosition: "1.5", bestPosition: 1, raceCount: 16, pointsPerRace: "22.1" },
      { circuitId: "cota", circuitName: "Circuit of the Americas", avgPosition: "2.1", bestPosition: 1, raceCount: 10, pointsPerRace: "19.8" },
    ],
  },
  "lando_norris": {
    driver: {
      driverId: "lando_norris",
      givenName: "Lando",
      familyName: "Norris",
      nationality: "British",
      permanentNumber: "4",
      code: "NOR",
    },
    stats: {
      championships: 0,
      wins: 2,
      podiums: 18,
      points: 682,
      polePositions: 3,
      fastestLaps: 4,
      seasonsActive: 5,
      currentPosition: 2,
    },
    results: [
      { raceName: "Bahrain Grand Prix", season: "2025", round: "1", position: 2, points: 18, grid: 3, laps: "57", status: "Finished", fastestLapRank: "0" },
      { raceName: "Saudi Arabian Grand Prix", season: "2025", round: "2", position: 3, points: 15, grid: 2, laps: "50", status: "Finished", fastestLapRank: "0" },
      { raceName: "Australian Grand Prix", season: "2025", round: "3", position: 1, points: 25, grid: 2, laps: "58", status: "Finished", fastestLapRank: "1" },
      { raceName: "Japanese Grand Prix", season: "2025", round: "4", position: 2, points: 18, grid: 3, laps: "53", status: "Finished", fastestLapRank: "0" },
      { raceName: "Chinese Grand Prix", season: "2025", round: "5", position: 3, points: 15, grid: 1, laps: "56", status: "Finished", fastestLapRank: "0" },
      { raceName: "Miami Grand Prix", season: "2025", round: "6", position: 1, points: 25, grid: 2, laps: "57", status: "Finished", fastestLapRank: "0" },
    ],
    circuitPerformance: [
      { circuitId: "monaco", circuitName: "Monaco", avgPosition: "5.8", bestPosition: 3, raceCount: 4, pointsPerRace: "12.3" },
      { circuitId: "silverstone", circuitName: "Silverstone", avgPosition: "4.5", bestPosition: 2, raceCount: 4, pointsPerRace: "13.5" },
      { circuitId: "monza", circuitName: "Monza", avgPosition: "6.3", bestPosition: 2, raceCount: 4, pointsPerRace: "9.8" },
      { circuitId: "zandvoort", circuitName: "Zandvoort", avgPosition: "7.0", bestPosition: 4, raceCount: 3, pointsPerRace: "8.7" },
      { circuitId: "singapore", circuitName: "Marina Bay Street Circuit", avgPosition: "4.0", bestPosition: 2, raceCount: 4, pointsPerRace: "14.2" },
    ],
  }
}