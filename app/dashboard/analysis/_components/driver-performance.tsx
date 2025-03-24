"use client"

import { useState, useEffect } from "react"
import { getDriverPerformanceAction } from "@/actions/db/market-data-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DriverSelector } from "./driver-selector"
import PerformanceChart from "./performance-chart"
import DriverStatsTable from "./driver-stats-table"
import CircuitPerformance from "./circuit-performance"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DriverPerformance() {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [performanceData, setPerformanceData] = useState<any>(null)
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
  
  // Load driver performance data when a driver or year is selected
  useEffect(() => {
    async function loadDriverData() {
      if (!selectedDriver) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        console.log(`Fetching data for driver: ${selectedDriver}, year: ${selectedYear}`)
        const result = await getDriverPerformanceAction(selectedDriver, selectedYear)
        if (result.isSuccess && result.data) {
          setPerformanceData(result.data)
        } else {
          setError(result.message || "Failed to load driver data")
        }
      } catch (err) {
        setError("An error occurred while fetching driver data")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDriverData()
  }, [selectedDriver, selectedYear])
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historical Driver Analysis</CardTitle>
          <CardDescription>
            Select a driver and season to view historical F1 performance statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Driver</label>
              <DriverSelector onSelect={setSelectedDriver} selectedYear={selectedYear} />
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
              <CardTitle>{performanceData.driverInfo.name}</CardTitle>
              <CardDescription>
                {performanceData.driverInfo.team} | {performanceData.driverInfo.nationality} | {
                  // If selected year is future and we don't have data, show current year
                  selectedYear > new Date().getFullYear() && !performanceData.seasonData.length
                    ? `${new Date().getFullYear()} Season (No ${selectedYear} data yet)`
                    : `${selectedYear} Season`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="seasons">Season Comparison</TabsTrigger>
                  <TabsTrigger value="circuits">Circuit Performance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                      title="Season Position" 
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
                      <CardTitle className="text-base">Recent Form</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PerformanceChart data={performanceData.recentForm} />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="seasons" className="pt-4">
                  <DriverStatsTable data={performanceData.seasonData} />
                </TabsContent>
                
                <TabsContent value="circuits" className="pt-4">
                  <CircuitPerformance data={performanceData.circuitPerformance} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
      
      {!isLoading && !performanceData && !error && selectedDriver && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No data available for the selected driver</p>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !performanceData && !error && !selectedDriver && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Select a driver to view performance data</p>
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