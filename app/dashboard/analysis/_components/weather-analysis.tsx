"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Cloud, CloudRain, Sun, Wind, Thermometer } from "lucide-react"

interface WeatherForecastDay {
  day: string;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Partly Cloudy';
  temperature: number;
  tempLow: number;
  tempHigh: number;
  precipitation: number;
  precipProbability: number;
  windSpeed: number;
  humidity: number;
}

interface WeatherFactor {
  name: string;
  level: string;
  favors: string;
}

interface HistoricalWeatherData {
  year: number;
  condition: string;
  temperature: number;
  winner: string;
  notes: string;
  raceWeather: string;
  raceTemp: number;
  qualifyingWeather: string;
  qualifyingTemp: number;
  practiceWeather: string;
  practiceTemp: number;
}

interface DriverWetPerformance {
  driver: string;
  team: string;
  wetSkill?: number;
  isRookie: boolean;
  wetResults?: {
    position: number;
    race: string;
    year: number;
  }[];
  dryVsWet?: {
    condition: string;
    avgPosition: number;
  }[];
  wetVsDry: {
    condition: string;
    value: number;
  }[] | number;
  wetPerformance: {
    rating: number | string;
    strengths: string[];
    weaknesses?: string[];
    notable: string[];
    improvement: string[];
  };
  wetWins: number;
  rookieNote?: string;
  rating?: number | string;
}

interface Race {
  raceId: string;
  raceName: string;
  date: string;
  circuit: string;
}

interface WeatherData {
  forecast: WeatherForecastDay[];
  impact: WeatherImpactData;
  historical: HistoricalWeatherData[];
  driverWetPerformance: DriverWetPerformance[];
}

interface WeatherImpactData {
  temperature?: {
    impact: string;
    details: string;
  };
  precipitation?: {
    impact: string;
    details: string;
  };
  wind?: {
    impact: string;
    details: string;
  };
  strategy: {
    recommendation?: string;
    details?: string;
    tires: string | string[];
    pitStops: string | string[];
    carSetup: string | string[];
    keyConsiderations: string[];
  };
  teams: Record<string, number>;
  factors: WeatherFactor[];
}

export default function WeatherAnalysis() {
  const [selectedRace, setSelectedRace] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [availableRaces, setAvailableRaces] = useState<Race[]>([])
  
  // Load available races for the current season
  useEffect(() => {
    async function loadRaces() {
      try {
        setIsLoading(true)
        
        // Use our dedicated weather analysis races endpoint
        const response = await fetch('/api/weather-analysis/races');
        const races = await response.json();
        
        if (!Array.isArray(races)) {
          throw new Error("Invalid race data format");
        }
        
        // Sort races by date and filter out past races
        const currentDate = new Date()
        const upcomingRaces = races
          .filter((race: Race) => new Date(race.date) >= currentDate)
          .sort((a: Race, b: Race) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
        setAvailableRaces(upcomingRaces)
        
        // Auto-select the next race
        if (upcomingRaces.length > 0) {
          setSelectedRace(upcomingRaces[0].raceId)
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
  
  // Fetch weather data when a race is selected
  useEffect(() => {
    async function fetchWeatherData() {
      if (!selectedRace) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch from API endpoint that will eventually connect to weather services
        const response = await fetch(`/api/weather-analysis/${selectedRace}`);
        if (!response.ok) {
          throw new Error('Failed to fetch weather analysis data');
        }
        const weatherData = await response.json();
        setWeatherData(weatherData);
      } catch (error) {
        console.error("Error fetching weather data:", error)
        setError("Failed to fetch weather data")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchWeatherData()
  }, [selectedRace])
  
  // Handler for refreshing weather data
  const handleRefreshWeather = async () => {
    if (selectedRace) {
      setIsLoading(true);
      try {
        // Fetch weather data with cache-busting parameter
        const response = await fetch(`/api/weather-analysis/${selectedRace}?refresh=${Date.now()}`);
        if (!response.ok) {
          throw new Error('Failed to refresh weather analysis data');
        }
        const refreshedData = await response.json();
        setWeatherData(refreshedData);
      } catch (error) {
        console.error("Error refreshing weather data:", error);
        setError("Failed to refresh weather data");
      } finally {
        setIsLoading(false);
      }
    }
  }
  
  const selectedRaceData = availableRaces.find(race => race.raceId === selectedRace)
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weather Analysis</CardTitle>
          <CardDescription>
            Analyze weather patterns and their impact on race performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Race</label>
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
                      availableRaces.map((race, index) => (
                        <SelectItem key={`race-${race.raceId}-${index}`} value={race.raceId}>
                          {race.raceName} - {new Date(race.date).toLocaleDateString()}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem key="loading-item" value="loading" disabled>Loading races...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleRefreshWeather}
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
        </div>
      )}
      
      {!isLoading && weatherData && selectedRaceData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{selectedRaceData.raceName} Weather Forecast</CardTitle>
              <CardDescription>
                {selectedRaceData.circuit} - Race date: {new Date(selectedRaceData.date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="forecast" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="forecast">Race Weekend Forecast</TabsTrigger>
                  <TabsTrigger value="impact">Performance Impact</TabsTrigger>
                  <TabsTrigger value="history">Historical Weather</TabsTrigger>
                </TabsList>
                
                <TabsContent value="forecast" className="pt-4 space-y-4">
                  <WeatherForecast forecast={weatherData.forecast} />
                </TabsContent>
                
                <TabsContent value="impact" className="pt-4">
                  <WeatherImpact impact={weatherData.impact} />
                </TabsContent>
                
                <TabsContent value="history" className="pt-4">
                  <HistoricalWeather history={weatherData.historical} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Driver Wet Weather Performance</CardTitle>
              <CardDescription>
                How drivers perform in wet conditions compared to dry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WetWeatherPerformance driverPerformance={weatherData.driverWetPerformance} />
            </CardContent>
          </Card>
        </div>
      )}
      
      {!isLoading && !weatherData && !error && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Select a race to view weather analysis</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Component for displaying weather forecast
function WeatherForecast({ forecast }: { forecast: WeatherForecastDay[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecast.map((day, index) => (
          <Card key={`forecast-day-${index}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-medium mb-2">{day.day}</h3>
                <div className="flex justify-center mb-2">
                  {day.condition === 'Sunny' && <Sun className="h-12 w-12 text-yellow-500" />}
                  {day.condition === 'Cloudy' && <Cloud className="h-12 w-12 text-gray-500" />}
                  {day.condition === 'Rain' && <CloudRain className="h-12 w-12 text-blue-500" />}
                  {day.condition === 'Partly Cloudy' && (
                    <div className="relative">
                      <Sun className="h-12 w-12 text-yellow-500" />
                      <Cloud className="h-8 w-8 text-gray-500 absolute bottom-0 right-0" />
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold">{day.condition}</div>
                <div className="flex justify-center items-center gap-1 mt-2">
                  <Thermometer className="h-4 w-4" />
                  <span className="text-lg">
                    {day.tempLow}°C - {day.tempHigh}°C
                  </span>
                </div>
                <div className="flex justify-center items-center gap-1 mt-1">
                  <Wind className="h-4 w-4" />
                  <span>{day.windSpeed} km/h</span>
                </div>
                <div className="mt-2">
                  <Badge variant={day.precipProbability > 50 ? "destructive" : "outline"}>
                    {day.precipProbability}% chance of rain
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={forecast}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" orientation="left" label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Precipitation (%)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="tempHigh" stroke="#FF8700" name="High Temp" />
                <Line yAxisId="left" type="monotone" dataKey="tempLow" stroke="#00D2BE" name="Low Temp" />
                <Line yAxisId="right" type="monotone" dataKey="precipProbability" stroke="#0090FF" name="Rain Chance" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Component for displaying weather impact on performance
function WeatherImpact({ impact }: { impact: WeatherImpactData }) {
  // Create default values for fields that might be missing
  const temperatureData = impact.temperature || { impact: "Temperature will affect tire degradation", details: "Teams will need to monitor track temperatures" };
  const precipitationData = impact.precipitation || { impact: "Dry conditions expected", details: "Standard tire strategies likely"};
  const windData = impact.wind || { impact: "Moderate winds expected", details: "Some effect on aerodynamics in high-speed corners" };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                <h3 className="font-medium">Temperature Impact</h3>
              </div>
              <p className="text-sm">{temperatureData.impact}</p>
              <p className="text-sm text-muted-foreground">{temperatureData.details}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CloudRain className="h-5 w-5" />
                <h3 className="font-medium">Precipitation Impact</h3>
              </div>
              <p className="text-sm">{precipitationData.impact}</p>
              <p className="text-sm text-muted-foreground">{precipitationData.details}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wind className="h-5 w-5" />
                <h3 className="font-medium">Wind Impact</h3>
              </div>
              <p className="text-sm">{windData.impact}</p>
              <p className="text-sm text-muted-foreground">{windData.details}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Key Weather Factors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {impact.factors.map((factor, index) => (
            <Card key={`factor-${index}`}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{factor.name}</h4>
                    <Badge variant={factor.level === 'High' ? 'destructive' : 'default'}>
                      {factor.level} Impact
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Favors: {factor.favors}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strategy Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Overview</h3>
            <p className="text-sm">{impact.strategy.recommendation}</p>
            <p className="text-sm text-muted-foreground mt-2">{impact.strategy.details}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Tire Strategy</h3>
              <p className="text-sm">{Array.isArray(impact.strategy.tires) ? impact.strategy.tires.join(', ') : impact.strategy.tires}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Pit Stop Strategy</h3>
              <p className="text-sm">{Array.isArray(impact.strategy.pitStops) ? impact.strategy.pitStops.join(', ') : impact.strategy.pitStops}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Car Setup</h3>
              <p className="text-sm">{Array.isArray(impact.strategy.carSetup) ? impact.strategy.carSetup.join(', ') : impact.strategy.carSetup}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Key Considerations</h3>
              <ul className="text-sm list-disc pl-5">
                {impact.strategy.keyConsiderations.map((consideration, idx) => (
                  <li key={`consideration-${idx}`}>{consideration}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for displaying historical weather data
function HistoricalWeather({ history }: { history: HistoricalWeatherData[] }) {
  return (
    <div className="space-y-6">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={history}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="raceTemp" fill="#FF8700" name="Race Day Temp (°C)" />
            <Bar dataKey="rainedDuringWeekend" fill="#0090FF" name="Rain During Weekend" />
            <Bar dataKey="rainedDuringRace" fill="#0600EF" name="Rain During Race" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead>Race Day Weather</TableHead>
            <TableHead>Qualifying Weather</TableHead>
            <TableHead>Practice Weather</TableHead>
            <TableHead>Winner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((year) => (
            <TableRow key={`year-${year.year}`}>
              <TableCell className="font-medium">{year.year}</TableCell>
              <TableCell>
                <WeatherConditionBadge condition={year.raceWeather} temp={year.raceTemp} />
              </TableCell>
              <TableCell>
                <WeatherConditionBadge condition={year.qualifyingWeather} temp={year.qualifyingTemp} />
              </TableCell>
              <TableCell>
                <WeatherConditionBadge condition={year.practiceWeather} temp={year.practiceTemp} />
              </TableCell>
              <TableCell>{year.winner}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Component for displaying driver wet weather performance
function WetWeatherPerformance({ driverPerformance }: { driverPerformance: DriverWetPerformance[] }) {
  // Filter rookies out for the chart
  const chartData = driverPerformance.filter(driver => !driver.isRookie);
  
  return (
    <div className="space-y-6">
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="driver" />
            <YAxis label={{ value: 'Performance Delta', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey={(driver: DriverWetPerformance) => {
                if (typeof driver.wetVsDry === 'number') {
                  return driver.wetVsDry;
                }
                return Array.isArray(driver.wetVsDry) ? 
                  driver.wetVsDry.find(d => d.condition === 'wet')?.value || 0 : 0;
              }}
              fill="#3b82f6" 
              name="Wet vs Dry Performance"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {driverPerformance.map((driver) => (
          <Card key={`driver-${driver.driver}`}>
            <CardHeader>
              <CardTitle className="text-lg">{driver.driver}</CardTitle>
              <CardDescription>{driver.team}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Wet Weather Rating</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: typeof driver.wetPerformance.rating === 'number' ? 
                        `${driver.wetPerformance.rating * 10}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {typeof driver.wetPerformance.rating === 'number' ? 
                      `${driver.wetPerformance.rating}/10` : 
                      driver.wetPerformance.rating || "N/A"
                    }
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Wet Weather Strengths</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {driver.wetPerformance.strengths.map((strength, i) => (
                    <li key={`${driver.driver}-strength-${i}`} className="text-sm">{strength}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Areas for Improvement</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {driver.wetPerformance.improvement.map((area, i) => (
                    <li key={`${driver.driver}-improvement-${i}`} className="text-sm">{area}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Notable Wet Weather Performances</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {driver.wetPerformance.notable.map((performance, i) => (
                    <li key={`${driver.driver}-notable-${i}`} className="text-sm">{performance}</li>
                  ))}
                </ul>
              </div>
              
              <div className="pt-2">
                <Badge variant="secondary">
                  {driver.wetWins} Wet Race {driver.wetWins === 1 ? 'Win' : 'Wins'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper component for weather condition badges
function WeatherConditionBadge({ condition, temp }: { condition: string, temp: number }) {
  let variant: 'outline' | 'secondary' | 'destructive' | 'default' = "outline"
  let icon = null
  
  switch (condition) {
    case "Sunny":
      variant = "secondary"
      icon = <Sun className="h-3 w-3 mr-1" />
      break
    case "Cloudy":
      variant = "outline"
      icon = <Cloud className="h-3 w-3 mr-1" />
      break
    case "Rain":
    case "Heavy Rain":
      variant = "destructive"
      icon = <CloudRain className="h-3 w-3 mr-1" />
      break
    case "Partly Cloudy":
      variant = "default"
      icon = <Cloud className="h-3 w-3 mr-1" />
      break
  }
  
  return (
    <Badge variant={variant} className="flex items-center">
      {icon}
      {condition} ({temp}°C)
    </Badge>
  )
}

/* Removing unused function as it's not needed in production code
function generateMockWeatherData(raceId: string) {
  // Climate mapping for realistic weather patterns based on location and time of year
  const locationClimates: Record<string, any> = {
    "bahrain": { hot: true, rainy: false, season: "spring" },
    "saudi-arabia": { hot: true, rainy: false, season: "spring" },
    "australia": { temperate: true, rainy: true, season: "autumn" },
    "japan": { temperate: true, rainy: true, season: "spring" },
    "china": { temperate: true, rainy: true, season: "spring" },
    "miami": { hot: true, rainy: true, season: "spring" },
    "imola": { temperate: true, rainy: true, season: "spring" },
    "monaco": { temperate: true, rainy: true, season: "spring" },
    "canada": { temperate: true, rainy: true, season: "summer" },
    "spain": { hot: true, rainy: false, season: "summer" },
    "austria": { temperate: true, rainy: true, season: "summer" },
    "britain": { temperate: true, rainy: true, season: "summer" },
    "hungary": { hot: true, rainy: true, season: "summer" },
    "belgium": { temperate: true, rainy: true, season: "summer" },
    "netherlands": { temperate: true, rainy: true, season: "summer" },
    "italy": { hot: true, rainy: false, season: "summer" },
    "azerbaijan": { hot: true, rainy: false, season: "autumn" },
    "singapore": { hot: true, rainy: true, season: "autumn" },
    "usa": { temperate: true, rainy: false, season: "autumn" },
    "mexico": { temperate: true, rainy: false, season: "autumn" },
    "brazil": { hot: true, rainy: true, season: "spring" },
    "vegas": { temperate: true, rainy: false, season: "autumn" },
    "qatar": { hot: true, rainy: false, season: "winter" },
    "abudhabi": { hot: true, rainy: false, season: "winter" },
  }
  
  // Get climate info for the selected race
  const climate = locationClimates[raceId] || { temperate: true, rainy: false, season: "summer" }
  
  // Generate a realistic temperature range based on climate
  const getTempRange = () => {
    if (climate.hot) {
      return { low: 25 + Math.floor(Math.random() * 5), high: 30 + Math.floor(Math.random() * 10) }
    } else if (climate.temperate) {
      return { low: 15 + Math.floor(Math.random() * 5), high: 20 + Math.floor(Math.random() * 10) }
    } else {
      return { low: 5 + Math.floor(Math.random() * 5), high: 10 + Math.floor(Math.random() * 10) }
    }
  }
  
  // Generate rain probability based on climate
  const getRainProbability = () => {
    if (climate.rainy) {
      return 30 + Math.floor(Math.random() * 50)
    } else {
      return Math.floor(Math.random() * 20)
    }
  }
  
  // Generate weather condition based on rain probability
  const getWeatherCondition = (rainProb: number) => {
    if (rainProb > 70) return "Rain"
    if (rainProb > 40) return "Partly Cloudy"
    if (rainProb > 20) return "Cloudy"
    return "Sunny"
  }
  
  // Generate forecast for race weekend
  const generateForecast = () => {
    const days = ["Practice 1", "Practice 2", "Practice 3", "Qualifying", "Race Day"]
    
    return days.map(day => {
      const tempRange = getTempRange()
      const precipProbability = getRainProbability()
      
      return {
        day,
        tempLow: tempRange.low,
        tempHigh: tempRange.high,
        precipProbability,
        condition: getWeatherCondition(precipProbability),
        windSpeed: 5 + Math.floor(Math.random() * 15)
      }
    })
  }
  
  // Generate historical weather data
  const generateHistoricalData = () => {
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i - 1)
    
    return years.map(year => {
      const raceTemp = climate.hot ? 
        25 + Math.floor(Math.random() * 10) : 
        climate.temperate ? 
          15 + Math.floor(Math.random() * 15) : 
          5 + Math.floor(Math.random() * 10)
      
      const qualifyingTemp = raceTemp + Math.floor(Math.random() * 5) - 2
      const practiceTemp = raceTemp + Math.floor(Math.random() * 5) - 2
      
      const rainedDuringWeekend = climate.rainy ? Math.random() > 0.5 ? 1 : 0 : Math.random() > 0.8 ? 1 : 0
      const rainedDuringRace = rainedDuringWeekend && Math.random() > 0.5 ? 1 : 0
      
      const getCondition = (rained: boolean, temp: number) => {
        if (rained && Math.random() > 0.5) return "Rain"
        if (rained) return "Partly Cloudy"
        if (temp > 25) return "Sunny"
        return "Cloudy"
      }
      
      const raceWeather = getCondition(rainedDuringRace === 1, raceTemp)
      const qualifyingWeather = getCondition(rainedDuringWeekend === 1 && Math.random() > 0.5, qualifyingTemp)
      const practiceWeather = getCondition(rainedDuringWeekend === 1 && Math.random() > 0.5, practiceTemp)
      
      // Top drivers for realistic mock data
      const topDrivers = [
        "Max Verstappen", "Lewis Hamilton", "Charles Leclerc", "Lando Norris",
        "Carlos Sainz", "Sergio Perez", "George Russell", "Fernando Alonso"
      ]
      
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
        winner: topDrivers[Math.floor(Math.random() * topDrivers.length)]
      }
    })
  }
  
  // Generate driver wet weather performance data
  const generateDriverWetPerformance = () => {
    const drivers = [
      { driver: "Max Verstappen", team: "Red Bull Racing", wetPerformance: "Excellent", wetWins: 5, wetVsDry: 2.3, rating: 9, isRookie: false },
      { driver: "Sergio Perez", team: "Red Bull Racing", wetPerformance: "Average", wetWins: 1, wetVsDry: -0.2, rating: 6, isRookie: false },
      { driver: "Lewis Hamilton", team: "Ferrari", wetPerformance: "Excellent", wetWins: 11, wetVsDry: 3.1, rating: 10, isRookie: false },
      { driver: "Charles Leclerc", team: "Ferrari", wetPerformance: "Good", wetWins: 1, wetVsDry: 0.8, rating: 7, isRookie: false },
      { driver: "Lando Norris", team: "McLaren", wetPerformance: "Good", wetWins: 0, wetVsDry: 1.2, rating: 8, isRookie: false },
      { driver: "Oscar Piastri", team: "McLaren", wetPerformance: "Average", wetWins: 0, wetVsDry: 0.2, rating: 6, isRookie: false },
      { driver: "George Russell", team: "Mercedes", wetPerformance: "Good", wetWins: 0, wetVsDry: 1.0, rating: 7, isRookie: false },
      { driver: "Carlos Sainz", team: "Mercedes", wetPerformance: "Good", wetWins: 1, wetVsDry: 0.5, rating: 7, isRookie: false },
      { driver: "Fernando Alonso", team: "Aston Martin", wetPerformance: "Excellent", wetWins: 4, wetVsDry: 2.5, rating: 9, isRookie: false },
      { driver: "Lance Stroll", team: "Aston Martin", wetPerformance: "Poor", wetWins: 0, wetVsDry: -1.5, rating: 4, isRookie: false },
      { driver: "Pierre Gasly", team: "Alpine", wetPerformance: "Average", wetWins: 0, wetVsDry: -0.3, rating: 6, isRookie: false },
      { driver: "Esteban Ocon", team: "Alpine", wetPerformance: "Average", wetWins: 1, wetVsDry: 0.1, rating: 6, isRookie: false },
      { driver: "Alexander Albon", team: "Williams", wetPerformance: "Good", wetWins: 0, wetVsDry: 0.7, rating: 7, isRookie: false },
      { driver: "Franco Colapinto", team: "Williams", wetPerformance: "Unknown", wetWins: 0, wetVsDry: 0, rating: "N/A", isRookie: true, rookieNote: "Limited F1 wet weather data" },
      { driver: "Yuki Tsunoda", team: "RB", wetPerformance: "Average", wetWins: 0, wetVsDry: -0.1, rating: 5, isRookie: false },
      { driver: "Liam Lawson", team: "RB", wetPerformance: "Unknown", wetWins: 0, wetVsDry: 0, rating: "N/A", isRookie: true, rookieNote: "Limited F1 wet weather data" },
      { driver: "Nico Hulkenberg", team: "Sauber", wetPerformance: "Good", wetWins: 0, wetVsDry: 0.8, rating: 7, isRookie: false },
      { driver: "Valtteri Bottas", team: "Sauber", wetPerformance: "Average", wetWins: 0, wetVsDry: 0.1, rating: 6, isRookie: false },
      { driver: "Oliver Bearman", team: "Haas F1 Team", wetPerformance: "Unknown", wetWins: 0, wetVsDry: 0, rating: "N/A", isRookie: true, rookieNote: "Limited F1 wet weather data" },
      { driver: "Kevin Magnussen", team: "Haas F1 Team", wetPerformance: "Average", wetWins: 0, wetVsDry: -0.4, rating: 5, isRookie: false }
    ]
    
    // Add some randomness to the performance metrics, but handle rookies differently
    return drivers.map(driver => {
      if (driver.isRookie) {
        return {
          ...driver,
          // No change to rookie values
        };
      } else {
        return {
          ...driver,
          wetVsDry: parseFloat((driver.wetVsDry + (Math.random() * 0.6 - 0.3)).toFixed(1)),
          rating: Math.min(10, Math.max(1, (driver.rating as number) + Math.floor(Math.random() * 3) - 1))
        };
      }
    })
  }
  
  // Generate weather impact data
  const generateWeatherImpact = () => {
    const forecast = generateForecast()
    const raceDay = forecast.find(day => day.day === "Race Day")
    const isWet = raceDay && raceDay.precipProbability > 50
    
    // Team performance in wet/dry conditions
    const teamImpact = {
      "Red Bull Racing": isWet ? 85 : 95,
      "Ferrari": isWet ? 75 : 90,
      "Mercedes": isWet ? 90 : 85,
      "McLaren": isWet ? 80 : 88,
      "Aston Martin": isWet ? 70 : 75,
      "Alpine": isWet ? 60 : 65,
      "Williams": isWet ? 65 : 55,
      "RB": isWet ? 50 : 60,
      "Haas F1 Team": isWet ? 45 : 55,
      "Sauber": isWet ? 40 : 45
    }
    
    // Add some randomness to team performance
    Object.keys(teamImpact).forEach(team => {
      teamImpact[team] = Math.min(100, Math.max(10, teamImpact[team] + Math.floor(Math.random() * 10) - 5))
    })
    
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
    ]
    
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
    }
    
    return {
      teams: teamImpact,
      factors: weatherFactors,
      strategy: strategyRecommendations
    }
  }
  
  // Return compiled weather data
  return {
    forecast: generateForecast(),
    historical: generateHistoricalData(),
    driverWetPerformance: generateDriverWetPerformance(),
    impact: generateWeatherImpact()
  }
}
*/