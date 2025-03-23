"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { generateTeamRecommendationsAction, getRecommendationAction } from "@/actions/ai-recommendation-actions"
import { toast } from "sonner"
import { SelectTeam, SelectMarketDriver, SelectMarketConstructor, SelectDriver, SelectConstructor } from "@/db/schema"
import { Brain } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DriverCard } from "./driver-card"
import { ConstructorCard } from "./constructor-card"
import ReactMarkdown from "react-markdown"
import { useAuth } from "@clerk/nextjs"

interface TeamWithMembers extends SelectTeam {
  drivers: SelectDriver[];
  constructors: SelectConstructor[];
}

interface AIRecommendationsSectionProps {
  team: TeamWithMembers;
  marketDrivers: SelectMarketDriver[];
  marketConstructors: SelectMarketConstructor[];
}

interface RecommendationData {
  analysis: string;
  recommendedTeam: {
    drivers: SelectMarketDriver[];
    constructors: SelectMarketConstructor[];
  };
}

export default function AIRecommendationsSection({ 
  team, 
  marketDrivers, 
  marketConstructors 
}: AIRecommendationsSectionProps) {
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null)
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("current")
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    canMakeRequest: boolean;
    resetTime: Date | null;
    requestsRemaining: number;
  } | null>(null)
  
  // Check rate limit on component mount
  useEffect(() => {
    const checkRateLimit = async () => {
      if (!userId) return
      
      try {
        const { checkRecommendationRateLimitAction } = await import('@/actions/db/profiles-actions')
        const result = await checkRecommendationRateLimitAction(userId)
        
        if (result.isSuccess && result.data) {
          setRateLimitInfo(result.data)
        }
      } catch (error) {
        console.error("Error checking rate limit:", error)
      }
    }
    
    checkRateLimit()
  }, [userId])
  
  // Setup polling for recommendation status
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isPolling && userId) {
      intervalId = setInterval(async () => {
        try {
          const result = await getRecommendationAction(userId);
          
          if (result.isSuccess && !result.message.includes("in progress") && result.data) {
            // Recommendation is ready
            setRecommendation(result.data);
            setIsLoading(false);
            setIsPolling(false);
            setShowRecommendationDialog(true);
            
            // Clear the interval
            if (intervalId) clearInterval(intervalId);
          } else if (!result.isSuccess && result.message.includes("No recommendation")) {
            // No recommendation found (possible error)
            setIsLoading(false);
            setIsPolling(false);
            
            // Clear the interval
            if (intervalId) clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error polling recommendation status:", error);
        }
      }, 2000); // Poll every 2 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, userId]);
  
  // Get AI recommendations for the team
  const getRecommendations = async () => {
    if (!userId) {
      toast.error("You must be signed in to get recommendations")
      return
    }
    
    if (!team.drivers || !team.constructors || team.drivers.length === 0 || team.constructors.length === 0) {
      toast.error("Your team must have at least one driver and one constructor")
      return
    }
    
    setIsLoading(true)
    
    try {
      // Start the recommendation generation
      const result = await generateTeamRecommendationsAction(
        { 
          drivers: team.drivers, 
          constructors: team.constructors 
        },
        marketDrivers,
        marketConstructors,
        userId
      )
      
      if (result.isSuccess && result.data) {
        if (result.data.inProgress) {
          // Start polling for results
          toast.info("Generating recommendations, this may take a moment...")
          setIsPolling(true)
          
          // Update rate limit info after successful request
          const { checkRecommendationRateLimitAction } = await import('@/actions/db/profiles-actions')
          const rateLimitResult = await checkRecommendationRateLimitAction(userId)
          if (rateLimitResult.isSuccess && rateLimitResult.data) {
            setRateLimitInfo(rateLimitResult.data)
          }
        } else {
          // Immediately get the results if they're ready
          const recommendationResult = await getRecommendationAction(userId)
          
          if (recommendationResult.isSuccess && recommendationResult.data) {
            setRecommendation(recommendationResult.data)
            setShowRecommendationDialog(true)
            setIsLoading(false)
            
            // Update rate limit info after successful request
            const { checkRecommendationRateLimitAction } = await import('@/actions/db/profiles-actions')
            const rateLimitResult = await checkRecommendationRateLimitAction(userId)
            if (rateLimitResult.isSuccess && rateLimitResult.data) {
              setRateLimitInfo(rateLimitResult.data)
            }
          } else {
            // Fall back to polling if something went wrong
            setIsPolling(true)
          }
        }
      } else {
        toast.error(result.message || "Failed to start recommendation generation")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error generating recommendations:", error)
      toast.error("An error occurred while generating recommendations")
      setIsLoading(false)
    }
  }
  
  // Format time until reset
  const formatTimeUntilReset = () => {
    if (!rateLimitInfo?.resetTime) return null
    
    const now = new Date()
    const resetTime = new Date(rateLimitInfo.resetTime)
    const diffMs = resetTime.getTime() - now.getTime()
    
    if (diffMs <= 0) return "soon"
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m`
    } else {
      return `${diffMins}m`
    }
  }
  
  return (
    <>
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-primary" />
            AI Recommendations
          </CardTitle>
          <CardDescription>
            Get personalized recommendations for your F1 Fantasy team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            Our AI will analyze your current team and provide suggestions to optimize your lineup based on:
          </p>
          <ul className="text-sm list-disc pl-5 space-y-1 mb-4">
            <li>Historical driver performance</li>
            <li>Value for money</li>
            <li>Upcoming race conditions</li>
            <li>Recent form and momentum</li>
          </ul>
          
          {rateLimitInfo && (
            <div className="text-xs text-muted-foreground mt-4 flex justify-between items-center">
              <span>
                Recommendations remaining: {rateLimitInfo.requestsRemaining}
              </span>
              {!rateLimitInfo.canMakeRequest && rateLimitInfo.resetTime && (
                <span>
                  Resets in: {formatTimeUntilReset()}
                </span>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={getRecommendations} 
            disabled={isLoading || isPolling || (rateLimitInfo?.canMakeRequest === false)}
            className="w-full"
          >
            {isLoading || isPolling ? 
              "Generating Recommendations..." : 
              rateLimitInfo?.canMakeRequest === false ?
              "Daily Limit Reached" :
              "Get AI Recommendations"
            }
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog 
        open={showRecommendationDialog} 
        onOpenChange={setShowRecommendationDialog}
        modal={true}
      >
        <DialogContent className="max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Team Recommendations</DialogTitle>
            <DialogDescription>
              AI-powered analysis and suggestions for your F1 Fantasy team
            </DialogDescription>
          </DialogHeader>
          
          {recommendation && (
            <div className="flex flex-col gap-6 overflow-y-auto pr-2">
              <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="current">Current Team</TabsTrigger>
                  <TabsTrigger value="recommended">Recommended Team</TabsTrigger>
                </TabsList>
                <TabsContent value="current" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                    {team.drivers.map((driver) => (
                      <DriverCard 
                        key={driver.id}
                        driver={driver}
                        marketDrivers={marketDrivers}
                        isSelected={true}
                        onToggleSelection={() => {}}
                        disabled={true}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {team.constructors.map((constructor) => (
                      <ConstructorCard
                        key={constructor.id}
                        constructor={constructor}
                        isSelected={true}
                        onToggleSelection={() => {}}
                        disabled={true}
                      />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="recommended" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                    {recommendation.recommendedTeam.drivers.map((driver) => (
                      <DriverCard 
                        key={driver.id}
                        driver={driver}
                        marketDrivers={marketDrivers}
                        isSelected={true}
                        onToggleSelection={() => {}}
                        disabled={true}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {recommendation.recommendedTeam.constructors.map((constructor) => (
                      <ConstructorCard
                        key={constructor.id}
                        constructor={constructor}
                        isSelected={true}
                        onToggleSelection={() => {}}
                        disabled={true}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="bg-muted/30 p-4 rounded-lg mt-6">
                <h3 className="text-lg font-medium mb-2">AI Analysis</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{recommendation.analysis}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowRecommendationDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 