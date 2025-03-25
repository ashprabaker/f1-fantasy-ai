"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamSelector } from "./team-selector"
import TeamPerformanceChart from "./team-performance-chart"
import DriverContribution from "./driver-contribution"
import TeamStatsTable from "./team-stats-table"
import { getConstructorPerformanceAction } from "@/actions/db/market-data-actions"

// Define proper types for team performance data
interface TeamInfo {
  id: string;
  name: string;
  color: string;
  nationality: string;
}

interface TeamStats {
  championships: number;
  wins: number;
  podiums: number;
  points: number;
  poles: number;
  fastestLaps: number;
}

interface RaceResult {
  round: string;
  raceName: string;
  circuitName: string;
  date: string;
  grid: number;
  position: number;
  points: number;
}

// Different RaceResult format used by performance chart
interface ChartRaceResult {
  race: string;
  position: number;
  points: number;
  date: string;
}

interface DriverContributionData {
  name: string;       // Name instead of driver to match DriverData
  points: number;
  wins: number;       // Required by DriverData
  podiums: number;    // Required by DriverData
  percentage?: number; // Keep as optional
}

interface TeamPerformanceData {
  teamInfo: TeamInfo;
  stats: TeamStats;
  seasonResults: RaceResult[];
  raceResults: ChartRaceResult[];  // Different format specifically for the chart
  driverContribution: DriverContributionData[];
  seasonComparison: {
    year: number;
    points: number;
    position: number;
    wins: number;
  }[];
  seasonData: {
    year: number;
    points: number;
    position: number;
    wins: number;
    podiums: number;
  }[];
}

export default function TeamAnalysis() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [performanceData, setPerformanceData] = useState<TeamPerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  
  // Generate available years
  useEffect(() => {
    // Create array of the last 10 years (with available data)
    const currentYear = new Date().getFullYear()
    const years = []
    // F1 data available from 1950 onwards
    const startYear = Math.max(1950, currentYear - 10)
    // Only include years up to current year (no future years)
    for (let year = Math.min(currentYear, 2024); year >= startYear; year--) {
      years.push(year)
    }
    setAvailableYears(years)
  }, [])
  
  // Load team performance data when a team or year is selected
  useEffect(() => {
    async function loadTeamData() {
      if (!selectedTeam) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        console.log(`Fetching data for team: ${selectedTeam}, year: ${selectedYear}`)
        const result = await getConstructorPerformanceAction(selectedTeam, selectedYear)
        
        if (result.isSuccess && result.data) {
          setPerformanceData(result.data as TeamPerformanceData)
        } else {
          setError("Failed to load team data")
        }
      } catch (err) {
        setError("An error occurred while fetching team data")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTeamData()
  }, [selectedTeam, selectedYear])
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historical Constructor Analysis</CardTitle>
          <CardDescription>
            Select a team and season to view historical F1 performance statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Constructor</label>
              <TeamSelector onSelect={setSelectedTeam} selectedYear={selectedYear} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Season</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year} Season
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
          </div>
          <Skeleton className="h-[200px] w-full" />
        </div>
      )}
      
      {!isLoading && performanceData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: performanceData.teamInfo.color || "#666" }}
                  />
                  {performanceData.teamInfo.name}
                </div>
              </CardTitle>
              <CardDescription>
                {selectedYear} Season
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="seasons">Season Comparison</TabsTrigger>
                  <TabsTrigger value="drivers">Driver Contribution</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                      title="Constructor Position" 
                      value={performanceData.seasonData[0]?.position || "-"}
                      subtitle={`${performanceData.seasonData[0]?.year || ""}`}
                    />
                    <StatCard 
                      title="Points" 
                      value={performanceData.seasonData[0]?.points || "0"}
                      subtitle={`${performanceData.seasonData[0]?.year || ""}`}
                    />
                    <StatCard 
                      title="Wins/Podiums" 
                      value={`${performanceData.seasonData[0]?.wins || "0"}/${performanceData.seasonData[0]?.podiums || "0"}`}
                      subtitle={`${performanceData.seasonData[0]?.year || ""}`}
                    />
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Season Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TeamPerformanceChart data={performanceData.raceResults} />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="seasons" className="pt-4">
                  <TeamStatsTable data={performanceData.seasonData} />
                </TabsContent>
                
                <TabsContent value="drivers" className="pt-4">
                  <DriverContribution data={performanceData.driverContribution} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
      
      {!isLoading && !performanceData && !error && selectedTeam && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No data available for the selected team</p>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !performanceData && !error && !selectedTeam && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Select a team to view performance data</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ title, value, subtitle }: { title: string, value: string | number, subtitle?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

