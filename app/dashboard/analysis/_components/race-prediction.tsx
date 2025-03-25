"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DriverForm from "./driver-form"
import CircuitAnalysis from "./circuit-analysis"
import PredictionResults from "./prediction-results"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { RacePrediction } from "@/lib/services/racing-data-service"

export default function RacePrediction() {
  const [selectedRace, setSelectedRace] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [predictions, setPredictions] = useState<RacePrediction | null>(null)
  // Define the Race interface to ensure consistency
  interface Race {
    id: string; 
    raceId: string; // Keep both for compatibility
    raceName: string;
    name: string;    // Alternative name property
    date: string;
    circuit?: string; // Circuit name
  }
  
  const [availableRaces, setAvailableRaces] = useState<Race[]>([])
  
  // Load available races for the current season
  useEffect(() => {
    async function loadRaces() {
      try {
        setIsLoading(true)
        
        // Fetch from racing-data-service
        // This will eventually use the OpenF1 and Ergast APIs for real data
        const response = await fetch('/api/race-prediction/races');
        const mockRaces: Race[] = await response.json();
        
        // Sort races by date and filter out past races
        const currentDate = new Date()
        const upcomingRaces = mockRaces
          .filter((race: Race) => new Date(race.date) >= currentDate)
          .sort((a: Race, b: Race) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
        setAvailableRaces(upcomingRaces)
        
        // Auto-select the next race
        if (upcomingRaces.length > 0) {
          setSelectedRace(upcomingRaces[0].id)
        }
      } catch (error) {
        console.error("Error loading races:", error)
        setError("Failed to load upcoming races")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadRaces()
  }, [])
  
  // Generate predictions when a race is selected
  useEffect(() => {
    async function generatePredictions() {
      if (!selectedRace) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch predictions from API endpoint
        const response = await fetch(`/api/race-prediction/${selectedRace}`);
        if (!response.ok) {
          throw new Error('Failed to fetch race prediction data');
        }
        const predictionData = await response.json();
        setPredictions(predictionData);
      } catch (error) {
        console.error("Error generating predictions:", error)
        setError("Failed to generate race predictions")
      } finally {
        setIsLoading(false)
      }
    }
    
    generatePredictions()
  }, [selectedRace])
  
  // Handler for refreshing predictions
  const handleRefreshPredictions = async () => {
    if (selectedRace) {
      setIsLoading(true);
      try {
        // Fetch predictions with cache-busting parameter
        const response = await fetch(`/api/race-prediction/${selectedRace}?refresh=${Date.now()}`);
        if (!response.ok) {
          throw new Error('Failed to refresh race prediction data');
        }
        const predictionData = await response.json();
        setPredictions(predictionData);
      } catch (error) {
        console.error("Error refreshing predictions:", error);
        setError("Failed to refresh race predictions");
      } finally {
        setIsLoading(false);
      }
    }
  }
  
  const selectedRaceData = availableRaces.find(race => race.id === selectedRace)
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Race Prediction</CardTitle>
          <CardDescription>
            Analyze historical data and predict outcomes for upcoming F1 races
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Upcoming Race</label>
              <div className="flex gap-2">
                <Select 
                  value={selectedRace || ""} 
                  onValueChange={setSelectedRace}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a race" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRaces.length > 0 ? (
                      availableRaces.map((race) => (
                        <SelectItem key={race.id} value={race.id}>
                          {race.name || race.raceName} - {new Date(race.date).toLocaleDateString()}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>Loading races...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleRefreshPredictions}
                  disabled={isLoading || !selectedRace}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      )}
      
      {!isLoading && predictions && selectedRaceData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{selectedRaceData.name || selectedRaceData.raceName}</CardTitle>
              <CardDescription>
                {selectedRaceData.circuit || "TBD"} - {new Date(selectedRaceData.date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="predictions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="predictions">Predictions</TabsTrigger>
                  <TabsTrigger value="form">Driver Form</TabsTrigger>
                  <TabsTrigger value="circuit">Circuit Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="predictions" className="pt-4 space-y-4">
                  <PredictionResults predictions={predictions.results} confidence={predictions.confidence} />
                </TabsContent>
                
                <TabsContent value="form" className="pt-4">
                  <DriverForm driverForm={predictions.driverForm} />
                </TabsContent>
                
                <TabsContent value="circuit" className="pt-4">
                  <CircuitAnalysis 
                    circuitId={selectedRaceData.id}
                    circuitName={selectedRaceData.circuit || selectedRaceData.raceName || "Circuit"}
                    driverPerformance={predictions.circuitPerformance}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prediction Factors Weighting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FactorCard 
                  title="Team Strength" 
                  value={`${predictions.factors.teamStrength}%`} 
                  description="Car performance and team capabilities"
                />
                <FactorCard 
                  title="Driver Skill" 
                  value={`${predictions.factors.driverSkill}%`} 
                  description="Individual driver ability and experience"
                />
                <FactorCard 
                  title="Current Form" 
                  value={`${predictions.factors.currentForm}%`} 
                  description="Recent race performance and momentum"
                />
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  Additional factors: Circuit-specific advantages, rookie status, and race conditions are applied
                  as multipliers to the base scores. Click on the info icons next to driver probabilities to see
                  detailed calculations.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-xs text-center text-muted-foreground mt-2">
            <p>Predictions are based on Ergast API historical data (1950-2024), OpenF1 current data, driver ratings, team performance, and circuit characteristics.</p>
            <p className="mt-1">For rookie drivers with no race history, we use team performance and driver ratings. Actual results may vary due to unpredictable racing events.</p>
          </div>
        </div>
      )}
      
      {!isLoading && !predictions && !error && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Select an upcoming race to generate predictions</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FactorCard({ title, value, description }: { title: string, value: string, description: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/* Removing unused function as it's not needed in production code
function generateMockPredictions(raceId: string) {
  // Current F1 drivers for 2025 - matched to the team selection data
  // This is the accurate 2025 driver lineup with correct rookie status
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
  
  // Note: In a production app, this data would come directly from the OpenF1 API and Ergast API
  // Any historical data for rookie drivers would be handled properly with N/A values
  
  // Circuit-specific performance factors
  // These represent historical advantages certain teams have at specific circuits
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
  
  // Base team performance ratings for 2025 (estimated competitiveness)
  const teamPerformance: Record<string, number> = {
    "Red Bull Racing": 9.0,
    "Ferrari": 8.5,
    "McLaren": 8.8,
    "Mercedes": 8.3,
    "Aston Martin": 7.0,
    "Alpine": 6.5,
    "Williams": 6.0,
    "Racing Bulls": 6.2, // Renamed from RB to Racing Bulls
    "Sauber": 5.0,
    "Haas F1 Team": 5.5
  }
  
  // Driver skill ratings (independent of car performance)
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
    // Rookies have less experience but potential
    "Liam Lawson": 7.7,
    "Andrea Kimi Antonelli": 7.9,
    "Jack Doohan": 7.6,
    "Isack Hadjar": 7.5,
    "Oliver Bearman": 7.6,
    "Gabriel Bortoleto": 7.5
  }
  
  // Current form ratings (recent performance, 0-10)
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
    // Rookies have limited data, so their form is based on junior categories
    "Liam Lawson": 7.0, 
    "Andrea Kimi Antonelli": 7.5,
    "Jack Doohan": 7.0,
    "Isack Hadjar": 7.0,
    "Oliver Bearman": 7.0,
    "Gabriel Bortoleto": 7.0
  }
  
  // Calculate circuit-specific advantages for this race
  const getCircuitAdvantage = (team: string, circuit: string): number => {
    // Find the closest matching circuit from our data
    let matchingCircuit = "";
    for (const circuitKey in circuitFactors) {
      if (circuit.toLowerCase().includes(circuitKey.toLowerCase())) {
        matchingCircuit = circuitKey;
        break;
      }
    }
    
    // If no match, try to match by country or similar circuit type
    if (!matchingCircuit) {
      const circuitCountryMapping: Record<string, string> = {
        "china": "singapore", // Similar street circuit feel
        "netherlands": "zandvoort",
        "vegas": "singapore", // Night race
        "qatar": "bahrain", // Middle Eastern circuit
        "belgium": "spa",
        "britain": "silverstone",
        "united states": "cota",
        "italy": "monza",
        "japan": "suzuka",
        "saudi-arabia": "jeddah",
        "mexico": "interlagos", // Similar altitude
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
    
    // If we found a matching circuit and the team has an advantage there
    if (matchingCircuit && circuitFactors[matchingCircuit]) {
      for (const [teamKey, advantage] of Object.entries(circuitFactors[matchingCircuit])) {
        if (team.includes(teamKey)) {
          return advantage;
        }
      }
    }
    
    return 1.0; // No specific advantage
  };
  
  // Calculate prediction with detailed factors
  const calculateDriverPrediction = (driver: {name: string; team: string; isRookie: boolean}) => {
    // Base team performance (60% of total)
    const teamScore = teamPerformance[driver.team] || 5.0;
    
    // Driver skill (25% of total)
    const skillScore = driverSkill[driver.name] || 7.0;
    
    // Circuit-specific advantage (can boost by up to 30%)
    const circuitAdvantage = getCircuitAdvantage(driver.team, raceId);
    
    // Current form (15% of total)
    const formScore = currentForm[driver.name] || 6.0;
    
    // Random factor (up to ±10% variability)
    const randomFactor = 0.9 + Math.random() * 0.2;
    
    // Rookie penalty (reduce by 20% for rookies)
    const rookieFactor = driver.isRookie ? 0.8 : 1.0;
    
    // Weight the factors
    const weightedScore = (
      (teamScore * 0.6) + 
      (skillScore * 0.25) + 
      (formScore * 0.15)
    ) * circuitAdvantage * randomFactor * rookieFactor;
    
    // Record the calculation factors for transparency
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
    
    // Scale to a probability (0-100)
    const rawProbability = Math.min(Math.max(Math.round(weightedScore * 10), 1), 99);
    
    return {
      ...driver,
      probability: rawProbability,
      calculationFactors
    };
  };
  
  // Calculate predictions for all drivers
  const predictionsWithFactors = topDrivers.map(calculateDriverPrediction);
  
  // Sort by probability - no need to normalize to 100%, these are independent probabilities
  const sortedPredictions = [...predictionsWithFactors].sort((a, b) => b.probability - a.probability);
  
  // Instead of normalizing to 100%, we'll just use the raw probabilities
  // Each driver has their own individual chance of winning (can be interpreted as "this driver 
  // will win X% of the time if the race were run 100 times with the same conditions")
  const adjustedPredictions = sortedPredictions;
  
  // Generate circuit performance data - needs to be stable between refreshes
  const circuitPerformance = topDrivers.slice(0, 10).map(driver => {
    if (driver.isRookie) {
      return {
        driver: driver.name,
        team: driver.team,
        bestFinish: "N/A",
        avgFinish: "N/A",
        winProbability: adjustedPredictions.find(d => d.name === driver.name)?.probability || 0,
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
      
      // Stable "random" adjustment
      const stableAdjustment = () => {
        const x = Math.sin(circuitDriverSeed) * 10000;
        const rand = x - Math.floor(x); // 0-1 based on seed
        return 0.9 + (rand * 0.2); // 0.9-1.1 adjustment factor
      };
      
      // Better drivers/teams have better finishes with slight deterministic variance
      const adjustment = stableAdjustment();
      const bestFinish = Math.max(1, Math.min(10, Math.floor((1 / combinedRating) * 3 * adjustment)));
      const avgFinish = Math.max(bestFinish, Math.min(15, Math.floor((1 / combinedRating) * 5 * adjustment)));
      
      return {
        driver: driver.name,
        team: driver.team,
        bestFinish: bestFinish,
        avgFinish: avgFinish,
        winProbability: adjustedPredictions.find(d => d.name === driver.name)?.probability || 0
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
  const generateRecentForm = (driver: {name: string}) => {
    const skillRating = driverSkill[driver.name] || 7.0;
    const currentFormRating = currentForm[driver.name] || 6.0;
    const combinedRating = (skillRating * 0.5 + currentFormRating * 0.5) / 10;
    
    // Create a driver-specific seed for stable results
    const driverSeed = raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                     + driver.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Stable random generator for driver form
    const stableRandom = (seed: number, pos: number) => {
      const x = Math.sin((seed + pos * 100)) * 10000;
      return x - Math.floor(x); // Returns value between 0-1
    };
    
    // Generate stable positions based on driver skill and a deterministic "random" factor
    const generateStablePosition = (pos: number) => {
      const mean = Math.max(1, Math.floor(1 / combinedRating * 5));
      const variance = Math.max(1, Math.floor(mean / 2));
      const randomFactor = stableRandom(driverSeed, pos);
      
      // Generate around the mean with predetermined variance based on circuit+driver
      const position = Math.floor(mean + (randomFactor * 2 - 1) * variance);
      return Math.max(1, Math.min(20, position));
    };
    
    // Generate stable last 5 race results
    const lastFive = [0, 1, 2, 3, 4].map(generateStablePosition);
    
    // Determine trend based on last 5 results
    const firstHalf = lastFive.slice(0, 2).reduce((sum, pos) => sum + pos, 0) / 2;
    const secondHalf = lastFive.slice(3, 5).reduce((sum, pos) => sum + pos, 0) / 2;
    
    let trend = "neutral";
    if (secondHalf < firstHalf - 1) trend = "up"; // Lower position numbers are better
    if (secondHalf > firstHalf + 1) trend = "down";
    
    // Calculate form rating (0-100 scale)
    // Higher positions (closer to 1) get higher ratings
    const positionPoints = lastFive.map(pos => Math.max(0, 21 - pos)).reduce((sum, points) => sum + points, 0);
    const maxPoints = 5 * 20; // 5 races * 20 points (maximum for 1st place)
    const driverFormRating = Math.round((positionPoints / maxPoints) * 100);
    
    return {
      lastFive,
      trend,
      formRating: driverFormRating
    };
  };
  
  const driverForm = topDrivers.slice(0, 10).map(driver => {
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
      const form = generateRecentForm(driver);
      return {
        driver: driver.name,
        team: driver.team,
        lastFive: form.lastFive,
        trend: form.trend,
        formRating: form.formRating
      }
    }
  }).sort((a, b) => {
    // Sort non-rookies first by formRating
    if (a.formRating === "N/A" && b.formRating === "N/A") return 0;
    if (a.formRating === "N/A") return 1;
    if (b.formRating === "N/A") return -1;
    return (b.formRating as number) - (a.formRating as number);
  });
  
  // Calculate factor weights for predictions
  const factors = {
    teamStrength: 60,
    driverSkill: 25,
    currentForm: 15,
    // No "other" needed as these sum to 100%
  }
  
  // Calculate confidence based on data quality and consistency
  // Higher if top drivers have significantly higher scores than the rest
  const topScore = adjustedPredictions[0]?.probability || 0;
  const fifthScore = adjustedPredictions[4]?.probability || 0;
  const scoreDifference = topScore - fifthScore;
  
  // More confident when there's a clear separation between top drivers
  const confidence = Math.min(95, Math.max(50, 70 + scoreDifference));
  
  // Create a stable prediction based on the circuit and driver scores
  // This ensures results don't change on every refresh
  const seed = raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const stableRandom = (min: number, max: number, seed: number) => {
    const x = Math.sin(seed) * 10000;
    const rand = x - Math.floor(x);
    return Math.floor(rand * (max - min + 1)) + min;
  };
  
  // Apply stable random adjustments to prevent results changing on refresh
  const stableResults = adjustedPredictions.map((driver, index) => {
    // Use driver name and circuit as seed for stability
    const driverSeed = seed + driver.name.charCodeAt(0) + index;
    // Small random adjustment based on seed (±5%)
    const stableAdjustment = 1 + (stableRandom(-5, 5, driverSeed) / 100);
    // Apply the adjustment but keep the same ordering
    return {
      ...driver,
      probability: Math.min(99, Math.max(1, Math.round(driver.probability * stableAdjustment)))
    };
  }).sort((a, b) => b.probability - a.probability); // Re-sort to maintain proper order
  
  return {
    raceId,
    results: stableResults,
    circuitPerformance,
    driverForm,
    factors,
    confidence: Math.round(confidence)
  }
}
*/