"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createTeamAction, updateTeamAction } from "@/actions/db/teams-actions"
import { addDriverAction, removeDriverAction, addConstructorAction, removeConstructorAction } from "@/actions/db/team-members-actions"
import { generateTeamRecommendationsAction } from "@/actions/ai-recommendation-actions"
import { toast } from "sonner"
import { SelectTeam, SelectMarketDriver, SelectMarketConstructor, SelectDriver, SelectConstructor } from "@/db/schema"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"

interface TeamEditorProps {
  userId: string
  team?: SelectTeam
  marketDrivers: SelectMarketDriver[]
  marketConstructors: SelectMarketConstructor[]
  teamDrivers: SelectDriver[]
  teamConstructors: SelectConstructor[]
}

export function TeamEditor({ 
  userId, 
  team, 
  marketDrivers, 
  marketConstructors,
  teamDrivers = [],
  teamConstructors = []
}: TeamEditorProps) {
  // State for selected drivers and constructors
  const [drivers, setDrivers] = useState<SelectDriver[]>([])
  const [constructors, setConstructors] = useState<SelectConstructor[]>([])
  
  // State for filtered market data
  const [filteredDrivers, setFilteredDrivers] = useState<SelectMarketDriver[]>(marketDrivers)
  const [filteredConstructors, setFilteredConstructors] = useState<SelectMarketConstructor[]>(marketConstructors)
  
  // State for search inputs
  const [driverSearch, setDriverSearch] = useState("")
  const [constructorSearch, setConstructorSearch] = useState("")
  
  // State for budget calculation
  const [budget, setBudget] = useState(100)
  const [remainingBudget, setRemainingBudget] = useState(100)
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false)

  // Initialize with the user's existing team members
  useEffect(() => {
    if (teamDrivers.length > 0 || teamConstructors.length > 0) {
      setDrivers(teamDrivers)
      setConstructors(teamConstructors)
    }
  }, [teamDrivers, teamConstructors])
  
  // Filter drivers based on search input
  useEffect(() => {
    if (driverSearch) {
      const filtered = marketDrivers.filter(driver => 
        driver.name.toLowerCase().includes(driverSearch.toLowerCase())
      )
      setFilteredDrivers(filtered)
    } else {
      setFilteredDrivers(marketDrivers)
    }
  }, [driverSearch, marketDrivers])
  
  // Filter constructors based on search input
  useEffect(() => {
    if (constructorSearch) {
      const filtered = marketConstructors.filter(constructor => 
        constructor.name.toLowerCase().includes(constructorSearch.toLowerCase())
      )
      setFilteredConstructors(filtered)
    } else {
      setFilteredConstructors(marketConstructors)
    }
  }, [constructorSearch, marketConstructors])
  
  // Calculate remaining budget
  useEffect(() => {
    const driverCost = drivers.reduce((sum, driver) => sum + driver.price, 0)
    const constructorCost = constructors.reduce((sum, constructor) => sum + constructor.price, 0)
    const totalCost = driverCost + constructorCost
    setRemainingBudget(parseFloat((budget - totalCost).toFixed(1)))
  }, [drivers, constructors, budget])
  
  // Toggle driver selection
  const toggleDriverSelection = (driver: SelectMarketDriver) => {
    const isAtLimit = drivers.length >= 5 && !isDriverSelected(driver.id)
    
    if (isAtLimit) {
      toast.error("You can only select 5 drivers")
      return
    }
    
    if (isDriverSelected(driver.id)) {
      // Remove the driver
      const updatedDrivers = drivers.filter(d => d.id !== driver.id)
      setDrivers(updatedDrivers)
    } else {
      // Check if adding this driver would exceed the budget
      const driverCost = drivers.reduce((sum, d) => sum + d.price, 0)
      const constructorCost = constructors.reduce((sum, c) => sum + c.price, 0)
      const totalCost = driverCost + constructorCost + driver.price
      
      if (totalCost > budget) {
        toast.error("Adding this driver would exceed your budget")
        return
      }
      
      // Add the driver
      const newDriver: SelectDriver = {
        id: driver.id,
        teamId: team?.id || uuidv4(),
        name: driver.name,
        price: driver.price,
        points: driver.points || 0,
        isSelected: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setDrivers([...drivers, newDriver])
    }
  }
  
  // Toggle constructor selection
  const toggleConstructorSelection = (constructor: SelectMarketConstructor) => {
    const isAtLimit = constructors.length >= 2 && !isConstructorSelected(constructor.id)
    
    if (isAtLimit) {
      toast.error("You can only select 2 constructors")
      return
    }
    
    if (isConstructorSelected(constructor.id)) {
      // Remove the constructor
      const updatedConstructors = constructors.filter(c => c.id !== constructor.id)
      setConstructors(updatedConstructors)
    } else {
      // Check if adding this constructor would exceed the budget
      const driverCost = drivers.reduce((sum, d) => sum + d.price, 0)
      const constructorCost = constructors.reduce((sum, c) => sum + c.price, 0)
      const totalCost = driverCost + constructorCost + constructor.price
      
      if (totalCost > budget) {
        toast.error("Adding this constructor would exceed your budget")
        return
      }
      
      // Add the constructor
      const newConstructor: SelectConstructor = {
        id: constructor.id,
        teamId: team?.id || uuidv4(),
        name: constructor.name,
        price: constructor.price,
        points: constructor.points || 0,
        isSelected: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setConstructors([...constructors, newConstructor])
    }
  }
  
  // Check if a driver is selected
  const isDriverSelected = (id: string) => {
    return drivers.some(driver => driver.id === id)
  }
  
  // Check if a constructor is selected
  const isConstructorSelected = (id: string) => {
    return constructors.some(constructor => constructor.id === id)
  }
  
  // Get market driver details with fallback to name matching
  const getMarketDriver = (id: string): SelectMarketDriver | undefined => {
    // First try to find by ID
    const driverById = marketDrivers.find(driver => driver.id === id)
    if (driverById) return driverById
    
    // If not found by ID, try to find by name
    const driver = drivers.find(d => d.id === id)
    if (driver) {
      return marketDrivers.find(md => md.name === driver.name)
    }
    
    return undefined
  }
  
  // Get market constructor details with fallback to name matching
  const getMarketConstructor = (id: string): SelectMarketConstructor | undefined => {
    // First try to find by ID
    const constructorById = marketConstructors.find(constructor => constructor.id === id)
    if (constructorById) return constructorById
    
    // If not found by ID, try to find by name
    const constructor = constructors.find(c => c.id === id)
    if (constructor) {
      return marketConstructors.find(mc => mc.name === constructor.name)
    }
    
    return undefined
  }
  
  // Save the team to the database
  const saveTeam = async () => {
    if (drivers.length !== 5) {
      toast.error("You must select exactly 5 drivers")
      return
    }
    
    if (constructors.length !== 2) {
      toast.error("You must select exactly 2 constructors")
      return
    }
    
    if (remainingBudget < 0) {
      toast.error("You have exceeded your budget")
      return
    }
    
    setIsLoading(true)
    
    try {
      let teamId = team?.id
      
      // If no team exists, create one
      if (!team) {
        const result = await createTeamAction({
          userId,
          name: "My F1 Fantasy Team",
        })
        
        if (result.isSuccess && result.data) {
          teamId = result.data.id
          toast.success("Team created successfully")
        } else {
          toast.error(result.message || "Failed to create team")
          setIsLoading(false)
          return
        }
      }
      
      // Add or update drivers
      for (const driver of drivers) {
        const driverData = {
          ...driver,
          teamId: teamId as string
        }
        
        await addDriverAction(driverData)
      }
      
      // Add or update constructors
      for (const constructor of constructors) {
        const constructorData = {
          ...constructor,
          teamId: teamId as string
        }
        
        await addConstructorAction(constructorData)
      }
      
      toast.success("Team saved successfully")
    } catch (error) {
      console.error("Error saving team:", error)
      toast.error("An error occurred while saving the team")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Team Builder</CardTitle>
          <CardDescription>
            Select 5 drivers and 2 constructors. Budget: ${budget.toFixed(1)}M
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Selected Drivers ({drivers.length}/5)</h3>
              {drivers.length > 0 ? (
                <div className="space-y-2">
                  {drivers.map(driver => {
                    const marketDriver = getMarketDriver(driver.id)
                    return (
                      <div key={driver.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          {marketDriver?.imageUrl ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={marketDriver.imageUrl} alt={driver.name} />
                              <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                              {driver.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium">{driver.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">${driver.price.toFixed(1)}M</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleDriverSelection({ id: driver.id } as SelectMarketDriver)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 border rounded-md text-center text-muted-foreground">
                  No drivers selected
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Selected Constructors ({constructors.length}/2)</h3>
              {constructors.length > 0 ? (
                <div className="space-y-2">
                  {constructors.map(constructor => {
                    const marketConstructor = getMarketConstructor(constructor.id)
                    return (
                      <div key={constructor.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center"
                            style={{ 
                              backgroundColor: marketConstructor?.color || "#718096",
                              color: "#000000"
                            }}
                          >
                            {constructor.name.charAt(0)}
                          </div>
                          <span className="font-medium">{constructor.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">${constructor.price.toFixed(1)}M</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleConstructorSelection({ id: constructor.id } as SelectMarketConstructor)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 border rounded-md text-center text-muted-foreground">
                  No constructors selected
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <Alert className={cn(
              remainingBudget < 0 && "bg-red-100 dark:bg-red-950",
              remainingBudget >= 0 && remainingBudget < 10 && "bg-amber-100 dark:bg-amber-950",
              remainingBudget >= 10 && "bg-green-100 dark:bg-green-950"
            )}>
              <AlertTitle>Budget: ${budget.toFixed(1)}M</AlertTitle>
              <AlertDescription>
                Remaining budget: ${remainingBudget.toFixed(1)}M
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={saveTeam} 
            disabled={isLoading || drivers.length !== 5 || constructors.length !== 2 || remainingBudget < 0}
          >
            Save Team
          </Button>
        </CardFooter>
      </Card>
      
      <Tabs defaultValue="drivers">
        <TabsList className="mb-4">
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="constructors">Constructors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle>Select Drivers</CardTitle>
              <CardDescription>
                Choose 5 drivers for your team. You have ${remainingBudget.toFixed(1)}M remaining.
              </CardDescription>
              <Input
                placeholder="Search drivers..."
                className="mt-2"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDrivers.map(driver => (
                  <div
                    key={driver.id}
                    className={cn(
                      "p-4 border rounded-md cursor-pointer transition-colors",
                      isDriverSelected(driver.id) 
                        ? "border-primary bg-primary/10" 
                        : "hover:bg-accent"
                    )}
                    onClick={() => toggleDriverSelection(driver)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {driver.imageUrl ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={driver.imageUrl} alt={driver.name} />
                            <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                            {driver.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{driver.name}</span>
                      </div>
                      <Checkbox checked={isDriverSelected(driver.id)} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>
                        <Badge variant="outline" style={{ 
                          backgroundColor: driver.teamColor || undefined,
                          color: "#000000"
                        }}>
                          {driver.team}
                        </Badge>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-medium">${driver.price.toFixed(1)}M</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredDrivers.length === 0 && (
                  <div className="col-span-full p-4 text-center text-muted-foreground">
                    No drivers found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="constructors">
          <Card>
            <CardHeader>
              <CardTitle>Select Constructors</CardTitle>
              <CardDescription>
                Choose 2 constructors for your team. You have ${remainingBudget.toFixed(1)}M remaining.
              </CardDescription>
              <Input
                placeholder="Search constructors..."
                className="mt-2"
                value={constructorSearch}
                onChange={(e) => setConstructorSearch(e.target.value)}
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConstructors.map(constructor => (
                  <div
                    key={constructor.id}
                    className={cn(
                      "p-4 border rounded-md cursor-pointer transition-colors",
                      isConstructorSelected(constructor.id) 
                        ? "border-primary bg-primary/10" 
                        : "hover:bg-accent"
                    )}
                    onClick={() => toggleConstructorSelection(constructor)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-8 w-8 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: constructor.color || "#718096",
                            color: "#000000"
                          }}
                        >
                          {constructor.name.charAt(0)}
                        </div>
                        <span className="font-medium">{constructor.name}</span>
                      </div>
                      <Checkbox checked={isConstructorSelected(constructor.id)} />
                    </div>
                    <div className="flex justify-end text-sm">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">${constructor.price.toFixed(1)}M</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredConstructors.length === 0 && (
                  <div className="col-span-full p-4 text-center text-muted-foreground">
                    No constructors found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 