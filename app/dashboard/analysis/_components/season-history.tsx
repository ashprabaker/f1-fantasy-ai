"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Trophy, Medal } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function SeasonHistory() {
  const [selectedYear, setSelectedYear] = useState<string>("2023")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seasonData, setSeasonData] = useState<any>(null)
  
  // Available years for historical data
  const availableYears = Array.from({ length: 2024 - 1950 + 1 }, (_, i) => (2024 - i).toString())
  
  // Load season data when year changes
  useEffect(() => {
    async function loadSeasonData() {
      try {
        setIsLoading(true)
        setError(null)
        
        // In a real app, this would fetch data from Ergast API
        // For now, we'll generate mock data
        const mockData = generateMockSeasonData(selectedYear)
        setSeasonData(mockData)
      } catch (error) {
        console.error("Error loading season data:", error)
        setError(`Failed to load ${selectedYear} season data`)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSeasonData()
  }, [selectedYear])
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>F1 Championship History</CardTitle>
              <CardDescription>
                Review past Formula 1 seasons and championship battles
              </CardDescription>
            </div>
            <div className="w-full md:w-48">
              <Select 
                value={selectedYear} 
                onValueChange={setSelectedYear}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year} Season
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
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
          <Skeleton className="h-[400px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      )}
      
      {!isLoading && seasonData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                {selectedYear} Championship Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="drivers" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="drivers">Drivers Championship</TabsTrigger>
                  <TabsTrigger value="constructors">Constructors Championship</TabsTrigger>
                </TabsList>
                
                <TabsContent value="drivers" className="pt-4 space-y-4">
                  <ChampionshipProgressChart
                    title="Drivers Championship Progress"
                    data={seasonData.driverChampionship.progress}
                  />
                  
                  <DriversStandingsTable standings={seasonData.driverChampionship.standings} />
                </TabsContent>
                
                <TabsContent value="constructors" className="pt-4 space-y-4">
                  <ChampionshipProgressChart
                    title="Constructors Championship Progress"
                    data={seasonData.constructorChampionship.progress}
                  />
                  
                  <ConstructorsStandingsTable standings={seasonData.constructorChampionship.standings} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Season Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <WinnersBarChart data={seasonData.statistics.winners} />
                  <RaceResultsTable races={seasonData.races} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Season Moments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Championship Decisive Moments</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {seasonData.keyMoments.championship.map((moment: string, index: number) => (
                        <li key={index} className="text-sm">{moment}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Notable Racing Incidents</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {seasonData.keyMoments.incidents.map((incident: string, index: number) => (
                        <li key={index} className="text-sm">{incident}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Technical Developments</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {seasonData.keyMoments.technical.map((item: string, index: number) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Season Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {seasonData.records.map((record: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">{record.category}</h3>
                        <div className="text-lg font-bold">{record.value}</div>
                        <p className="text-sm text-muted-foreground mt-2">{record.holder}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {!isLoading && !seasonData && !error && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Select a year to view season history</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Component for displaying championship progression chart
function ChampionshipProgressChart({ title, data }: { title: string, data: any[] }) {
  return (
    <div className="w-full h-[400px]">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="round" label={{ value: 'Race', position: 'insideBottomRight', offset: -5 }} />
          <YAxis label={{ value: 'Points', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {Object.keys(data[0])
            .filter(key => key !== 'round' && key !== 'race')
            .map((dataKey, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={dataKey}
                stroke={getColorForIndex(index)}
                strokeWidth={dataKey.includes('Champion') ? 3 : 1.5}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Component for displaying winner distribution bar chart
function WinnersBarChart({ data }: { data: any[] }) {
  return (
    <div className="w-full h-[250px]">
      <h3 className="text-sm font-medium mb-2">Race Winners Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: 'Wins', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Bar dataKey="wins" fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getTeamColor(entry.team)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Component for displaying driver standings table
function DriversStandingsTable({ standings }: { standings: any[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Pos</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">Wins</TableHead>
            <TableHead className="text-right">Podiums</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((driver, index) => (
            <TableRow key={index} className={index === 0 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
              <TableCell className="font-bold">{index + 1}</TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  {index === 0 && <Trophy className="h-4 w-4 mr-1 text-yellow-500" />}
                  {driver.name}
                </div>
              </TableCell>
              <TableCell>
                <div 
                  className="w-3 h-3 rounded-full inline-block mr-2" 
                  style={{ backgroundColor: getTeamColor(driver.team) }}
                />
                {driver.team}
              </TableCell>
              <TableCell className="text-right">{driver.wins}</TableCell>
              <TableCell className="text-right">{driver.podiums}</TableCell>
              <TableCell className="text-right font-bold">{driver.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Component for displaying constructor standings table
function ConstructorsStandingsTable({ standings }: { standings: any[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Pos</TableHead>
            <TableHead>Constructor</TableHead>
            <TableHead className="text-right">Wins</TableHead>
            <TableHead className="text-right">Podiums</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((constructor, index) => (
            <TableRow key={index} className={index === 0 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
              <TableCell className="font-bold">{index + 1}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  {index === 0 && <Trophy className="h-4 w-4 mr-1 text-yellow-500" />}
                  <div 
                    className="w-3 h-3 rounded-full inline-block mr-2" 
                    style={{ backgroundColor: getTeamColor(constructor.name) }}
                  />
                  <span className="font-medium">{constructor.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">{constructor.wins}</TableCell>
              <TableCell className="text-right">{constructor.podiums}</TableCell>
              <TableCell className="text-right font-bold">{constructor.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Component for displaying race results table
function RaceResultsTable({ races }: { races: any[] }) {
  return (
    <div className="max-h-[300px] overflow-y-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead className="w-12">Round</TableHead>
            <TableHead>Grand Prix</TableHead>
            <TableHead>Winner</TableHead>
            <TableHead>Team</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {races.map((race, index) => (
            <TableRow key={index}>
              <TableCell>{race.round}</TableCell>
              <TableCell className="font-medium">{race.name}</TableCell>
              <TableCell>{race.winner}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full inline-block mr-2" 
                    style={{ backgroundColor: getTeamColor(race.winningTeam) }}
                  />
                  {race.winningTeam}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Helper function to get color for chart lines
function getColorForIndex(index: number): string {
  const colors = [
    "#0600EF", // Red Bull blue
    "#DC0000", // Ferrari red
    "#00D2BE", // Mercedes teal
    "#FF8700", // McLaren orange
    "#006F62", // Aston Martin green
    "#0090FF", // Alpine/Williams blue
    "#900000", // Alfa Romeo/Sauber maroon
    "#2B4562", // AlphaTauri navy
    "#B6BABD", // Haas silver
    "#005AFF", // Williams blue
    "#F596C8", // Racing Point pink
    "#FFF500", // Renault yellow
    "#469BFF", // Toro Rosso blue
  ]
  
  return colors[index % colors.length]
}

// Helper function to get team colors
function getTeamColor(team: string): string {
  const teamColors: Record<string, string> = {
    'Red Bull': '#0600EF',
    'Ferrari': '#DC0000',
    'Mercedes': '#00D2BE',
    'McLaren': '#FF8700',
    'Aston Martin': '#006F62',
    'Alpine': '#0090FF',
    'Williams': '#005AFF',
    'RB': '#2B4562',
    'Haas F1 Team': '#B6BABD',
    'Alfa Romeo': '#900000',
    'Racing Point': '#F596C8',
    'Renault': '#FFF500',
    'Toro Rosso': '#469BFF',
    'AlphaTauri': '#2B4562',
    'Sauber': '#900000',
  }
  
  // Match partial team names
  for (const [key, value] of Object.entries(teamColors)) {
    if (team.includes(key)) return value
  }
  
  return '#666666' // Default color
}

// Mock data generator
function generateMockSeasonData(year: string) {
  const seasonYear = parseInt(year)
  
  // Driver and constructor data for different eras
  const getCompetitorsForEra = (year: number) => {
    if (year >= 2022) {
      return {
        drivers: [
          { name: "Max Verstappen", team: "Red Bull" },
          { name: "Lewis Hamilton", team: "Mercedes" },
          { name: "Charles Leclerc", team: "Ferrari" },
          { name: "Lando Norris", team: "McLaren" },
          { name: "Carlos Sainz", team: "Ferrari" },
          { name: "Sergio Perez", team: "Red Bull" },
          { name: "George Russell", team: "Mercedes" },
          { name: "Fernando Alonso", team: "Aston Martin" },
          { name: "Oscar Piastri", team: "McLaren" },
          { name: "Lance Stroll", team: "Aston Martin" },
        ],
        teams: [
          "Red Bull", "Ferrari", "Mercedes", "McLaren", 
          "Aston Martin", "Alpine", "Williams", "RB", "Haas F1 Team", "Sauber"
        ]
      }
    } else if (year >= 2019) {
      return {
        drivers: [
          { name: "Lewis Hamilton", team: "Mercedes" },
          { name: "Max Verstappen", team: "Red Bull" },
          { name: "Valtteri Bottas", team: "Mercedes" },
          { name: "Charles Leclerc", team: "Ferrari" },
          { name: "Sebastian Vettel", team: "Ferrari" },
          { name: "Daniel Ricciardo", team: "Renault" },
          { name: "Lando Norris", team: "McLaren" },
          { name: "Carlos Sainz", team: "McLaren" },
          { name: "Alex Albon", team: "Red Bull" },
          { name: "Pierre Gasly", team: "Toro Rosso" },
        ],
        teams: [
          "Mercedes", "Red Bull", "Ferrari", "McLaren", 
          "Renault", "Racing Point", "AlphaTauri", "Alfa Romeo", "Haas F1 Team", "Williams"
        ]
      }
    } else if (year >= 2014) {
      return {
        drivers: [
          { name: "Lewis Hamilton", team: "Mercedes" },
          { name: "Sebastian Vettel", team: "Ferrari" },
          { name: "Valtteri Bottas", team: "Mercedes" },
          { name: "Kimi Raikkonen", team: "Ferrari" },
          { name: "Daniel Ricciardo", team: "Red Bull" },
          { name: "Max Verstappen", team: "Red Bull" },
          { name: "Nico Rosberg", team: "Mercedes" },
          { name: "Fernando Alonso", team: "McLaren" },
          { name: "Sergio Perez", team: "Force India" },
          { name: "Felipe Massa", team: "Williams" },
        ],
        teams: [
          "Mercedes", "Ferrari", "Red Bull", "Williams", 
          "Force India", "McLaren", "Toro Rosso", "Haas F1 Team", "Renault", "Sauber"
        ]
      }
    } else if (year >= 2010) {
      return {
        drivers: [
          { name: "Sebastian Vettel", team: "Red Bull" },
          { name: "Fernando Alonso", team: "Ferrari" },
          { name: "Lewis Hamilton", team: "McLaren" },
          { name: "Mark Webber", team: "Red Bull" },
          { name: "Jenson Button", team: "McLaren" },
          { name: "Felipe Massa", team: "Ferrari" },
          { name: "Nico Rosberg", team: "Mercedes" },
          { name: "Michael Schumacher", team: "Mercedes" },
          { name: "Kimi Raikkonen", team: "Lotus" },
          { name: "Sergio Perez", team: "Sauber" },
        ],
        teams: [
          "Red Bull", "Ferrari", "McLaren", "Mercedes", 
          "Lotus", "Force India", "Sauber", "Toro Rosso", "Williams", "Caterham"
        ]
      }
    } else if (year >= 2000) {
      return {
        drivers: [
          { name: "Michael Schumacher", team: "Ferrari" },
          { name: "Fernando Alonso", team: "Renault" },
          { name: "Kimi Raikkonen", team: "McLaren" },
          { name: "Rubens Barrichello", team: "Ferrari" },
          { name: "Juan Pablo Montoya", team: "Williams" },
          { name: "Jenson Button", team: "BAR" },
          { name: "David Coulthard", team: "McLaren" },
          { name: "Ralf Schumacher", team: "Williams" },
          { name: "Felipe Massa", team: "Ferrari" },
          { name: "Giancarlo Fisichella", team: "Renault" },
        ],
        teams: [
          "Ferrari", "McLaren", "Renault", "Williams", 
          "BAR", "Toyota", "Red Bull", "Sauber", "Jordan", "Minardi"
        ]
      }
    } else {
      return {
        drivers: [
          { name: "Ayrton Senna", team: "McLaren" },
          { name: "Alain Prost", team: "Ferrari" },
          { name: "Michael Schumacher", team: "Benetton" },
          { name: "Damon Hill", team: "Williams" },
          { name: "Nigel Mansell", team: "Williams" },
          { name: "Mika Hakkinen", team: "McLaren" },
          { name: "Jacques Villeneuve", team: "Williams" },
          { name: "David Coulthard", team: "McLaren" },
          { name: "Gerhard Berger", team: "Ferrari" },
          { name: "Jean Alesi", team: "Ferrari" },
        ],
        teams: [
          "McLaren", "Williams", "Ferrari", "Benetton", 
          "Tyrrell", "Jordan", "Ligier", "Minardi", "Sauber", "Lotus"
        ]
      }
    }
  }
  
  const { drivers, teams } = getCompetitorsForEra(seasonYear)
  
  // Generate realistic race data based on the era
  const generateRaceData = () => {
    const races = []
    const numRaces = seasonYear >= 2021 ? 22 : 
                    seasonYear >= 2016 ? 20 : 
                    seasonYear >= 2010 ? 19 : 
                    seasonYear >= 2000 ? 17 : 16
    
    const gpNames = [
      "Australian Grand Prix", "Bahrain Grand Prix", "Chinese Grand Prix", 
      "Spanish Grand Prix", "Monaco Grand Prix", "Canadian Grand Prix", 
      "French Grand Prix", "Austrian Grand Prix", "British Grand Prix",
      "German Grand Prix", "Hungarian Grand Prix", "Belgian Grand Prix",
      "Italian Grand Prix", "Singapore Grand Prix", "Russian Grand Prix",
      "Japanese Grand Prix", "United States Grand Prix", "Mexican Grand Prix",
      "Brazilian Grand Prix", "Abu Dhabi Grand Prix", "Saudi Arabian Grand Prix",
      "Miami Grand Prix", "Qatar Grand Prix"
    ]
    
    // Simulate a dominant team with ~60% win rate, secondary team with ~30%, and occasional others
    let dominantTeamIndex = 0
    if (seasonYear >= 2022) dominantTeamIndex = 0 // Red Bull
    else if (seasonYear >= 2014) dominantTeamIndex = seasonYear >= 2017 ? 0 : 2 // Mercedes
    else if (seasonYear >= 2010) dominantTeamIndex = 0 // Red Bull
    else if (seasonYear >= 2000) dominantTeamIndex = 0 // Ferrari
    else dominantTeamIndex = Math.floor(Math.random() * 2) // McLaren or Williams
    
    const dominantTeam = teams[dominantTeamIndex]
    const secondaryTeam = teams[dominantTeamIndex === 0 ? 1 : 0]
    
    // Get drivers from the dominant team
    const dominantDrivers = drivers.filter(d => d.team === dominantTeam)
    const secondaryDrivers = drivers.filter(d => d.team === secondaryTeam)
    
    for (let i = 0; i < numRaces; i++) {
      // Determine winning team with probabilities
      const rng = Math.random()
      let winningTeam
      let winner
      
      if (rng < 0.6) {
        // Dominant team wins
        winningTeam = dominantTeam
        winner = dominantDrivers[Math.floor(Math.random() * dominantDrivers.length)].name
      } else if (rng < 0.9) {
        // Secondary team wins
        winningTeam = secondaryTeam
        winner = secondaryDrivers[Math.floor(Math.random() * secondaryDrivers.length)].name
      } else {
        // Random other team wins (upset)
        const otherTeams = teams.filter(t => t !== dominantTeam && t !== secondaryTeam)
        winningTeam = otherTeams[Math.floor(Math.random() * otherTeams.length)]
        const upsettingDrivers = drivers.filter(d => d.team === winningTeam)
        winner = upsettingDrivers.length > 0 
          ? upsettingDrivers[0].name 
          : drivers[Math.floor(Math.random() * drivers.length)].name
      }
      
      races.push({
        round: i + 1,
        name: gpNames[i % gpNames.length],
        winner,
        winningTeam
      })
    }
    
    return races
  }
  
  const races = generateRaceData()
  
  // Generate championship data
  const generateChampionshipData = (races: any[]) => {
    // Initialize structures to track points
    const driverPoints: Record<string, number> = {}
    const driverWins: Record<string, number> = {}
    const driverPodiums: Record<string, number> = {}
    const teamPoints: Record<string, number> = {}
    const teamWins: Record<string, number> = {}
    const teamPodiums: Record<string, number> = {}
    
    drivers.forEach(driver => {
      driverPoints[driver.name] = 0
      driverWins[driver.name] = 0
      driverPodiums[driver.name] = 0
    })
    
    teams.forEach(team => {
      teamPoints[team] = 0
      teamWins[team] = 0
      teamPodiums[team] = 0
    })
    
    // Generate progression data
    const driverProgress = races.map((race, index) => {
      const raceResult = generateRaceResults(race, drivers, teams)
      
      // Update points
      raceResult.forEach((result, position) => {
        // Basic F1 points system (simplified)
        let points = 0
        if (position === 0) {
          points = 25
          driverWins[result.driver]++
          teamWins[result.team]++
          driverPodiums[result.driver]++
          teamPodiums[result.team]++
        } else if (position === 1) {
          points = 18
          driverPodiums[result.driver]++
          teamPodiums[result.team]++
        } else if (position === 2) {
          points = 15
          driverPodiums[result.driver]++
          teamPodiums[result.team]++
        } else if (position === 3) {
          points = 12
        } else if (position === 4) {
          points = 10
        } else if (position === 5) {
          points = 8
        } else if (position === 6) {
          points = 6
        } else if (position === 7) {
          points = 4
        } else if (position === 8) {
          points = 2
        } else if (position === 9) {
          points = 1
        }
        
        driverPoints[result.driver] += points
        teamPoints[result.team] += points
      })
      
      // Create progress entry
      const progressEntry: Record<string, any> = {
        round: race.round,
        race: race.name
      }
      
      // Add top 5 drivers to progress
      const topDrivers = Object.entries(driverPoints)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
      
      topDrivers.forEach(([driver], i) => {
        progressEntry[i === 0 ? `${driver} (Champion)` : driver] = driverPoints[driver]
      })
      
      // Return progress entry for this race
      return progressEntry
    })
    
    // Create team progress data
    const teamProgress = races.map((race, index) => {
      const progressEntry: Record<string, any> = {
        round: race.round,
        race: race.name
      }
      
      // Add top 5 teams to progress
      const topTeams = Object.entries(teamPoints)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
      
      topTeams.forEach(([team], i) => {
        progressEntry[i === 0 ? `${team} (Champion)` : team] = teamPoints[team]
      })
      
      return progressEntry
    })
    
    // Create final standings
    const driverStandings = Object.entries(driverPoints)
      .map(([name, points]) => ({
        name,
        team: drivers.find(d => d.name === name)?.team || "",
        points,
        wins: driverWins[name],
        podiums: driverPodiums[name]
      }))
      .sort((a, b) => b.points - a.points)
    
    const teamStandings = Object.entries(teamPoints)
      .map(([name, points]) => ({
        name,
        points,
        wins: teamWins[name],
        podiums: teamPodiums[name]
      }))
      .sort((a, b) => b.points - a.points)
    
    return {
      driverChampionship: {
        progress: driverProgress,
        standings: driverStandings
      },
      constructorChampionship: {
        progress: teamProgress,
        standings: teamStandings
      }
    }
  }
  
  // Generate race results for a single race
  function generateRaceResults(race: any, drivers: any[], teams: any[]) {
    // Create a shuffled copy of drivers with preference for the winning driver
    const raceResults = [...drivers]
      .sort(() => Math.random() - 0.5)
      .map(driver => ({
        driver: driver.name,
        team: driver.team
      }))
    
    // Ensure the race winner is in first position
    const winnerIndex = raceResults.findIndex(result => result.driver === race.winner)
    if (winnerIndex !== -1) {
      const winner = raceResults.splice(winnerIndex, 1)[0]
      raceResults.unshift(winner)
    }
    
    return raceResults
  }
  
  // Generate key moments and technical developments for the season
  function generateKeyMoments(year: number, championship: any) {
    const championDriver = championship.driverChampionship.standings[0].name
    const championTeam = championship.constructorChampionship.standings[0].name
    const runnerUpDriver = championship.driverChampionship.standings[1].name
    const thirdDriver = championship.driverChampionship.standings[2].name
    
    // Generate championship moments
    const championshipMoments = [
      `${championDriver} secured the championship after a decisive victory at the ${races[Math.floor(races.length * 0.8)].name}.`,
      `${runnerUpDriver}'s DNF at the ${races[Math.floor(races.length * 0.7)].name} proved costly in the championship battle.`,
      `${championTeam}'s mid-season upgrades provided a significant performance advantage from ${races[Math.floor(races.length * 0.4)].name} onwards.`,
      `${thirdDriver} had an impressive run of ${Math.floor(Math.random() * 3) + 2} consecutive podiums in the middle of the season.`
    ]
    
    // Generate random racing incidents
    const incidents = [
      `First lap collision between ${runnerUpDriver} and ${thirdDriver} at the ${races[Math.floor(Math.random() * races.length)].name}.`,
      `Controversial stewards decision penalizing ${championship.driverChampionship.standings[Math.floor(Math.random() * 3) + 3].name} for track limits at the ${races[Math.floor(Math.random() * races.length)].name}.`,
      `${championship.driverChampionship.standings[Math.floor(Math.random() * 5)].name}'s dramatic last-lap tire failure while leading the ${races[Math.floor(Math.random() * races.length)].name}.`,
      `Safety car deployment after multi-car incident at the ${races[Math.floor(Math.random() * races.length)].name} first corner.`
    ]
    
    // Generate era-specific technical developments
    let technical = []
    if (year >= 2022) {
      technical = [
        `Teams adapted to the new ground effect regulations with various floor and sidepod designs.`,
        `${championTeam} pioneered innovative DRS activation system that improved straight-line speed.`,
        `Multiple teams struggled with porpoising issues in early races.`,
        `FIA introduced technical directive to address flexing floors mid-season.`
      ]
    } else if (year >= 2014) {
      technical = [
        `${championTeam}'s power unit proved dominant with superior energy recovery systems.`,
        `Teams focused on optimizing the complex hybrid power units.`,
        `Several teams introduced major aerodynamic upgrade packages at the European races.`,
        `New front wing regulations impacted aerodynamic philosophies.`
      ]
    } else if (year >= 2009) {
      technical = [
        `Double diffuser innovations gave several teams early season advantages.`,
        `${championTeam} pioneered effective use of the F-duct system.`,
        `Flexible front wings became a major technical controversy.`,
        `Engine freeze regulations led to focus on aerodynamic development.`
      ]
    } else {
      technical = [
        `${championTeam} introduced revolutionary aerodynamic concept with their new front wing design.`,
        `Electronic driver aids became a major factor in car performance.`,
        `Several teams struggled with reliability issues throughout the season.`,
        `Tire war between manufacturers led to specialized compounds for different teams.`
      ]
    }
    
    return {
      championship: championshipMoments,
      incidents,
      technical
    }
  }
  
  // Generate statistics based on race results
  function generateStatistics(championship: any) {
    // Extract winners data for chart
    const winners = championship.driverChampionship.standings
      .filter((driver: any) => driver.wins > 0)
      .map((driver: any) => ({
        name: driver.name,
        team: driver.team,
        wins: driver.wins
      }))
      .sort((a: any, b: any) => b.wins - a.wins)
    
    return {
      winners
    }
  }
  
  // Generate season records
  function generateSeasonRecords(championship: any, races: any[]) {
    const championDriver = championship.driverChampionship.standings[0]
    const championTeam = championship.constructorChampionship.standings[0]
    
    // Find driver with most poles (use the race winner as a proxy since we don't track qualifying)
    const polesByDriver: Record<string, number> = {}
    races.forEach(race => {
      polesByDriver[race.winner] = (polesByDriver[race.winner] || 0) + 1
    })
    
    const driverWithMostPoles = Object.entries(polesByDriver)
      .sort(([,a], [,b]) => b - a)[0]
    
    // Find team with most 1-2 finishes (just an estimate)
    const estimatedOneTwo = Math.floor(championTeam.wins * 0.3)
    
    // Generate records
    return [
      {
        category: "Most Race Wins",
        value: `${championDriver.wins} wins`,
        holder: championDriver.name
      },
      {
        category: "Most Pole Positions",
        value: `${driverWithMostPoles[1]} poles`,
        holder: driverWithMostPoles[0]
      },
      {
        category: "Highest Points Total",
        value: `${championDriver.points} pts`,
        holder: championDriver.name
      },
      {
        category: "Constructor Wins",
        value: `${championTeam.wins} wins`,
        holder: championTeam.name
      },
      {
        category: "Team 1-2 Finishes",
        value: `${estimatedOneTwo} races`,
        holder: championTeam.name
      },
      {
        category: "Championship Margin",
        value: `${championship.driverChampionship.standings[0].points - championship.driverChampionship.standings[1].points} pts`,
        holder: `${championDriver.name} over ${championship.driverChampionship.standings[1].name}`
      }
    ]
  }
  
  // Generate complete season data
  const championship = generateChampionshipData(races)
  const keyMoments = generateKeyMoments(seasonYear, championship)
  const statistics = generateStatistics(championship)
  const records = generateSeasonRecords(championship, races)
  
  return {
    year: seasonYear,
    races,
    driverChampionship: championship.driverChampionship,
    constructorChampionship: championship.constructorChampionship,
    keyMoments,
    statistics,
    records
  }
}