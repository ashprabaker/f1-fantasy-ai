"use server"

import { getUserTeamAction } from "@/actions/db/teams-actions"
import { getMarketDriversAction, getMarketConstructorsAction } from "@/actions/db/market-data-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { LineChart, Users, AlertTriangle, Brain } from "lucide-react"
import { SelectTeam, SelectDriver, SelectConstructor, SelectMarketDriver, SelectMarketConstructor } from "@/db/schema"
import { db } from "@/db/db"
import { driversTable, constructorsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import AIRecommendationsSection from "./_components/ai-recommendations-section"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"


interface TeamWithMembers extends SelectTeam {
  drivers: SelectDriver[];
  constructors: SelectConstructor[];
}

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }
  
  const [teamResult, driversResult, constructorsResult] = await Promise.all([
    getUserTeamAction(userId),
    getMarketDriversAction(),
    getMarketConstructorsAction()
  ])
  
  const hasTeam = teamResult.isSuccess && teamResult.data
  const marketDrivers = driversResult.isSuccess && driversResult.data ? driversResult.data : []
  const marketConstructors = constructorsResult.isSuccess && constructorsResult.data ? constructorsResult.data : []
  
  // Fetch team members if team exists
  let teamDrivers: SelectDriver[] = []
  let teamConstructors: SelectConstructor[] = []
  
  if (hasTeam && teamResult.data) {
    const teamId = teamResult.data.id
    
    // Fetch team drivers and constructors
    const [drivers, constructors] = await Promise.all([
      db.select().from(driversTable).where(eq(driversTable.teamId, teamId)),
      db.select().from(constructorsTable).where(eq(constructorsTable.teamId, teamId))
    ])
    
    teamDrivers = drivers as SelectDriver[]
    teamConstructors = constructors as SelectConstructor[]
  }
  
  // Create full team object with members
  const team = hasTeam && teamResult.data ? {
    ...teamResult.data,
    drivers: teamDrivers,
    constructors: teamConstructors
  } as TeamWithMembers : undefined
  
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
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Get an overview of your F1 Fantasy team and AI-powered recommendations.
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
          
          {/* AI Recommendations Section */}
          {team && team.drivers.length > 0 && team.constructors.length > 0 && (
            <AIRecommendationsSection 
              team={team}
              marketDrivers={marketDrivers}
              marketConstructors={marketConstructors}
            />
          )}
          
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
              {hasTeam ? (
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
                                    color: "#000000",
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
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">You haven&apos;t set up your team yet</p>
                  <Button asChild>
                    <Link href="/dashboard/team">
                      Set Up Your Team
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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