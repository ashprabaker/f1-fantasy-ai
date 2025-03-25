"use server"

/**
 * Service for fetching F1 data from the Ergast API
 */

const BASE_URL = "https://ergast.com/api/f1"

interface SeasonData {
  season: string;
}

interface Season {
  season: string;
}

export interface DriverPerformanceData {
  driverInfo: {
    id: string;
    name: string;
    nationality: string;
    team: string;
  };
  seasonData: {
    year: number;
    points: number;
    position: number;
    wins: number;
    podiums: number;
  }[];
  circuitPerformance: {
    circuit: string;
    bestResult: number;
    avgPosition: number;
    totalRaces: number;
  }[];
  recentForm: {
    race: string;
    position: number;
    points: number;
    date: string;
  }[];
}

/**
 * Maps common F1 driver names to their Ergast API driver IDs
 */
const DRIVER_ID_MAPPING: Record<string, string> = {
  // Current F1 drivers (2023/2024)
  "Max Verstappen": "verstappen",
  "Lewis Hamilton": "hamilton",
  "Charles Leclerc": "leclerc",
  "Lando Norris": "norris",
  "Carlos Sainz": "sainz",
  "Sergio Perez": "perez",
  "George Russell": "russell",
  "Fernando Alonso": "alonso",
  "Oscar Piastri": "piastri",
  "Lance Stroll": "stroll",
  "Yuki Tsunoda": "tsunoda",
  "Daniel Ricciardo": "ricciardo",
  "Pierre Gasly": "gasly",
  "Esteban Ocon": "ocon",
  "Kevin Magnussen": "kevin_magnussen",
  "Alexander Albon": "albon",
  "Nico Hulkenberg": "hulkenberg",
  "Valtteri Bottas": "bottas",
  "Zhou Guanyu": "zhou",
  "Logan Sargeant": "sargeant",
  "Franco Colapinto": "colapinto",
  "Oliver Bearman": "bearman",
  
  // Additional variations for name matching
  "Alex Albon": "albon",
  "Nicholas Latifi": "latifi",
  "Mick Schumacher": "mick_schumacher",
  "Sebastian Vettel": "vettel",
  "Kimi Räikkönen": "raikkonen",
  "Kimi Raikkonen": "raikkonen",
  "Robert Kubica": "kubica",
  "Nikita Mazepin": "mazepin",
  "Antonio Giovinazzi": "giovinazzi",
  "Romain Grosjean": "grosjean",
  "Daniil Kvyat": "kvyat",
  "Brendon Hartley": "hartley",
  "Stoffel Vandoorne": "vandoorne",
  "Marcus Ericsson": "ericsson",
  "Sergey Sirotkin": "sirotkin",
  "Jolyon Palmer": "jolyon_palmer",
  "Pascal Wehrlein": "wehrlein",
  "Esteban Gutierrez": "gutierrez",
  "Rio Haryanto": "haryanto",
  "Felipe Nasr": "nasr",
  "Roberto Merhi": "merhi",
  "Will Stevens": "stevens",
  "Andre Lotterer": "lotterer",
  "Jules Bianchi": "bianchi",
  "Felipe Massa": "massa",
  "Jenson Button": "button",
  "Adrian Sutil": "sutil",
  "Giedo van der Garde": "garde",
  "Michael Schumacher": "michael_schumacher",
  "Jean-Eric Vergne": "vergne",
  "Timo Glock": "glock",
  "Pedro de la Rosa": "rosa",
  "Jerome d'Ambrosio": "ambrosio",
  "Bruno Senna": "senna",
  "Vitaly Petrov": "petrov",
  "Rubens Barrichello": "barrichello",
  "Jarno Trulli": "trulli"
};

/**
 * Tries to map a driver name or ID to an Ergast API driver ID
 * @param driverIdOrName The driver ID or name to map
 * @returns The Ergast API driver ID
 */
function mapToErgastDriverId(driverIdOrName: string): string {
  // Guard against null or undefined
  if (!driverIdOrName) {
    return "unknown";
  }
  
  // If it's already in the correct format, return it
  if (driverIdOrName.match(/^[a-z_]+$/)) {
    return driverIdOrName;
  }
  
  // Extract just the name without the team info (e.g., "Max Verstappen (Red Bull)" -> "Max Verstappen")
  const nameOnly = driverIdOrName.split('(')[0].trim();
  
  // Check if it's a known driver name
  if (DRIVER_ID_MAPPING[nameOnly]) {
    return DRIVER_ID_MAPPING[nameOnly];
  }
  
  // Try additional lookups for names with different formats
  // Remove any numbers or special characters, e.g., "#33 Max Verstappen" -> "Max Verstappen"
  const cleanedName = nameOnly.replace(/[#\d]+\s+/g, '').trim();
  if (DRIVER_ID_MAPPING[cleanedName]) {
    return DRIVER_ID_MAPPING[cleanedName];
  }
  
  // Handle "FirstName LastName" format
  const nameParts = cleanedName.split(' ');
  if (nameParts.length >= 2) {
    // Try "LastName" - sometimes drivers are referred to just by last name
    const lastName = nameParts[nameParts.length - 1];
    
    // Convert common last names to driver IDs
    const lastNameMap: Record<string, string> = {
      "Verstappen": "verstappen",
      "Hamilton": "hamilton",
      "Leclerc": "leclerc",
      "Norris": "norris",
      "Sainz": "sainz",
      "Perez": "perez",
      "Russell": "russell",
      "Alonso": "alonso",
      "Piastri": "piastri",
      "Stroll": "stroll",
      "Tsunoda": "tsunoda",
      "Ricciardo": "ricciardo",
      "Gasly": "gasly",
      "Ocon": "ocon",
      "Magnussen": "kevin_magnussen",
      "Albon": "albon",
      "Hulkenberg": "hulkenberg",
      "Bottas": "bottas",
      "Zhou": "zhou",
      "Sargeant": "sargeant",
      "Colapinto": "colapinto",
      "Bearman": "bearman"
    };
    
    if (lastNameMap[lastName]) {
      return lastNameMap[lastName];
    }
  }
  
  // Try to convert name to ID by lowercasing and replacing spaces with underscores
  const potentialId = nameOnly.toLowerCase().replace(/\s+/g, '_');
  
  // Return our best guess
  return potentialId;
}

interface Circuit {
  circuitId: string;
  circuitName: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
}

interface ApiResponse<T> {
  MRData: {
    DriverTable?: {
      Drivers: T[];
    };
    ConstructorTable?: {
      Constructors: T[];
    };
    StandingsTable?: {
      StandingsLists: {
        DriverStandings?: DriverStanding[];
        ConstructorStandings?: ConstructorStanding[];
      }[];
    };
    RaceTable?: {
      Races: Race[];
    };
    SeasonTable?: {
      Seasons: SeasonData[];
    };
    CircuitTable?: {
      Circuits: Circuit[];
    };
  };
}

export async function getDriverPerformanceData(driverId: string, year?: number): Promise<DriverPerformanceData> {
  // Initialize all year-related variables at the top of the function
  const currentYear = new Date().getFullYear();
  const analysisYear = year || currentYear;
  
  console.log(`Fetching driver data for ${driverId} in year ${analysisYear}`);
  
  // Map the driver ID to an Ergast API driver ID
  const ergastDriverId = mapToErgastDriverId(driverId);
  
  try {
    // Fetch driver info
    const driverResponse = await fetch(`${BASE_URL}/drivers/${ergastDriverId}.json`);
    if (!driverResponse.ok) {
      throw new Error(`Failed to fetch driver data: ${driverResponse.statusText}`);
    }
    const driverData = await driverResponse.json() as ApiResponse<DriverData>;
    const driver = driverData.MRData.DriverTable!.Drivers[0];
    
    // Fetch racing seasons data for the driver
    const seasonsResponse = await fetch(`${BASE_URL}/drivers/${ergastDriverId}/seasons.json`);
    if (!seasonsResponse.ok) {
      throw new Error(`Failed to fetch driver seasons: ${seasonsResponse.statusText}`);
    }
    const seasonsData = await seasonsResponse.json() as ApiResponse<SeasonData>;
    
    // For the season data analysis, focus exactly on the selected year
    // If the selected year is in the future, fall back to the current year
    const selectedYearStr = analysisYear.toString();
    
    // If selected year is in the future and not in available seasons, use current year
    const effectiveYear = analysisYear > currentYear && 
      !seasonsData.MRData.SeasonTable?.Seasons.some((s: SeasonData) => s.season === selectedYearStr)
        ? currentYear
        : analysisYear;
    
    // Just select the exact season requested
    const seasons = seasonsData.MRData.SeasonTable?.Seasons || [];
    
    // Fetch standings for each season
    const seasonData = await Promise.all(
      seasons.map(async (seasonData: SeasonData) => {
        const year = seasonData.season;
        const standingsResponse = await fetch(`${BASE_URL}/${year}/drivers/${ergastDriverId}/driverStandings.json`);
        if (!standingsResponse.ok) {
          return null;
        }
        
        const standingsData = await standingsResponse.json() as ApiResponse<DriverStanding>;
        if (!standingsData.MRData.StandingsTable?.StandingsLists.length) {
          return null;
        }
        
        const standing = standingsData.MRData.StandingsTable.StandingsLists[0].DriverStandings?.[0];
        if (!standing) {
          return null;
        }
        
        // Get race results for podium count
        const resultsResponse = await fetch(`${BASE_URL}/${year}/drivers/${ergastDriverId}/results.json`);
        if (!resultsResponse.ok) {
          return null;
        }
        
        const resultsData = await resultsResponse.json() as ApiResponse<Race>;
        const races = resultsData.MRData.RaceTable?.Races || [];
        
        // Count podiums (positions 1-3)
        const podiums = races.filter((race: Race) => {
          const position = parseInt(race.Results[0].position);
          return position <= 3;
        }).length;
        
        return {
          year: parseInt(year),
          points: parseFloat(standing.points),
          position: parseInt(standing.position),
          wins: parseInt(standing.wins),
          podiums: podiums
        };
      })
    );
    
    // Filter out null entries and take only valid seasons
    const validSeasonData = seasonData.filter(season => season !== null);
    
    // Use the same effective year defined earlier for consistency across all requests
    // The effectiveYear was already calculated above when processing season data
    
    console.log(`Using effective year: ${effectiveYear} for circuit data`);
    
    // Get circuits from the selected year
    const circuitsResponse = await fetch(`${BASE_URL}/${effectiveYear}/circuits.json`);
    if (!circuitsResponse.ok) {
      throw new Error(`Failed to fetch circuit data for ${effectiveYear}: ${circuitsResponse.statusText}`);
    }
    const circuitsData = await circuitsResponse.json() as ApiResponse<Circuit>;
    
    // Process circuit performance for the selected year
    const circuitPerformance = await Promise.all(
      (circuitsData.MRData.CircuitTable?.Circuits || []).slice(0, 5).map(async (circuit: Circuit) => {
        // Get the driver's results for this circuit for the effective year
        const resultsResponse = await fetch(`${BASE_URL}/${effectiveYear}/drivers/${ergastDriverId}/circuits/${circuit.circuitId}/results.json`);
        if (!resultsResponse.ok) {
          return {
            circuit: circuit.circuitName,
            bestResult: 0,
            avgPosition: 0,
            totalRaces: 0
          };
        }
        
        const resultsData = await resultsResponse.json() as ApiResponse<Race>;
        const races = resultsData.MRData.RaceTable?.Races || [];
        
        if (races.length === 0) {
          return {
            circuit: circuit.circuitName,
            bestResult: 0,
            avgPosition: 0,
            totalRaces: 0
          };
        }
        
        // Calculate metrics
        const positions = races.map((race: Race) => parseInt(race.Results[0].position));
        const bestResult = Math.min(...positions);
        const avgPosition = positions.reduce((sum: number, pos: number) => sum + pos, 0) / positions.length;
        
        return {
          circuit: circuit.circuitName,
          bestResult,
          avgPosition: parseFloat(avgPosition.toFixed(1)),
          totalRaces: races.length
        };
      })
    );
    
    // Fetch race results for the effective year
    const recentResultsResponse = await fetch(`${BASE_URL}/${effectiveYear}/drivers/${ergastDriverId}/results.json`);
    if (!recentResultsResponse.ok) {
      throw new Error(`Failed to fetch results for ${effectiveYear}: ${recentResultsResponse.statusText}`);
    }
    const recentResultsData = await recentResultsResponse.json() as ApiResponse<Race>;
    
    // Process race results for the effective year
    const recentForm: {
      race: string;
      position: number;
      points: number;
      date: string;
    }[] = [];
    
    if (recentResultsData.MRData.RaceTable?.Races?.length) {
      recentForm.push(...recentResultsData.MRData.RaceTable.Races.map((race: Race) => ({
        race: `${race.raceName} (${effectiveYear})`,
        position: parseInt(race.Results[0].position),
        points: parseFloat(race.Results[0].points),
        date: race.date
      })).reverse());
    } else {
      console.log(`No race results found for driver ${ergastDriverId} in ${effectiveYear}`);
    }
    
    // Get current team from most recent result or from standalone lookup
    let currentTeam = "";
    
    if (recentResultsData.MRData.RaceTable?.Races?.length) {
      currentTeam = recentResultsData.MRData.RaceTable.Races[0].Results[0].Constructor.name;
    } else {
      // Try to get the team from the driver's market data if available
      const teamMatch = driverId.match(/\((.*?)\)$/);
      if (teamMatch && teamMatch[1]) {
        currentTeam = teamMatch[1].trim();
      }
    }
    
    // Compile and return performance data
    return {
      driverInfo: {
        id: driver.driverId,
        name: `${driver.givenName} ${driver.familyName}`,
        nationality: driver.nationality,
        team: currentTeam
      },
      seasonData: validSeasonData,
      circuitPerformance,
      recentForm
    };
  } catch (error) {
    console.error("Error fetching driver performance data:", error);
    
    // Provide a more helpful message depending on the error
    let errorName = `Unknown Driver (${driverId})`;
    let errorMsg = "";
    
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch driver data")) {
        errorName = `Driver Not Found: ${driverId}`;
        errorMsg = "This driver ID was not found in the Ergast F1 database.";
      } else if (error.message.includes("Failed to fetch driver seasons")) {
        errorName = driverId;
        errorMsg = "No season data available for this driver.";
      }
    }
    
    // Return empty structure on error
    return {
      driverInfo: {
        id: ergastDriverId,
        name: errorName,
        nationality: "",
        team: errorMsg
      },
      seasonData: [],
      circuitPerformance: [],
      recentForm: []
    };
  }
}

/**
 * Fetches list of all F1 drivers
 */
export async function getAllDrivers(): Promise<{ id: string; name: string; nationality: string; }[]> {
  try {
    const response = await fetch(`${BASE_URL}/drivers.json?limit=100&offset=0`);
    if (!response.ok) {
      throw new Error(`Failed to fetch drivers: ${response.statusText}`);
    }
    
    const data = await response.json() as ApiResponse<DriverData>;
    return (data.MRData.DriverTable?.Drivers || []).map((driver: DriverData) => ({
      id: driver.driverId,
      name: `${driver.givenName} ${driver.familyName}`,
      nationality: driver.nationality
    }));
  } catch (error) {
    console.error("Error fetching all drivers:", error);
    return [];
  }
}

/**
 * Maps common F1 constructor names to their Ergast API constructor IDs
 */
const CONSTRUCTOR_ID_MAPPING: Record<string, string> = {
  'Red Bull': 'red_bull',
  'Ferrari': 'ferrari',
  'Mercedes': 'mercedes',
  'McLaren': 'mclaren',
  'Aston Martin': 'aston_martin',
  'Alpine': 'alpine',
  'Williams': 'williams',
  'AlphaTauri': 'alphatauri',
  'RB': 'rb',
  'Alfa Romeo': 'alfa',
  'Haas': 'haas',
  'Sauber': 'sauber',
  'Racing Point': 'racing_point',
  'Renault': 'renault',
  'Toro Rosso': 'toro_rosso',
  'Force India': 'force_india',
  'Manor': 'manor',
  'Marussia': 'marussia',
  'Caterham': 'caterham',
  'Lotus F1': 'lotus_f1',
  'HRT': 'hrt',
  'Virgin': 'virgin',
  'Lotus': 'lotus_racing',
  'Brawn': 'brawn',
  'BMW Sauber': 'bmw_sauber',
  'Toyota': 'toyota',
  'Honda': 'honda',
  'Super Aguri': 'super_aguri',
  'Spyker': 'spyker',
  'Midland': 'midland',
  'Jordan': 'jordan',
  'BAR': 'bar',
  'Jaguar': 'jaguar',
  'Arrows': 'arrows',
  'Minardi': 'minardi',
  'Prost': 'prost',
  'Benetton': 'benetton',
  'Stewart': 'stewart',
  'Tyrrell': 'tyrrell',
  'Lola': 'lola',
  'Forti': 'forti',
  'Footwork': 'footwork',
  'Pacific': 'pacific',
  'Simtek': 'simtek',
  'Team Lotus': 'team_lotus',
  'Larrousse': 'larrousse',
  'Brabham': 'brabham',
  'Dallara': 'dallara',
  'Fondmetal': 'fondmetal',
  'March': 'march',
  'AGS': 'ags',
  'Leyton House': 'leyton_house',
  'Osella': 'osella',
  'Coloni': 'coloni',
  'Ligier': 'ligier',
  'Onyx': 'onyx',
  'Zakspeed': 'zakspeed',
  'Rial': 'rial',
  'EuroBrun': 'eurobrun',
  'Scuderia Italia': 'scuderia_italia',
};

/**
 * Tries to map a constructor name or ID to an Ergast API constructor ID
 * @param constructorIdOrName The constructor ID or name to map
 * @returns The Ergast API constructor ID
 */
function mapToErgastConstructorId(constructorIdOrName: string): string {
  // Guard against null or undefined
  if (!constructorIdOrName) {
    return "unknown";
  }
  
  // If it's already in the correct format, return it
  if (constructorIdOrName.match(/^[a-z_]+$/)) {
    return constructorIdOrName;
  }
  
  // Extract just the name without extra info (e.g., "Mercedes (F1 Team)" -> "Mercedes")
  const nameOnly = constructorIdOrName.split('(')[0].trim();
  
  // Check if it's a known constructor name
  if (CONSTRUCTOR_ID_MAPPING[nameOnly]) {
    return CONSTRUCTOR_ID_MAPPING[nameOnly];
  }
  
  // Try to convert name to ID by lowercasing and replacing spaces with underscores
  const potentialId = nameOnly.toLowerCase().replace(/\s+/g, '_');
  
  // Return our best guess
  return potentialId;
}

/**
 * Team/Constructor performance data structure
 */
export interface ConstructorPerformanceData {
  teamInfo: {
    id: string;
    name: string;
    nationality: string;
    color?: string;
  };
  seasonData: {
    year: number;
    points: number;
    position: number;
    wins: number;
    podiums: number;
  }[];
  raceResults: {
    race: string;
    position: number;
    points: number;
    date: string;
  }[];
  driverContribution: {
    name: string;
    points: number;
    wins: number;
    podiums: number;
  }[];
}

/**
 * Fetches constructor performance data including seasonal stats, race results, and driver contributions
 * @param constructorId The Ergast constructor ID or name
 * @param year Optional year to focus analysis on (defaults to current year)
 */
export async function getConstructorPerformanceData(constructorId: string, year?: number): Promise<ConstructorPerformanceData> {
  // Initialize all year-related variables at the top of the function
  const currentYear = new Date().getFullYear();
  const analysisYear = year || currentYear;
  
  console.log(`Fetching constructor data for ${constructorId} in year ${analysisYear}`);
  
  // Map the constructor ID to an Ergast API constructor ID
  const ergastConstructorId = mapToErgastConstructorId(constructorId);
  
  try {
    // Fetch constructor info
    const constructorResponse = await fetch(`${BASE_URL}/constructors/${ergastConstructorId}.json`);
    if (!constructorResponse.ok) {
      throw new Error(`Failed to fetch constructor data: ${constructorResponse.statusText}`);
    }
    const constructorData = await constructorResponse.json() as ApiResponse<ConstructorData>;
    const constructor = constructorData.MRData.ConstructorTable!.Constructors[0];
    
    // Fetch racing seasons data for the constructor
    const seasonsResponse = await fetch(`${BASE_URL}/constructors/${ergastConstructorId}/seasons.json`);
    if (!seasonsResponse.ok) {
      throw new Error(`Failed to fetch constructor seasons: ${seasonsResponse.statusText}`);
    }
    const seasonsData = await seasonsResponse.json() as ApiResponse<SeasonData>;
    
    // For the season data analysis, focus exactly on the selected year
    // If the selected year is in the future, fall back to the current year
    const selectedYearStr = analysisYear.toString();
    
    // If selected year is in the future and not in available seasons, use current year
    const effectiveYear = analysisYear > currentYear && 
      !seasonsData.MRData.SeasonTable?.Seasons.some((s: SeasonData) => s.season === selectedYearStr)
        ? currentYear
        : analysisYear;
    
    // Just select the exact season requested
    const selectedSeasons = [effectiveYear.toString()];
    
    // Add the previous two seasons for comparison if they exist
    if (effectiveYear > 1950 && seasonsData.MRData.SeasonTable?.Seasons) {
      const prevSeasons = seasonsData.MRData.SeasonTable.Seasons
        .map((season: Season) => season.season)
        .filter((seasonYear: string) => {
          const year = parseInt(seasonYear);
          return year >= effectiveYear - 2 && year < effectiveYear;
        });
      
      selectedSeasons.push(...prevSeasons);
    }
    
    // Fetch standings for each season
    const seasonData = await Promise.all(
      selectedSeasons.map(async (year: string) => {
        const standingsResponse = await fetch(`${BASE_URL}/${year}/constructors/${ergastConstructorId}/constructorStandings.json`);
        if (!standingsResponse.ok) {
          return null;
        }
        
        const standingsData = await standingsResponse.json() as ApiResponse<ConstructorStanding>;
        if (!standingsData.MRData.StandingsTable?.StandingsLists.length) {
          return null;
        }
        
        const standing = standingsData.MRData.StandingsTable.StandingsLists[0].ConstructorStandings?.[0];
        if (!standing) {
          return null;
        }
        
        // Get race results to count wins and podiums
        const resultsResponse = await fetch(`${BASE_URL}/${year}/constructors/${ergastConstructorId}/results.json`);
        if (!resultsResponse.ok) {
          return null;
        }
        
        const resultsData = await resultsResponse.json() as ApiResponse<Race>;
        const races = resultsData.MRData.RaceTable?.Races || [];
        
        // Count wins (positions 1) and podiums (positions 1-3) for both drivers combined
        let wins = 0;
        let podiums = 0;
        
        races.forEach((race: Race) => {
          race.Results?.forEach((result: RaceResult) => {
            const position = parseInt(result.position);
            if (position === 1) wins++;
            if (position <= 3) podiums++;
          });
        });
        
        return {
          year: parseInt(year),
          points: parseFloat(standing.points),
          position: parseInt(standing.position),
          wins: wins,
          podiums: podiums
        };
      })
    );
    
    // Filter out null entries and take only valid seasons
    const validSeasonData = seasonData.filter(season => season !== null);
    
    // First fetch all races for the season to ensure we get a complete list
    const allRacesResponse = await fetch(`${BASE_URL}/${effectiveYear}.json`);
    if (!allRacesResponse.ok) {
      throw new Error(`Failed to fetch all races for ${effectiveYear}: ${allRacesResponse.statusText}`);
    }
    const allRacesData = await allRacesResponse.json() as ApiResponse<Race>;
    const allRaces = allRacesData.MRData.RaceTable?.Races || [];
    
    // Then fetch constructor-specific results
    const raceResultsResponse = await fetch(`${BASE_URL}/${effectiveYear}/constructors/${ergastConstructorId}/results.json?limit=1000`);
    if (!raceResultsResponse.ok) {
      throw new Error(`Failed to fetch race results for ${effectiveYear}: ${raceResultsResponse.statusText}`);
    }
    const raceResultsData = await raceResultsResponse.json() as ApiResponse<Race>;
    const constructorRaces = raceResultsData.MRData.RaceTable?.Races || [];
    
    // Process race results data
    const raceResults: {
      race: string;
      date: string;
      position: number;
      points: number;
    }[] = [];
    
    // Create a lookup of constructor results by round
    const constructorResultsByRound: Record<string, {
      points: number;
      position: number;
      results: { position: number; points: number; }[];
    }> = {};
    
    if (constructorRaces.length > 0) {
      constructorRaces.forEach((race: Race) => {
        const round = race.round;
        let points = 0;
        const results: { position: number; points: number; }[] = [];
        
        // Add each driver result
        race.Results.forEach((result: RaceResult) => {
          points += parseFloat(result.points || '0');
          results.push({
            position: parseInt(result.position),
            points: parseFloat(result.points || '0')
          });
        });
        
        // Calculate team position based on best driver result
        let position = 0;
        if (results.length > 0) {
          position = Math.min(...results.map(r => r.position));
        }
        
        constructorResultsByRound[round] = {
          points,
          position,
          results
        };
      });
    }
    
    // Use all races as the basis and add constructor results where available
    allRaces.forEach((race: Race) => {
      const round = race.round;
      const raceName = race.raceName;
      const date = race.date;
      const constructorResult = constructorResultsByRound[round];
      
      raceResults.push({
        race: `${raceName} (${effectiveYear})`,
        date: date,
        // If we have results for this round, use them; otherwise use a default position
        position: constructorResult ? constructorResult.position : 20,
        points: constructorResult ? constructorResult.points : 0
      });
    });
    
    // Sort races by date
    raceResults.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Fetch driver contribution data
    const driversResponse = await fetch(`${BASE_URL}/${effectiveYear}/constructors/${ergastConstructorId}/drivers.json`);
    if (!driversResponse.ok) {
      throw new Error(`Failed to fetch constructor drivers for ${effectiveYear}: ${driversResponse.statusText}`);
    }
    const driversData = await driversResponse.json() as ApiResponse<DriverData>;
    
    // Process driver contribution data
    const driverContribution: {
      name: string;
      points: number;
      wins: number;
      podiums: number;
    }[] = [];
    
    const drivers = driversData.MRData.DriverTable?.Drivers || [];
    
    // Get data for each driver
    for (const driver of drivers) {
      const driverId = driver.driverId;
      const driverName = `${driver.givenName} ${driver.familyName}`;
      
      // Fetch driver standings to get points
      const driverStandingsResponse = await fetch(
        `${BASE_URL}/${effectiveYear}/drivers/${driverId}/constructors/${ergastConstructorId}/status.json`
      );
      
      if (!driverStandingsResponse.ok) continue;
      
      const driverResultsResponse = await fetch(
        `${BASE_URL}/${effectiveYear}/drivers/${driverId}/constructors/${ergastConstructorId}/results.json`
      );
      
      if (!driverResultsResponse.ok) continue;
      
      const driverResultsData = await driverResultsResponse.json() as ApiResponse<Race>;
      const driverRaces = driverResultsData.MRData.RaceTable?.Races || [];
      
      // Calculate points, wins, and podiums
      let points = 0;
      let wins = 0;
      let podiums = 0;
      
      driverRaces.forEach((race: Race) => {
        if (race.Results && race.Results.length > 0) {
          const result = race.Results[0];
          points += parseFloat(result.points || '0');
          
          const position = parseInt(result.position);
          if (position === 1) wins++;
          if (position <= 3) podiums++;
        }
      });
      
      driverContribution.push({
        name: driverName,
        points,
        wins,
        podiums
      });
    }
    
    // Sort driver contribution by points (highest first)
    driverContribution.sort((a, b) => b.points - a.points);
    
    // Get constructor color
    const constructorColor = getConstructorColor(constructor.name);
    
    // Return the constructor performance data
    return {
      teamInfo: {
        id: constructor.constructorId,
        name: constructor.name,
        nationality: constructor.nationality,
        color: constructorColor
      },
      seasonData: validSeasonData,
      raceResults,
      driverContribution
    };
  } catch (error) {
    console.error("Error fetching constructor performance data:", error);
    
    // Return empty structure on error
    return {
      teamInfo: {
        id: ergastConstructorId,
        name: constructorId,
        nationality: "",
        color: getConstructorColor(constructorId)
      },
      seasonData: [],
      raceResults: [],
      driverContribution: []
    };
  }
}

/**
 * Get color for a constructor based on its name
 */
function getConstructorColor(constructorName: string): string {
  const colorMap: Record<string, string> = {
    'Red Bull': '#0600EF',
    'Ferrari': '#DC0000',
    'Mercedes': '#00D2BE',
    'McLaren': '#FF8700',
    'Aston Martin': '#006F62',
    'Alpine': '#0090FF',
    'Williams': '#005AFF',
    'AlphaTauri': '#2B4562',
    'Alfa Romeo': '#900000',
    'Haas': '#FFFFFF',
    'RB': '#0090FF',
    'Sauber': '#900000',
    'Racing Point': '#F596C8',
    'Renault': '#FFF500',
    'Toro Rosso': '#469BFF',
    'Force India': '#FF5F0F',
    'Manor': '#323232',
    'Marussia': '#6E0000',
    'Caterham': '#048E81',
    'Lotus F1': '#FFB800',
    'HRT': '#323232',
    'Virgin': '#323232',
    'Lotus': '#FFB800',
    'Brawn': '#BFD447',
    'BMW Sauber': '#006EFF',
    'Toyota': '#FF1E00',
    'Honda': '#323232',
    'Super Aguri': '#323232',
    'Spyker': '#323232',
    'Midland': '#323232',
    'Jordan': '#323232',
    'BAR': '#323232',
    'Jaguar': '#323232',
    'Arrows': '#323232',
    'Minardi': '#323232',
    'Prost': '#323232',
    'Benetton': '#323232',
    'Stewart': '#323232',
    'Tyrrell': '#323232'
  };
  
  return colorMap[constructorName] || '#666666';
}

interface RaceResult {
  position: string;
  points: string;
  Constructor: {
    name: string;
  };
}

interface Race {
  round: string;
  raceName: string;
  date: string;
  Results: RaceResult[];
}

interface DriverData {
  driverId: string;
  givenName: string;
  familyName: string;
  nationality: string;
}

interface ConstructorData {
  constructorId: string;
  name: string;
  nationality: string;
}

interface Standing {
  position: string;
  points: string;
  wins: string;
}

interface DriverStanding extends Standing {
  Driver: DriverData;
}

interface ConstructorStanding extends Standing {
  Constructor: ConstructorData;
}