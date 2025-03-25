"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Trophy } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// Badge will be used in future updates

interface RaceResult {
  round: number;
  name: string;
  winner: string;
  winningTeam: string;
  date: string;
  laps: number;
  time: string;
}

interface ChampionshipProgress {
  round: number;
  race: string;
  [key: string]: number | string;
}

interface ChampionshipStanding {
  position: number;
  name: string;
  team: string;
  points: number;
  wins: number;
  podiums: number;
}

interface ChampionshipData {
  progress: ChampionshipProgress[];
  standings: ChampionshipStanding[];
}

interface Standing {
  position: number;
  name: string;
  points: number;
  wins: number;
  podiums: number;
  team: string;
}

interface KeyMoment {
  championship: string[];
  incidents: string[];
  technical: string[];
}

interface SeasonRecord {
  category: string;
  value: string;
  holder: string;
}

interface SeasonData {
  year: number;
  races: RaceResult[];
  driverChampionship: ChampionshipData;
  constructorChampionship: ChampionshipData;
  keyMoments: KeyMoment;
  statistics: {
    winners: Array<{ name: string; wins: number; team: string }>;
  };
  records: SeasonRecord[];
}

export default function SeasonHistory() {
  const [selectedYear, setSelectedYear] = useState<string>("2023")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null)
  
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
                {(seasonData.records as Array<{category: string; value: string; holder: string}>).map((record) => (
                  <Card key={record.category}>
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
function ChampionshipProgressChart({ title, data }: { title: string; data: ChampionshipProgress[] }) {
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
function WinnersBarChart({ data }: { data: Array<{ name: string; wins: number; team: string }> }) {
  return (
    <div className="w-full h-[250px]">
      <h3 className="text-sm font-medium mb-2">Race Winners Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: 'Wins', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="wins" fill="#3b82f6">
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={getTeamColor(entry.team)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Component for displaying driver standings table
function DriversStandingsTable({ standings }: { standings: Standing[] }) {
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
function ConstructorsStandingsTable({ standings }: { standings: Standing[] }) {
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
function RaceResultsTable({ races }: { races: RaceResult[] }) {
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

function generateMockSeasonData(year: string): SeasonData {
  const yearNum = parseInt(year);
  const races = generateRaceData();
  const championship = generateChampionshipData(races);
  
  return {
    year: yearNum,
    races,
    driverChampionship: championship.driverChampionship,
    constructorChampionship: championship.constructorChampionship,
    keyMoments: generateKeyMoments(yearNum, championship),
    statistics: generateStatistics(championship),
    records: generateSeasonRecords(championship)
  };
}

function generateRaceData(): RaceResult[] {
  const races = [];
  const numRaces = 22;
  
  const gpNames = [
    "Australian Grand Prix", "Bahrain Grand Prix", "Chinese Grand Prix",
    "Azerbaijan Grand Prix", "Miami Grand Prix", "Monaco Grand Prix",
    "Canadian Grand Prix", "Spanish Grand Prix", "Austrian Grand Prix",
    "British Grand Prix", "Hungarian Grand Prix", "Belgian Grand Prix",
    "Dutch Grand Prix", "Italian Grand Prix", "Singapore Grand Prix",
    "United States Grand Prix", "Mexican Grand Prix", "Brazilian Grand Prix",
    "Las Vegas Grand Prix", "Qatar Grand Prix", "Abu Dhabi Grand Prix",
    "Saudi Arabian Grand Prix"
  ];
  
  const teams = [
    "Red Bull", "Ferrari", "Mercedes", "McLaren", 
    "Aston Martin", "Alpine", "Williams", "RB", "Haas F1 Team", "Sauber"
  ];
  
  const drivers = [
    { name: "Max Verstappen", team: "Red Bull" },
    { name: "Lewis Hamilton", team: "Mercedes" },
    { name: "Charles Leclerc", team: "Ferrari" },
    { name: "Lando Norris", team: "McLaren" },
    { name: "Carlos Sainz", team: "Ferrari" },
    { name: "Sergio Perez", team: "Red Bull" },
    { name: "George Russell", team: "Mercedes" },
    { name: "Fernando Alonso", team: "Aston Martin" },
    { name: "Oscar Piastri", team: "McLaren" },
    { name: "Lance Stroll", team: "Aston Martin" }
  ];
  
  // Simulate a dominant team with ~60% win rate, secondary team with ~30%, and occasional others
  const dominantTeamIndex = 0; // Red Bull
  
  for (let i = 0; i < numRaces; i++) {
    const random = Math.random();
    let winner, winningTeam;
    
    if (random < 0.6) {
      // Dominant team wins
      const dominantTeam = teams[dominantTeamIndex];
      const teamDrivers = drivers.filter(d => d.team === dominantTeam);
      winner = teamDrivers[Math.floor(Math.random() * teamDrivers.length)].name;
      winningTeam = dominantTeam;
    } else if (random < 0.9) {
      // Secondary team wins
      const secondaryTeam = teams[(dominantTeamIndex + 1) % teams.length];
      const teamDrivers = drivers.filter(d => d.team === secondaryTeam);
      winner = teamDrivers[Math.floor(Math.random() * teamDrivers.length)].name;
      winningTeam = secondaryTeam;
    } else {
      // Other team wins
      const otherTeam = teams[Math.floor(Math.random() * teams.length)];
      const teamDrivers = drivers.filter(d => d.team === otherTeam);
      winner = teamDrivers[Math.floor(Math.random() * teamDrivers.length)].name;
      winningTeam = otherTeam;
    }
    
    races.push({
      round: i + 1,
      name: gpNames[i % gpNames.length],
      winner,
      winningTeam,
      date: new Date(2024, i, 1).toISOString().split('T')[0],
      laps: 70,
      time: "1:30:00.000"
    });
  }
  
  return races;
}

function generateChampionshipData(races: RaceResult[]): { driverChampionship: ChampionshipData; constructorChampionship: ChampionshipData } {
  // Initialize structures to track points
  const driverPoints: Record<string, number> = {};
  const teamPoints: Record<string, number> = {};
  const driverWins: Record<string, number> = {};
  const teamWins: Record<string, number> = {};
  const driverPodiums: Record<string, number> = {};
  const teamPodiums: Record<string, number> = {};
  
  // Calculate points and statistics for each race
  races.forEach((race) => {
    // Update driver statistics
    driverPoints[race.winner] = (driverPoints[race.winner] || 0) + 25;
    driverWins[race.winner] = (driverWins[race.winner] || 0) + 1;
    driverPodiums[race.winner] = (driverPodiums[race.winner] || 0) + 1;
    
    // Update team statistics
    teamPoints[race.winningTeam] = (teamPoints[race.winningTeam] || 0) + 25;
    teamWins[race.winningTeam] = (teamWins[race.winningTeam] || 0) + 1;
    teamPodiums[race.winningTeam] = (teamPodiums[race.winningTeam] || 0) + 1;
  });
  
  // Generate championship progress data
  const driverProgress: ChampionshipProgress[] = races.map((race, index) => {
    const progress: ChampionshipProgress = {
      round: index + 1,
      race: race.name
    };
    
    // Add cumulative points for each driver
    Object.entries(driverPoints).forEach(([driver, points]) => {
      progress[driver] = points;
    });
    
    return progress;
  });
  
  const teamProgress: ChampionshipProgress[] = races.map((race, index) => {
    const progress: ChampionshipProgress = {
      round: index + 1,
      race: race.name
    };
    
    // Add cumulative points for each team
    Object.entries(teamPoints).forEach(([team, points]) => {
      progress[team] = points;
    });
    
    return progress;
  });
  
  // Generate standings
  const driverStandings: ChampionshipStanding[] = Object.entries(driverPoints)
    .map(([name, points]) => ({
      position: 0, // Will be set later
      name,
      team: races.find(r => r.winner === name)?.winningTeam || "",
      points,
      wins: driverWins[name] || 0,
      podiums: driverPodiums[name] || 0
    }))
    .sort((a, b) => b.points - a.points)
    .map((standing, index) => ({
      ...standing,
      position: index + 1
    }));
  
  const teamStandings: ChampionshipStanding[] = Object.entries(teamPoints)
    .map(([name, points]) => ({
      position: 0, // Will be set later
      name,
      team: name,
      points,
      wins: teamWins[name] || 0,
      podiums: teamPodiums[name] || 0
    }))
    .sort((a, b) => b.points - a.points)
    .map((standing, index) => ({
      ...standing,
      position: index + 1
    }));
  
  return {
    driverChampionship: {
      progress: driverProgress,
      standings: driverStandings
    },
    constructorChampionship: {
      progress: teamProgress,
      standings: teamStandings
    }
  };
}

function generateKeyMoments(year: number, championship: { driverChampionship: ChampionshipData; constructorChampionship: ChampionshipData }): KeyMoment {
  const championDriver = championship.driverChampionship.standings[0].name;
  const championTeam = championship.constructorChampionship.standings[0].name;
  const runnerUpDriver = championship.driverChampionship.standings[1].name;
  const thirdDriver = championship.driverChampionship.standings[2].name;
  
  // Generate championship moments
  const championshipMoments = [
    `${championDriver} secures their ${year} World Championship title`,
    `${runnerUpDriver} finishes as runner-up in the championship`,
    `${thirdDriver} claims third place in the championship`,
    `${championTeam} wins the Constructors' Championship`
  ];
  
  // Generate notable incidents
  const incidents = [
    `Dramatic race at ${year} Monaco Grand Prix`,
    `Controversial finish at ${year} Abu Dhabi Grand Prix`,
    `Multiple safety car periods at ${year} British Grand Prix`,
    `Wet weather chaos at ${year} Dutch Grand Prix`
  ];
  
  // Generate technical developments
  const technical = [
    `${championTeam} introduces major upgrade package`,
    `New tire compounds tested during ${year} season`,
    `Aerodynamic rule changes impact team performance`,
    `Engine development freeze comes into effect`
  ];
  
  return {
    championship: championshipMoments,
    incidents,
    technical
  };
}

function generateStatistics(championship: { driverChampionship: ChampionshipData; constructorChampionship: ChampionshipData }) {
  const winners = championship.driverChampionship.standings
    .filter(standing => standing.wins > 0)
    .map(standing => ({
      name: standing.name,
      wins: standing.wins,
      team: standing.team
    }))
    .sort((a, b) => b.wins - a.wins);
  
  return {
    winners
  };
}

function generateSeasonRecords(championship: { driverChampionship: ChampionshipData; constructorChampionship: ChampionshipData }): SeasonRecord[] {
  const championDriver = championship.driverChampionship.standings[0];
  const championTeam = championship.constructorChampionship.standings[0];
  
  // Find driver with most wins
  const mostWins = championship.driverChampionship.standings.reduce((max, driver) => 
    driver.wins > max ? driver.wins : max, 0);
  
  const mostWinningDriver = championship.driverChampionship.standings.find(driver => driver.wins === mostWins);
  
  // Find team with most wins
  const mostTeamWins = championship.constructorChampionship.standings.reduce((max, team) => 
    team.wins > max ? team.wins : max, 0);
  
  const mostWinningTeam = championship.constructorChampionship.standings.find(team => team.wins === mostTeamWins);
  
  // Find driver with most podiums
  const mostPodiums = championship.driverChampionship.standings.reduce((max, driver) => 
    driver.podiums > max ? driver.podiums : max, 0);
  
  const mostPodiumDriver = championship.driverChampionship.standings.find(driver => driver.podiums === mostPodiums);
  
  // Find team with most podiums
  const mostTeamPodiums = championship.constructorChampionship.standings.reduce((max, team) => 
    team.podiums > max ? team.podiums : max, 0);
  
  const mostPodiumTeam = championship.constructorChampionship.standings.find(team => team.podiums === mostTeamPodiums);
  
  return [
    {
      category: "World Champion",
      value: championDriver.name,
      holder: championDriver.team
    },
    {
      category: "Constructors Champion",
      value: championTeam.name,
      holder: championTeam.team
    },
    {
      category: "Most Race Wins",
      value: `${mostWinningDriver?.wins || 0} wins`,
      holder: `${mostWinningDriver?.name || ""} (${mostWinningDriver?.team || ""})`
    },
    {
      category: "Most Team Wins",
      value: `${mostWinningTeam?.wins || 0} wins`,
      holder: mostWinningTeam?.name || ""
    },
    {
      category: "Most Podiums",
      value: `${mostPodiumDriver?.podiums || 0} podiums`,
      holder: `${mostPodiumDriver?.name || ""} (${mostPodiumDriver?.team || ""})`
    },
    {
      category: "Most Team Podiums",
      value: `${mostPodiumTeam?.podiums || 0} podiums`,
      holder: mostPodiumTeam?.name || ""
    }
  ];
}