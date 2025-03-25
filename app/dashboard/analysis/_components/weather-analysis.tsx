"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Cloud, CloudRain, Sun, Wind, Thermometer } from "lucide-react"

export default function WeatherAnalysis() {
  const [selectedRace, setSelectedRace] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [availableRaces, setAvailableRaces] = useState<any[]>([])
  
  // Load available races for the current season
  useEffect(() => {
    async function loadRaces() {
      try {
        setIsLoading(true)
        
        // Fetch from racing-data-service API endpoint
        // This will eventually use the OpenF1 API and weather APIs
        const response = await fetch('/api/race-prediction/races');
        const mockRaces = await response.json();
        
        // Sort races by date and filter out past races
        const currentDate = new Date()
        const upcomingRaces = mockRaces
          .filter(race => new Date(race.date) >= currentDate)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
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
  
  const selectedRaceData = availableRaces.find(race => race.id === selectedRace)
  
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
                      availableRaces.map((race) => (
                        <SelectItem key={race.id} value={race.id}>
                          {race.name} - {new Date(race.date).toLocaleDateString()}
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
              <CardTitle>{selectedRaceData.name} Weather Forecast</CardTitle>
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
function WeatherForecast({ forecast }: { forecast: any[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecast.map((day, index) => (
          <Card key={index}>
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
function WeatherImpact({ impact }: { impact: any }) {
  const teamImpactData = Object.entries(impact.teams).map(([team, value]) => ({
    team,
    impact: value
  })).sort((a, b) => b.impact - a.impact)
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expected Weather Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Team Performance in Expected Conditions</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={teamImpactData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="team" width={80} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Performance']} />
                    <Bar dataKey="impact" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Weather Impact Factors</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factor</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Favors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {impact.factors.map((factor: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{factor.name}</TableCell>
                      <TableCell>
                        <Badge variant={factor.level === 'High' ? 'destructive' : factor.level === 'Medium' ? 'secondary' : 'outline'}>
                          {factor.level}
                        </Badge>
                      </TableCell>
                      <TableCell>{factor.favors}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Strategy Adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Tire Strategy</h3>
              <p className="text-sm">{impact.strategy.tires}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Pit Stop Strategy</h3>
              <p className="text-sm">{impact.strategy.pitStops}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Car Setup</h3>
              <p className="text-sm">{impact.strategy.carSetup}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Key Considerations</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {impact.strategy.keyConsiderations.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Component for displaying historical weather data
function HistoricalWeather({ history }: { history: any[] }) {
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
            <TableRow key={year.year}>
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
function WetWeatherPerformance({ driverPerformance }: { driverPerformance: any[] }) {
  // Filter rookies out for the chart, since they don't have meaningful wet vs dry data
  const chartData = driverPerformance.filter(driver => !driver.isRookie);
  
  return (
    <div className="space-y-4">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="driver" />
            <YAxis label={{ value: 'Position Change', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value) => [value > 0 ? `+${value}` : value, 'Avg. Position Change (Wet vs Dry)']}
              labelFormatter={(value) => `${value} (${chartData.find(d => d.driver === value)?.team})`}
            />
            <Legend />
            <Bar dataKey="wetVsDry" fill="#0090FF" name="Position Change in Wet Conditions">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.wetVsDry > 0 ? '#00D2BE' : '#DC0000'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Wet Performance</TableHead>
            <TableHead>Wet Race Wins</TableHead>
            <TableHead>Wet vs Dry</TableHead>
            <TableHead>Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {driverPerformance.map((driver) => (
            <TableRow key={driver.driver}>
              <TableCell className="font-medium">{driver.driver}</TableCell>
              <TableCell>{driver.team}</TableCell>
              <TableCell>
                <Badge 
                  variant={
                    driver.wetPerformance === 'Excellent' ? 'default' : 
                    driver.wetPerformance === 'Good' ? 'secondary' : 
                    driver.wetPerformance === 'Average' ? 'outline' : 
                    driver.wetPerformance === 'Unknown' ? 'outline' : 'destructive'
                  }
                >
                  {driver.wetPerformance}
                </Badge>
              </TableCell>
              <TableCell>{driver.wetWins}</TableCell>
              <TableCell className={
                driver.isRookie ? 'text-gray-500' :
                driver.wetVsDry > 0 ? 'text-green-500' : 'text-red-500'
              }>
                {driver.isRookie ? "N/A" : (driver.wetVsDry > 0 ? `+${driver.wetVsDry}` : driver.wetVsDry)}
              </TableCell>
              <TableCell>
                {driver.rating === "N/A" ? "N/A" : `${driver.rating}/10`}
                {driver.rookieNote && (
                  <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 italic">
                    {driver.rookieNote}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Helper component for weather condition badges
function WeatherConditionBadge({ condition, temp }: { condition: string, temp: number }) {
  let variant = "outline"
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
    <Badge variant={variant as any} className="flex items-center">
      {icon}
      {condition} ({temp}°C)
    </Badge>
  )
}

// Mock weather data generator
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