"use server"

/**
 * Service for fetching and processing race prediction and weather analysis data
 * Acts as a facade for various F1 data sources including:
 * - OpenF1 API for current race data
 * - Ergast API for historical statistics
 * - Weather APIs for forecast data
 */

import { getCurrentSeasonData } from "./openf1-service"
import { format, addDays } from "date-fns"

// Types for race prediction data
export interface RacePrediction {
  raceId: string
  raceName: string
  circuitName: string
  date: string
  results: DriverPrediction[]
  circuitPerformance: CircuitPerformance[]
  driverForm: DriverForm[]
  factors: PredictionFactors
  confidence: number
}

export interface DriverPrediction {
  id: string
  name: string
  team: string
  probability: number
  isRookie: boolean
  calculationFactors: {
    team: { score: string, weight: string, contribution: string }
    skill: { score: string, weight: string, contribution: string }
    form: { score: string, weight: string, contribution: string }
    circuit: { advantage: string, description: string }
    rookie: string
    totalScore: string
  }
}

export interface CircuitPerformance {
  driver: string
  team: string
  bestFinish: number | string
  avgFinish: number | string
  winProbability: number
  rookieNote?: string
}

export interface DriverForm {
  driver: string
  team: string
  lastFive: (number | string)[]
  trend: string
  formRating: number | string
  rookieNote?: string
}

export interface PredictionFactors {
  teamStrength: number
  driverSkill: number
  currentForm: number
}

// Types for weather analysis data
export interface WeatherAnalysis {
  raceId: string
  raceName: string
  circuitName: string
  date: string
  forecast: WeatherForecast[]
  historical: HistoricalWeather[]
  driverWetPerformance: DriverWetPerformance[]
  impact: WeatherImpact
}

export interface WeatherForecast {
  day: string
  tempLow: number
  tempHigh: number
  precipProbability: number
  condition: string
  windSpeed: number
}

export interface HistoricalWeather {
  year: number
  raceTemp: number
  qualifyingTemp: number
  practiceTemp: number
  rainedDuringWeekend: number
  rainedDuringRace: number
  raceWeather: string
  qualifyingWeather: string
  practiceWeather: string
  winner: string
}

export interface DriverWetPerformance {
  driver: string
  team: string
  wetPerformance: string
  wetWins: number
  wetVsDry: number | string
  rating: number | string
  isRookie: boolean
  rookieNote?: string
}

export interface WeatherImpact {
  teams: Record<string, number>
  factors: {
    name: string
    level: string
    favors: string
  }[]
  strategy: {
    tires: string
    pitStops: string
    carSetup: string
    keyConsiderations: string[]
  }
}

/**
 * Get upcoming races for the current F1 season
 */
export async function getUpcomingRaces() {
  try {
    // Fetch current season data
    const seasonData = await getCurrentSeasonData()
    const currentDate = new Date()
    
    // Filter and sort meetings for upcoming races
    const upcomingRaces = seasonData.meetings
      .filter(meeting => new Date(meeting.date_start) >= currentDate)
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
      .map(meeting => ({
        id: meeting.meeting_code.toLowerCase(),
        name: meeting.meeting_name,
        circuit: meeting.circuit_short_name,
        date: meeting.date_start
      }))
    
    return upcomingRaces
  } catch (error) {
    console.error("Error fetching upcoming races:", error)
    return []
  }
}

/**
 * Generate deterministic race predictions for a specific race
 * Will eventually be replaced with actual prediction model based on real data
 */
export async function getRacePrediction(raceId: string): Promise<RacePrediction | null> {
  try {
    // This is where we would integrate with proper models
    // For now, using deterministic generator for stable mock data
    
    // In a real implementation, this would:
    // 1. Fetch historical race data for this circuit from Ergast API
    // 2. Get current driver and team performances from OpenF1 API
    // 3. Consider weather forecasts if relevant
    // 4. Run ML models against combined data for predictions
    
    // Current F1 drivers for 2025
    const topDrivers = [
      { id: "max_verstappen", name: "Max Verstappen", team: "Red Bull Racing", isRookie: false },
      { id: "liam_lawson", name: "Liam Lawson", team: "Red Bull Racing", isRookie: true },
      { id: "charles_leclerc", name: "Charles Leclerc", team: "Ferrari", isRookie: false },
      { id: "lewis_hamilton", name: "Lewis Hamilton", team: "Ferrari", isRookie: false },
      { id: "george_russell", name: "George Russell", team: "Mercedes", isRookie: false },
      { id: "andrea_antonelli", name: "Andrea Kimi Antonelli", team: "Mercedes", isRookie: true },
      { id: "lando_norris", name: "Lando Norris", team: "McLaren", isRookie: false },
      { id: "oscar_piastri", name: "Oscar Piastri", team: "McLaren", isRookie: false },
      { id: "fernando_alonso", name: "Fernando Alonso", team: "Aston Martin", isRookie: false },
      { id: "lance_stroll", name: "Lance Stroll", team: "Aston Martin", isRookie: false },
      { id: "pierre_gasly", name: "Pierre Gasly", team: "Alpine", isRookie: false },
      { id: "jack_doohan", name: "Jack Doohan", team: "Alpine", isRookie: true },
      { id: "alex_albon", name: "Alex Albon", team: "Williams", isRookie: false },
      { id: "carlos_sainz", name: "Carlos Sainz", team: "Williams", isRookie: false },
      { id: "yuki_tsunoda", name: "Yuki Tsunoda", team: "Racing Bulls", isRookie: false },
      { id: "isack_hadjar", name: "Isack Hadjar", team: "Racing Bulls", isRookie: true },
      { id: "oliver_bearman", name: "Oliver Bearman", team: "Haas F1 Team", isRookie: true },
      { id: "esteban_ocon", name: "Esteban Ocon", team: "Haas F1 Team", isRookie: false },
      { id: "nico_hulkenberg", name: "Nico Hülkenberg", team: "Sauber", isRookie: false },
      { id: "gabriel_bortoleto", name: "Gabriel Bortoleto", team: "Sauber", isRookie: true }
    ]
    
    // Circuit-specific performance factors
    const circuitFactors: Record<string, Record<string, number>> = {
      "monza": { "Ferrari": 1.3, "McLaren": 1.1, "Mercedes": 1.05 },
      "monaco": { "Ferrari": 1.2, "Red Bull Racing": 1.15, "McLaren": 1.1 },
      "silverstone": { "Mercedes": 1.2, "Williams": 1.05, "McLaren": 1.1 },
      "zandvoort": { "Red Bull Racing": 1.3, "McLaren": 1.05 },
      "spa": { "Red Bull Racing": 1.1, "Mercedes": 1.1, "Ferrari": 1.05 },
      "hungaroring": { "McLaren": 1.2, "Mercedes": 1.1, "Ferrari": 1.05 },
      "suzuka": { "Red Bull Racing": 1.15, "McLaren": 1.1 },
      "singapore": { "Ferrari": 1.15, "Mercedes": 1.1 },
      "cota": { "Mercedes": 1.1, "Red Bull Racing": 1.1 },
      "interlagos": { "Ferrari": 1.1, "Red Bull Racing": 1.05 },
      "australia": { "Ferrari": 1.1, "Mercedes": 1.05 },
      "baku": { "Red Bull Racing": 1.15, "Ferrari": 1.1 },
      "jeddah": { "Red Bull Racing": 1.2, "Ferrari": 1.1, "McLaren": 1.05 },
      "bahrain": { "Red Bull Racing": 1.15, "Ferrari": 1.1 },
      "imola": { "Ferrari": 1.2, "Red Bull Racing": 1.05 },
      "barcelona": { "Mercedes": 1.1, "Ferrari": 1.05 },
      "miami": { "Red Bull Racing": 1.1, "Ferrari": 1.05 },
      "canada": { "Red Bull Racing": 1.05, "Ferrari": 1.05, "McLaren": 1.05 },
      "austria": { "Red Bull Racing": 1.25, "McLaren": 1.05 },
      "abu-dhabi": { "Red Bull Racing": 1.15, "Mercedes": 1.05 }
    }
    
    // Base team performance ratings for 2025
    const teamPerformance: Record<string, number> = {
      "Red Bull Racing": 9.0,
      "Ferrari": 8.5,
      "McLaren": 8.8,
      "Mercedes": 8.3,
      "Aston Martin": 7.0,
      "Alpine": 6.5,
      "Williams": 6.0,
      "Racing Bulls": 6.2,
      "Sauber": 5.0,
      "Haas F1 Team": 5.5
    }
    
    // Driver skill ratings
    const driverSkill: Record<string, number> = {
      "Max Verstappen": 9.5,
      "Lewis Hamilton": 9.3,
      "Fernando Alonso": 9.0,
      "Charles Leclerc": 9.0,
      "Lando Norris": 9.0,
      "George Russell": 8.7,
      "Carlos Sainz": 8.6,
      "Oscar Piastri": 8.5,
      "Pierre Gasly": 8.0,
      "Alex Albon": 8.0,
      "Yuki Tsunoda": 7.8,
      "Esteban Ocon": 7.8,
      "Lance Stroll": 7.5,
      "Nico Hülkenberg": 7.8,
      "Liam Lawson": 7.7,
      "Andrea Kimi Antonelli": 7.9,
      "Jack Doohan": 7.6,
      "Isack Hadjar": 7.5,
      "Oliver Bearman": 7.6,
      "Gabriel Bortoleto": 7.5
    }
    
    // Current form ratings
    const currentForm: Record<string, number> = {
      "Max Verstappen": 8.5,
      "Lewis Hamilton": 8.0,
      "Fernando Alonso": 7.0,
      "Charles Leclerc": 8.5,
      "Lando Norris": 9.0,
      "George Russell": 7.5,
      "Carlos Sainz": 8.0,
      "Oscar Piastri": 8.5,
      "Pierre Gasly": 7.0,
      "Alex Albon": 7.5,
      "Yuki Tsunoda": 7.0,
      "Esteban Ocon": 6.5,
      "Lance Stroll": 6.0,
      "Nico Hülkenberg": 6.5,
      "Liam Lawson": 7.0,
      "Andrea Kimi Antonelli": 7.5,
      "Jack Doohan": 7.0,
      "Isack Hadjar": 7.0,
      "Oliver Bearman": 7.0,
      "Gabriel Bortoleto": 7.0
    }
    
    // Get circuit advantage function
    const getCircuitAdvantage = (team: string, circuit: string): number => {
      let matchingCircuit = "";
      for (const circuitKey in circuitFactors) {
        if (circuit.toLowerCase().includes(circuitKey.toLowerCase())) {
          matchingCircuit = circuitKey;
          break;
        }
      }
      
      if (!matchingCircuit) {
        const circuitCountryMapping: Record<string, string> = {
          "china": "singapore",
          "netherlands": "zandvoort",
          "vegas": "singapore",
          "qatar": "bahrain",
          "belgium": "spa",
          "britain": "silverstone",
          "united states": "cota",
          "italy": "monza",
          "japan": "suzuka",
          "saudi-arabia": "jeddah",
          "mexico": "interlagos",
          "australia": "melbourne",
          "hungary": "hungaroring",
          "austria": "austria",
          "brazil": "interlagos",
          "spain": "barcelona",
          "abu-dhabi": "abu-dhabi"
        };
        
        for (const [country, circuit] of Object.entries(circuitCountryMapping)) {
          if (raceId.toLowerCase().includes(country.toLowerCase())) {
            matchingCircuit = circuit;
            break;
          }
        }
      }
      
      if (matchingCircuit && circuitFactors[matchingCircuit]) {
        for (const [teamKey, advantage] of Object.entries(circuitFactors[matchingCircuit])) {
          if (team.includes(teamKey)) {
            return advantage;
          }
        }
      }
      
      return 1.0;
    };
    
    // Driver prediction calculation
    const calculateDriverPrediction = (driver: any): DriverPrediction => {
      // Base team performance (60% of total)
      const teamScore = teamPerformance[driver.team] || 5.0;
      
      // Driver skill (25% of total)
      const skillScore = driverSkill[driver.name] || 7.0;
      
      // Circuit-specific advantage
      const circuitAdvantage = getCircuitAdvantage(driver.team, raceId);
      
      // Current form (15% of total)
      const formScore = currentForm[driver.name] || 6.0;
      
      // Random factor (up to ±10% variability) - but seeded for stability
      const seed = driver.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const x = Math.sin(seed) * 10000;
      const randomFactor = 0.9 + (x - Math.floor(x)) * 0.2;
      
      // Rookie penalty
      const rookieFactor = driver.isRookie ? 0.8 : 1.0;
      
      // Weight the factors
      const weightedScore = (
        (teamScore * 0.6) + 
        (skillScore * 0.25) + 
        (formScore * 0.15)
      ) * circuitAdvantage * randomFactor * rookieFactor;
      
      // Record calculation factors
      const calculationFactors = {
        team: { 
          score: teamScore.toFixed(1), 
          weight: "60%",
          contribution: (teamScore * 0.6).toFixed(1)
        },
        skill: { 
          score: skillScore.toFixed(1), 
          weight: "25%",
          contribution: (skillScore * 0.25).toFixed(1)
        },
        form: { 
          score: formScore.toFixed(1), 
          weight: "15%",
          contribution: (formScore * 0.15).toFixed(1)
        },
        circuit: { 
          advantage: circuitAdvantage.toFixed(2), 
          description: circuitAdvantage > 1 ? "Advantage" : "Neutral"
        },
        rookie: driver.isRookie ? "Yes (-20%)" : "No",
        totalScore: weightedScore.toFixed(2)
      };
      
      // Scale to a probability
      const probability = Math.min(Math.max(Math.round(weightedScore * 10), 1), 99);
      
      return {
        ...driver,
        probability,
        calculationFactors
      };
    };
    
    // Generate predictions for all drivers
    const predictions = topDrivers.map(calculateDriverPrediction)
      .sort((a, b) => b.probability - a.probability);
    
    // Generate circuit performance data
    const circuitPerformance: CircuitPerformance[] = topDrivers.slice(0, 10).map(driver => {
      if (driver.isRookie) {
        return {
          driver: driver.name,
          team: driver.team,
          bestFinish: "N/A",
          avgFinish: "N/A",
          winProbability: predictions.find(d => d.name === driver.name)?.probability || 0,
          rookieNote: "No previous data at this circuit"
        }
      } else {
        // Deterministic calculations based on driver and circuit
        const driverRating = driverSkill[driver.name] || 7.0;
        const teamRating = teamPerformance[driver.team] || 5.0;
        const combinedRating = (driverRating * 0.4 + teamRating * 0.6) / 10;
        
        // Create a circuit+driver specific seed for stable results
        const circuitDriverSeed = raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                                + driver.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        // Stable pseudo-random adjustment
        const x = Math.sin(circuitDriverSeed) * 10000;
        const rand = x - Math.floor(x); // 0-1 based on seed
        const adjustment = 0.9 + (rand * 0.2); // 0.9-1.1 adjustment factor
        
        // Better drivers/teams have better finishes with slight deterministic variance
        const bestFinish = Math.max(1, Math.min(10, Math.floor((1 / combinedRating) * 3 * adjustment)));
        const avgFinish = Math.max(bestFinish, Math.min(15, Math.floor((1 / combinedRating) * 5 * adjustment)));
        
        return {
          driver: driver.name,
          team: driver.team,
          bestFinish,
          avgFinish,
          winProbability: predictions.find(d => d.name === driver.name)?.probability || 0
        }
      }
    }).sort((a, b) => {
      // Sort non-rookies first by avgFinish
      if (a.avgFinish === "N/A" && b.avgFinish === "N/A") return 0;
      if (a.avgFinish === "N/A") return 1;
      if (b.avgFinish === "N/A") return -1;
      return (a.avgFinish as number) - (b.avgFinish as number);
    });
    
    // Generate driver form data
    const driverForm: DriverForm[] = topDrivers.slice(0, 10).map(driver => {
      if (driver.isRookie) {
        return {
          driver: driver.name,
          team: driver.team,
          lastFive: ["N/A", "N/A", "N/A", "N/A", "N/A"],
          trend: "neutral",
          formRating: "N/A",
          rookieNote: "Limited historical data available"
        }
      } else {
        const skillRating = driverSkill[driver.name] || 7.0;
        const currentFormRating = currentForm[driver.name] || 6.0;
        const combinedRating = (skillRating * 0.5 + currentFormRating * 0.5) / 10;
        
        // Stable deterministic pseudo-random generator for driver form
        const driverSeed = driver.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        
        // Generate position based on driver skill and deterministic "random" factor
        const generatePosition = (pos: number) => {
          const mean = Math.max(1, Math.floor(1 / combinedRating * 5));
          const variance = Math.max(1, Math.floor(mean / 2));
          const x = Math.sin((driverSeed + pos * 100)) * 10000;
          const randomFactor = x - Math.floor(x); // Returns value between 0-1
          
          // Generate around the mean with predetermined variance
          const position = Math.floor(mean + (randomFactor * 2 - 1) * variance);
          return Math.max(1, Math.min(20, position));
        };
        
        // Generate last 5 race results
        const lastFive = [0, 1, 2, 3, 4].map(generatePosition);
        
        // Determine trend based on last 5 results
        const firstHalf = lastFive.slice(0, 2).reduce((sum, pos) => sum + pos, 0) / 2;
        const secondHalf = lastFive.slice(3, 5).reduce((sum, pos) => sum + pos, 0) / 2;
        
        let trend = "neutral";
        if (secondHalf < firstHalf - 1) trend = "up"; // Lower position numbers are better
        if (secondHalf > firstHalf + 1) trend = "down";
        
        // Calculate form rating (0-100 scale)
        const positionPoints = lastFive.map(pos => Math.max(0, 21 - pos)).reduce((sum, points) => sum + points, 0);
        const maxPoints = 5 * 20; // 5 races * 20 points (maximum for 1st place)
        const formRating = Math.round((positionPoints / maxPoints) * 100);
        
        return {
          driver: driver.name,
          team: driver.team,
          lastFive,
          trend,
          formRating
        }
      }
    }).sort((a, b) => {
      if (a.formRating === "N/A" && b.formRating === "N/A") return 0;
      if (a.formRating === "N/A") return 1;
      if (b.formRating === "N/A") return -1;
      return (b.formRating as number) - (a.formRating as number);
    });
    
    // Calculate prediction factors
    const factors: PredictionFactors = {
      teamStrength: 60,
      driverSkill: 25,
      currentForm: 15
    }
    
    // Calculate confidence based on data quality and consistency
    const topScore = predictions[0]?.probability || 0;
    const fifthScore = predictions[4]?.probability || 0;
    const scoreDifference = topScore - fifthScore;
    const confidence = Math.min(95, Math.max(50, 70 + scoreDifference));
    
    // Lookup race name from race ID or use default
    let raceName = "Grand Prix";
    let circuitName = "Circuit";
    
    // Races lookup - this would come from API in real code
    const races = {
      "australia": { name: "Australian Grand Prix", circuit: "Albert Park" },
      "bahrain": { name: "Bahrain Grand Prix", circuit: "Bahrain International Circuit" },
      "saudi-arabia": { name: "Saudi Arabian Grand Prix", circuit: "Jeddah Street Circuit" },
      "japan": { name: "Japanese Grand Prix", circuit: "Suzuka International Racing Course" },
      "china": { name: "Chinese Grand Prix", circuit: "Shanghai International Circuit" },
      "miami": { name: "Miami Grand Prix", circuit: "Miami International Autodrome" },
      "monaco": { name: "Monaco Grand Prix", circuit: "Circuit de Monaco" }
    };
    
    if (races[raceId as keyof typeof races]) {
      raceName = races[raceId as keyof typeof races].name;
      circuitName = races[raceId as keyof typeof races].circuit;
    }
    
    return {
      raceId,
      raceName,
      circuitName,
      date: format(new Date(), 'yyyy-MM-dd'),
      results: predictions,
      circuitPerformance,
      driverForm,
      factors,
      confidence
    };
  } catch (error) {
    console.error("Error generating race prediction:", error);
    return null;
  }
}

/**
 * Generate weather analysis for a specific race
 * Will eventually be replaced with actual weather API data
 */
export async function getWeatherAnalysis(raceId: string): Promise<WeatherAnalysis | null> {
  try {
    // Lookup race info based on ID - this would come from API in real code
    const races = {
      "australia": { 
        name: "Australian Grand Prix", 
        circuit: "Albert Park",
        climate: { hot: true, rainy: true, season: "autumn" }
      },
      "bahrain": { 
        name: "Bahrain Grand Prix", 
        circuit: "Bahrain International Circuit",
        climate: { hot: true, rainy: false, season: "spring" }
      },
      "saudi-arabia": { 
        name: "Saudi Arabian Grand Prix", 
        circuit: "Jeddah Street Circuit",
        climate: { hot: true, rainy: false, season: "spring" }
      },
      "japan": { 
        name: "Japanese Grand Prix", 
        circuit: "Suzuka International Racing Course",
        climate: { temperate: true, rainy: true, season: "spring" }
      },
      "china": { 
        name: "Chinese Grand Prix", 
        circuit: "Shanghai International Circuit",
        climate: { temperate: true, rainy: true, season: "spring" }
      },
      "miami": { 
        name: "Miami Grand Prix", 
        circuit: "Miami International Autodrome",
        climate: { hot: true, rainy: true, season: "spring" }
      },
      "monaco": { 
        name: "Monaco Grand Prix", 
        circuit: "Circuit de Monaco",
        climate: { temperate: true, rainy: true, season: "spring" }
      }
    };
    
    let raceName = "Grand Prix";
    let circuitName = "Circuit";
    let climate = { temperate: true, rainy: false, season: "summer" };
    
    if (races[raceId as keyof typeof races]) {
      raceName = races[raceId as keyof typeof races].name;
      circuitName = races[raceId as keyof typeof races].circuit;
      climate = races[raceId as keyof typeof races].climate;
    }
    
    // Generate deterministic temperature range based on climate
    const getTempRange = () => {
      // Use race ID as seed for deterministic random values
      const seed = raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const getRandom = (min: number, max: number, offset: number = 0) => {
        const x = Math.sin((seed + offset) * 100) * 10000;
        const rand = x - Math.floor(x); // 0-1 based on seed
        return min + Math.floor(rand * (max - min + 1));
      };
      
      if (climate.hot) {
        return { low: 25 + getRandom(0, 5), high: 30 + getRandom(0, 10, 1) };
      } else if (climate.temperate) {
        return { low: 15 + getRandom(0, 5), high: 20 + getRandom(0, 10, 1) };
      } else {
        return { low: 5 + getRandom(0, 5), high: 10 + getRandom(0, 10, 1) };
      }
    };
    
    // Generate rain probability based on climate
    const getRainProbability = (dayOffset: number) => {
      const seed = raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + dayOffset;
      const x = Math.sin(seed) * 10000;
      const rand = x - Math.floor(x); // 0-1 based on seed
      
      if (climate.rainy) {
        return 30 + Math.floor(rand * 50);
      } else {
        return Math.floor(rand * 20);
      }
    };
    
    // Generate weather condition based on rain probability
    const getWeatherCondition = (rainProb: number) => {
      if (rainProb > 70) return "Rain";
      if (rainProb > 40) return "Partly Cloudy";
      if (rainProb > 20) return "Cloudy";
      return "Sunny";
    };
    
    // Generate forecast for race weekend
    const generateForecast = (): WeatherForecast[] => {
      const days = ["Practice 1", "Practice 2", "Practice 3", "Qualifying", "Race Day"];
      
      return days.map((day, index) => {
        const tempRange = getTempRange();
        const precipProbability = getRainProbability(index);
        
        return {
          day,
          tempLow: tempRange.low,
          tempHigh: tempRange.high,
          precipProbability,
          condition: getWeatherCondition(precipProbability),
          windSpeed: 5 + Math.floor(Math.random() * 15)
        };
      });
    };
    
    // Generate historical weather data
    const generateHistoricalData = (): HistoricalWeather[] => {
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - i - 1);
      
      return years.map((year, i) => {
        const raceTemp = climate.hot ? 
          25 + Math.floor(Math.random() * 10) : 
          climate.temperate ? 
            15 + Math.floor(Math.random() * 15) : 
            5 + Math.floor(Math.random() * 10);
        
        const qualifyingTemp = raceTemp + Math.floor(Math.random() * 5) - 2;
        const practiceTemp = raceTemp + Math.floor(Math.random() * 5) - 2;
        
        // Use deterministic random for weather based on year and race
        const yearSeed = year + raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const x1 = Math.sin(yearSeed) * 10000;
        const x2 = Math.sin(yearSeed + 1) * 10000;
        const rand1 = x1 - Math.floor(x1);
        const rand2 = x2 - Math.floor(x2);
        
        const rainedDuringWeekend = climate.rainy ? rand1 > 0.5 ? 1 : 0 : rand1 > 0.8 ? 1 : 0;
        const rainedDuringRace = rainedDuringWeekend && rand2 > 0.5 ? 1 : 0;
        
        const getCondition = (rained: boolean, temp: number) => {
          if (rained && Math.random() > 0.5) return "Rain";
          if (rained) return "Partly Cloudy";
          if (temp > 25) return "Sunny";
          return "Cloudy";
        };
        
        const raceWeather = getCondition(rainedDuringRace === 1, raceTemp);
        const qualifyingWeather = getCondition(rainedDuringWeekend === 1 && Math.random() > 0.5, qualifyingTemp);
        const practiceWeather = getCondition(rainedDuringWeekend === 1 && Math.random() > 0.5, practiceTemp);
        
        // Top drivers for realistic mock data
        const topDrivers = [
          "Max Verstappen", "Lewis Hamilton", "Charles Leclerc", "Lando Norris",
          "Carlos Sainz", "Sergio Perez", "George Russell", "Fernando Alonso"
        ];
        
        // Deterministic winner based on year and race
        const winnerIndex = Math.floor((Math.sin(yearSeed + 2) * 10000 - Math.floor(Math.sin(yearSeed + 2) * 10000)) * topDrivers.length);
        
        return {
          year,
          raceTemp,
          qualifyingTemp,
          practiceTemp,
          rainedDuringWeekend,
          rainedDuringRace,
          raceWeather,
          qualifyingWeather,
          practiceWeather,
          winner: topDrivers[winnerIndex]
        };
      });
    };
    
    // Generate driver wet weather performance data
    const generateDriverWetPerformance = (): DriverWetPerformance[] => {
      const drivers = [
        { driver: "Max Verstappen", team: "Red Bull Racing", wetPerformance: "Excellent", wetWins: 5, wetVsDry: 2.3, rating: 9, isRookie: false },
        { driver: "Liam Lawson", team: "Red Bull Racing", wetPerformance: "Unknown", wetWins: 0, wetVsDry: 0, rating: "N/A", isRookie: true, rookieNote: "Limited F1 wet weather data" },
        { driver: "Lewis Hamilton", team: "Ferrari", wetPerformance: "Excellent", wetWins: 11, wetVsDry: 3.1, rating: 10, isRookie: false },
        { driver: "Charles Leclerc", team: "Ferrari", wetPerformance: "Good", wetWins: 1, wetVsDry: 0.8, rating: 7, isRookie: false },
        { driver: "George Russell", team: "Mercedes", wetPerformance: "Good", wetWins: 0, wetVsDry: 1.0, rating: 7, isRookie: false },
        { driver: "Andrea Kimi Antonelli", team: "Mercedes", wetPerformance: "Unknown", wetWins: 0, wetVsDry: 0, rating: "N/A", isRookie: true, rookieNote: "Limited F1 wet weather data" },
        { driver: "Lando Norris", team: "McLaren", wetPerformance: "Good", wetWins: 0, wetVsDry: 1.2, rating: 8, isRookie: false },
        { driver: "Oscar Piastri", team: "McLaren", wetPerformance: "Average", wetWins: 0, wetVsDry: 0.2, rating: 6, isRookie: false },
        { driver: "Fernando Alonso", team: "Aston Martin", wetPerformance: "Excellent", wetWins: 4, wetVsDry: 2.5, rating: 9, isRookie: false },
        { driver: "Lance Stroll", team: "Aston Martin", wetPerformance: "Poor", wetWins: 0, wetVsDry: -1.5, rating: 4, isRookie: false },
        { driver: "Pierre Gasly", team: "Alpine", wetPerformance: "Average", wetWins: 0, wetVsDry: -0.3, rating: 6, isRookie: false },
        { driver: "Jack Doohan", team: "Alpine", wetPerformance: "Unknown", wetWins: 0, wetVsDry: 0, rating: "N/A", isRookie: true, rookieNote: "Limited F1 wet weather data" },
        { driver: "Alex Albon", team: "Williams", wetPerformance: "Good", wetWins: 0, wetVsDry: 0.7, rating: 7, isRookie: false },
        { driver: "Carlos Sainz", team: "Williams", wetPerformance: "Good", wetWins: 1, wetVsDry: 0.5, rating: 7, isRookie: false },
        { driver: "Yuki Tsunoda", team: "Racing Bulls", wetPerformance: "Average", wetWins: 0, wetVsDry: -0.1, rating: 5, isRookie: false },
        { driver: "Isack Hadjar", team: "Racing Bulls", wetPerformance: "Unknown", wetWins: 0, wetVsDry: 0, rating: "N/A", isRookie: true, rookieNote: "Limited F1 wet weather data" },
        { driver: "Oliver Bearman", team: "Haas F1 Team", wetPerformance: "Unknown", wetWins: 0, wetVsDry: 0, rating: "N/A", isRookie: true, rookieNote: "Limited F1 wet weather data" },
        { driver: "Esteban Ocon", team: "Haas F1 Team", wetPerformance: "Average", wetWins: 0, wetVsDry: -0.4, rating: 5, isRookie: false },
        { driver: "Nico Hulkenberg", team: "Sauber", wetPerformance: "Good", wetWins: 0, wetVsDry: 0.8, rating: 7, isRookie: false },
        { driver: "Gabriel Bortoleto", team: "Sauber", wetPerformance: "Unknown", wetWins: 0, wetVsDry: 0, rating: "N/A", isRookie: true, rookieNote: "Limited F1 wet weather data" }
      ];
      
      // Add small deterministic adjustment to performance metrics
      return drivers.map(driver => {
        const seed = driver.driver.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + 
                    raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const x = Math.sin(seed) * 10000;
        const rand = x - Math.floor(x); // 0-1 based on seed
        
        if (driver.isRookie) {
          return driver; // No change to rookie values
        } else {
          return {
            ...driver,
            wetVsDry: parseFloat((driver.wetVsDry + (rand * 0.6 - 0.3)).toFixed(1)),
            rating: typeof driver.rating === 'number' 
              ? Math.min(10, Math.max(1, driver.rating + Math.floor(rand * 3) - 1))
              : driver.rating
          };
        }
      });
    };
    
    // Generate weather impact data
    const generateWeatherImpact = (): WeatherImpact => {
      const forecast = generateForecast();
      const raceDay = forecast.find(day => day.day === "Race Day");
      const isWet = raceDay && raceDay.precipProbability > 50;
      
      // Team performance in wet/dry conditions
      const teamImpact: Record<string, number> = {
        "Red Bull Racing": isWet ? 85 : 95,
        "Ferrari": isWet ? 75 : 90,
        "Mercedes": isWet ? 90 : 85,
        "McLaren": isWet ? 80 : 88,
        "Aston Martin": isWet ? 70 : 75,
        "Alpine": isWet ? 60 : 65,
        "Williams": isWet ? 65 : 55,
        "Racing Bulls": isWet ? 50 : 60,
        "Haas F1 Team": isWet ? 45 : 55,
        "Sauber": isWet ? 40 : 45
      };
      
      // Add deterministic adjustments to team performance
      Object.keys(teamImpact).forEach(team => {
        const seed = team.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) +
                    raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const x = Math.sin(seed) * 10000;
        const rand = x - Math.floor(x); // 0-1 based on seed
        const adjustment = Math.floor(rand * 10) - 5;
        
        teamImpact[team] = Math.min(100, Math.max(10, teamImpact[team] + adjustment));
      });
      
      // Weather impact factors
      const weatherFactors = [
        {
          name: "Temperature",
          level: raceDay && raceDay.tempHigh > 28 ? "High" : raceDay && raceDay.tempHigh > 20 ? "Medium" : "Low",
          favors: raceDay && raceDay.tempHigh > 28 ? "Ferrari, McLaren" : "Red Bull, Mercedes"
        },
        {
          name: "Precipitation",
          level: isWet ? "High" : raceDay && raceDay.precipProbability > 30 ? "Medium" : "Low",
          favors: isWet ? "Mercedes, Red Bull" : "Ferrari, McLaren"
        },
        {
          name: "Wind",
          level: raceDay && raceDay.windSpeed > 15 ? "High" : raceDay && raceDay.windSpeed > 10 ? "Medium" : "Low",
          favors: raceDay && raceDay.windSpeed > 15 ? "Mercedes, Aston Martin" : "Red Bull, McLaren"
        },
        {
          name: "Track Temperature",
          level: raceDay && raceDay.tempHigh > 30 ? "High" : raceDay && raceDay.tempHigh > 22 ? "Medium" : "Low",
          favors: raceDay && raceDay.tempHigh > 30 ? "Ferrari, Aston Martin" : "Red Bull, McLaren"
        }
      ];
      
      // Strategy recommendations based on weather
      const strategyRecommendations = {
        tires: isWet ? 
          "Intermediate or wet tires likely needed for at least part of the race. Extra caution during transitions from wet to dry conditions." : 
          raceDay && raceDay.tempHigh > 28 ? 
            "Higher temperatures will increase tire degradation. Three-stop strategy might be optimal for teams planning aggressive race pace." : 
            "Moderate temperatures should allow for standard two-stop strategy with medium and hard compounds.",
        
        pitStops: isWet ? 
          "Unpredictable conditions may require reactive pit strategy. Be ready for sudden weather changes and safety car periods." : 
          raceDay && raceDay.tempHigh > 28 ? 
            "Three stops possible for top teams, with undercut advantage in the middle of the race." : 
            "Standard two-stop strategy likely optimal. Watch for teams attempting overcut during middle stint.",
        
        carSetup: isWet ? 
          "Higher downforce setup beneficial for wet conditions, especially in technical sections. May compromise straight-line speed." : 
          raceDay && raceDay.windSpeed > 15 ? 
            "Strong winds will affect car balance, particularly in high-speed corners. Additional downforce may help stability." : 
            "Standard balanced setup with focus on optimizing tire performance throughout stint length.",
        
        keyConsiderations: isWet ? [
          "Track will evolve rapidly as it dries, creating crossover points for tire strategies",
          "Safety car probability increases significantly (60%+)",
          "Drivers with strong wet weather skills have advantage (Hamilton, Verstappen, Alonso)",
          "Visibility issues in spray will make overtaking more difficult and risky"
        ] : raceDay && raceDay.tempHigh > 28 ? [
          "Tire management will be critical, especially for teams struggling with degradation",
          "Track temperature will peak during the afternoon, affecting performance in final stint",
          "Cooling could be an issue for some teams, potentially limiting engine performance",
          "DRS effectiveness may be reduced in high temperatures"
        ] : [
          "Standard racing conditions expected",
          "Moderate safety car probability (20-30%)",
          "Track evolution should follow normal pattern through race weekend",
          "Focus on conventional race strategy with optimal tire management"
        ]
      };
      
      return {
        teams: teamImpact,
        factors: weatherFactors,
        strategy: strategyRecommendations
      };
    };
    
    // Create composite weather analysis object
    return {
      raceId,
      raceName,
      circuitName,
      date: format(new Date(), 'yyyy-MM-dd'),
      forecast: generateForecast(),
      historical: generateHistoricalData(),
      driverWetPerformance: generateDriverWetPerformance(),
      impact: generateWeatherImpact()
    };
  } catch (error) {
    console.error("Error generating weather analysis:", error);
    return null;
  }
}