"use client"

import { useState, useEffect } from "react"
import { getUserTeamAction } from "@/actions/db/teams-actions"
import { getMarketDriversAction, getMarketConstructorsAction } from "@/actions/db/market-data-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { LineChart, Users, AlertTriangle, Brain, BarChart4, Activity, Calendar, CloudRain } from "lucide-react"
import { SelectTeam, SelectDriver, SelectConstructor, SelectMarketDriver, SelectMarketConstructor } from "@/db/schema"
// Import necessary components
import AIRecommendationsSection from "./_components/ai-recommendations-section"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DriverPerformance from "./analysis/_components/driver-performance"
import TeamAnalysis from "./analysis/_components/team-analysis"
import RacePrediction from "./analysis/_components/race-prediction"
import WeatherAnalysis from "./analysis/_components/weather-analysis"


interface TeamWithMembers extends SelectTeam {
  drivers: SelectDriver[];
  constructors: SelectConstructor[];
}

export default function DashboardPage() {
  const { userId } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [teamResult, setTeamResult] = useState<Record<string, unknown> | null>(null)
  const [marketDrivers, setMarketDrivers] = useState<SelectMarketDriver[]>([])
  const [marketConstructors, setMarketConstructors] = useState<SelectMarketConstructor[]>([])
  // Loading state for data fetching
  const [, setIsLoading] = useState(true)
  const [team, setTeam] = useState<TeamWithMembers | undefined>(undefined)
  
  useEffect(() => {
    async function loadData() {
      if (!userId) return
      
      setIsLoading(true)
      
      try {
        const [teamRes, driversRes, constructorsRes] = await Promise.all([
          getUserTeamAction(userId as string),
          getMarketDriversAction(),
          getMarketConstructorsAction()
        ])
        
        setTeamResult(teamRes)
        
        if (driversRes.isSuccess && driversRes.data) {
          setMarketDrivers(driversRes.data)
        }
        
        if (constructorsRes.isSuccess && constructorsRes.data) {
          setMarketConstructors(constructorsRes.data)
        }
        
        // If team exists, fetch team members
        if (teamRes.isSuccess && teamRes.data) {
          // Fetch team drivers and constructors using server actions
          const teamIdForApi = teamRes.data.id
          const driversRes2 = await fetch(`/api/team/${teamIdForApi}/drivers`)
          const constructorsRes2 = await fetch(`/api/team/${teamIdForApi}/constructors`)
          
          let teamDrivers: SelectDriver[] = []
          let teamConstructors: SelectConstructor[] = []
          
          if (driversRes2.ok) {
            teamDrivers = await driversRes2.json()
          }
          
          if (constructorsRes2.ok) {
            teamConstructors = await constructorsRes2.json()
          }
          
          // Create full team object with members
          setTeam({
            ...teamRes.data,
            drivers: teamDrivers,
            constructors: teamConstructors
          } as TeamWithMembers)
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [userId])
  
  // Get market data for team members with fallback to name matching
  const getMarketDriver = (id: string): SelectMarketDriver | undefined => {
    // First try to find by ID
    const driverById = marketDrivers.find(driver => driver.id === id)
    if (driverById) return driverById
    
    // If not found by ID, try to find by name
    // This helps when the ids don't match between team drivers and market drivers
    const driver = team?.drivers?.find(d => d.id === id)
    if (driver) {
      return marketDrivers.find(md => md.name === driver.name)
    }
    
    return undefined
  }
  
  const getMarketConstructor = (id: string): SelectMarketConstructor | undefined => {
    // First try to find by ID
    const constructorById = marketConstructors.find(constructor => constructor.id === id)
    if (constructorById) return constructorById
    
    // If not found by ID, try to find by name
    const constructor = team?.constructors?.find(c => c.id === id)
    if (constructor) {
      return marketConstructors.find(mc => mc.name === constructor.name)
    }
    
    return undefined
  }
  
  const hasTeam = teamResult?.isSuccess && team !== undefined
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Get an overview of your F1 Fantasy team and historical performance data.
        </p>
      </div>
      
      {!hasTeam ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
              Setup Required
            </CardTitle>
            <CardDescription>
              You need to set up your F1 Fantasy team before we can provide recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/team">
                Set Up Your Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Custom styles for tab list to improve visibility and prevent overlap */}
            <div className="mb-4 overflow-x-auto">
              <TabsList className="inline-flex h-auto min-w-full space-x-1 p-1 md:space-x-2">
                <TabsTrigger 
                  value="overview"
                  className="flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">Overview</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="drivers"
                  className="flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <BarChart4 className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">Drivers</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="constructors"
                  className="flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">Constructors</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="predictions"
                  className="flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">Predictions</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="weather"
                  className="flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <CloudRain className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">Weather</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="recommendations"
                  className="flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <LineChart className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">AI Recommendations</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Team Overview Tab */}
            <TabsContent value="overview" className="pt-4 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Team Value
                    </CardTitle>
                    <LineChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${calculateTeamValue(team)}M
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Budget limit: $100M
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Team Members
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {team?.drivers?.length || 0} Drivers, {team?.constructors?.length || 0} Constructors
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required: 5 Drivers, 2 Constructors
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* My Team Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="mr-2 h-5 w-5 text-primary" />
                    My F1 Fantasy Team
                  </CardTitle>
                  <CardDescription>
                    Your current team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium mb-4">Drivers</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {team?.drivers?.map((driver) => {
                          const marketDriver = getMarketDriver(driver.id)
                          return (
                            <div
                              key={driver.id}
                              className="p-4 border rounded-md"
                            >
                              <div className="flex flex-col items-center text-center space-y-2">
                                {marketDriver?.imageUrl ? (
                                  <Avatar className="h-16 w-16 rounded-full border-2 border-gray-200">
                                    <AvatarImage src={marketDriver.imageUrl} alt={driver.name} />
                                    <AvatarFallback className="text-lg">{driver.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-lg font-medium">
                                    {driver.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-base">{driver.name}</p>
                                  <p className="text-lg font-semibold mt-1">${driver.price.toFixed(1)}M</p>
                                </div>
                                {marketDriver?.team && (
                                  <Badge 
                                    className="mt-1 px-2 py-1"
                                    variant="outline"
                                    style={{ 
                                      backgroundColor: marketDriver.teamColor || "#CBD5E0",
                                      color: "#ffffff",
                                      fontWeight: "medium",
                                      border: "none"
                                    }}
                                  >
                                    {marketDriver.team}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        {(!team?.drivers || team.drivers.length < 5) && (
                          Array(5 - (team?.drivers?.length || 0)).fill(0).map((_, i) => (
                            <div
                              key={`empty-driver-${i}`}
                              className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900 opacity-40"
                            >
                              <div className="flex flex-col items-center text-center space-y-2">
                                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg">
                                  ?
                                </div>
                                <div>
                                  <p className="font-bold text-base">Empty Slot</p>
                                  <p className="text-sm text-muted-foreground mt-1">Select a driver</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium mb-4">Constructors</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {team?.constructors?.map((constructor) => {
                          const marketConstructor = getMarketConstructor(constructor.id)
                          return (
                            <div
                              key={constructor.id}
                              className="p-4 border rounded-md"
                            >
                              <div className="flex items-center gap-4">
                                <div 
                                  className="h-14 w-14 rounded-full flex items-center justify-center font-medium border-2 border-gray-200"
                                  style={{ 
                                    backgroundColor: marketConstructor?.color || "#CBD5E0",
                                    color: "#000000"
                                  }}
                                >
                                  {constructor.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-base">{constructor.name}</p>
                                  <p className="text-lg font-semibold mt-1">${constructor.price.toFixed(1)}M</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        {(!team?.constructors || team.constructors.length < 2) && (
                          Array(2 - (team?.constructors?.length || 0)).fill(0).map((_, i) => (
                            <div
                              key={`empty-constructor-${i}`}
                              className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900 opacity-40"
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg">
                                  ?
                                </div>
                                <div>
                                  <p className="font-bold text-base">Empty Slot</p>
                                  <p className="text-sm text-muted-foreground mt-1">Select a constructor</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button asChild>
                        <Link href="/dashboard/team">
                          Manage Your Team
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Driver Analysis Tab */}
            <TabsContent value="drivers" className="pt-4">
              <DriverPerformance />
            </TabsContent>
            
            {/* Constructor Analysis Tab */}
            <TabsContent value="constructors" className="pt-4">
              <TeamAnalysis />
            </TabsContent>
            
            {/* Race Prediction Tab */}
            <TabsContent value="predictions" className="pt-4">
              <RacePrediction />
            </TabsContent>
            
            {/* Weather Analysis Tab */}
            <TabsContent value="weather" className="pt-4">
              <WeatherAnalysis />
            </TabsContent>
            
            {/* AI Recommendations Tab */}
            <TabsContent value="recommendations" className="pt-4">
              {team && team.drivers.length > 0 && team.constructors.length > 0 && (
                <AIRecommendationsSection 
                  team={team}
                  marketDrivers={marketDrivers}
                  marketConstructors={marketConstructors}
                />
              )}
              
              {(!team || team.drivers.length === 0 || team.constructors.length === 0) && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Complete Your Team First</h3>
                    <p className="text-muted-foreground">You need to select 5 drivers and 2 constructors before we can provide AI recommendations.</p>
                    <Button className="mt-4" asChild>
                      <Link href="/dashboard/team">
                        Complete Your Team
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function calculateTeamValue(team: TeamWithMembers | undefined): number {
  if (!team) return 0
  
  const driverTotal = team.drivers?.reduce((sum: number, driver: SelectDriver) => sum + driver.price, 0) || 0
  const constructorTotal = team.constructors?.reduce((sum: number, constructor: SelectConstructor) => sum + constructor.price, 0) || 0
  
  return parseFloat((driverTotal + constructorTotal).toFixed(1))
} 