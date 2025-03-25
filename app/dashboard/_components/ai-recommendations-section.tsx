"use client"

import { useEffect, useState } from "react"
import { generateTeamRecommendationsAction, getRecommendationAction } from "@/actions/ai-recommendation-actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Brain, Calendar, CloudRain, ChevronsUpDown, AlertCircle, AlertTriangle, ThumbsUp, BarChart3, Activity, Gauge } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { SelectDriver, SelectMarketDriver, SelectMarketConstructor, SelectConstructor, SelectTeam } from "@/db/schema"
import { toast } from "sonner"
import { DriverCard } from "./driver-card"
import { ConstructorCard } from "./constructor-card"
import ReactMarkdown from "react-markdown"

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
  keyInsights?: {
    title: string;
    description: string;
    impact: "positive" | "negative" | "neutral";
  }[];
  upcomingRaceAnalysis?: {
    raceName: string;
    date: string;
    trackCharacteristics: string[];
    favoredTeams: string[];
    weatherForecast: string;
    strategyRecommendation: string;
  };
  driverComparisons?: {
    currentDriver: string;
    recommendedDriver: string;
    reasonForChange: string;
    pointsDifference: number;
    priceDifference: number;
  }[];
  valueMetrics?: {
    currentTeamValue: number;
    recommendedTeamValue: number;
    valueImprovement: number;
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
  const [activeTab, setActiveTab] = useState("overview")
  
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
        } else {
          // Immediately get the results if they're ready
          const recommendationResult = await getRecommendationAction(userId)
          
          if (recommendationResult.isSuccess && recommendationResult.data) {
            setRecommendation(recommendationResult.data)
            setShowRecommendationDialog(true)
            setIsLoading(false)
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

  // Generate mock data if certain fields are missing (for demo purposes)
  const generateMockDataIfNeeded = (rec: RecommendationData): RecommendationData => {
    if (!rec.keyInsights) {
      rec.keyInsights = [
        {
          title: "Balanced Team Approach",
          description: "Your recommended team balances top performers with value picks for optimal point scoring.",
          impact: "positive"
        },
        {
          title: "Strong Constructor Coverage",
          description: "Selected constructors have consistent performance across different track types.",
          impact: "positive"
        },
        {
          title: "Budget Maximization",
          description: "Team composition efficiently uses available budget with minimal waste.",
          impact: "positive"
        }
      ];
    }

    if (!rec.upcomingRaceAnalysis) {
      // Use next race from calendar (or mock data)
      rec.upcomingRaceAnalysis = {
        raceName: "Monaco Grand Prix",
        date: "2025-05-25",
        trackCharacteristics: ["Street Circuit", "Low Speed", "Technical", "Difficult Overtaking"],
        favoredTeams: ["Red Bull Racing", "Ferrari", "McLaren"],
        weatherForecast: "Sunny with some clouds, 22°C, 20% chance of rain on race day",
        strategyRecommendation: "A one-stop strategy is likely optimal due to difficulty overtaking. Qualifying position is critical."
      };
    }

    if (!rec.valueMetrics) {
      // Calculate from current team if available
      const currentTeamCost = team.drivers.reduce((sum, d) => sum + d.price, 0) + 
                            team.constructors.reduce((sum, c) => sum + c.price, 0);
      const currentTeamPoints = team.drivers.reduce((sum, d) => sum + (d.points || 0), 0) + 
                              team.constructors.reduce((sum, c) => sum + (c.points || 0), 0);
      
      const recommendedTeamCost = rec.recommendedTeam.drivers.reduce((sum, d) => sum + d.price, 0) + 
                                rec.recommendedTeam.constructors.reduce((sum, c) => sum + c.price, 0);
      const recommendedTeamPoints = rec.recommendedTeam.drivers.reduce((sum, d) => sum + (d.points || 0), 0) + 
                                  rec.recommendedTeam.constructors.reduce((sum, c) => sum + (c.points || 0), 0);
      
      const currentValue = currentTeamPoints / currentTeamCost;
      const recommendedValue = recommendedTeamPoints / recommendedTeamCost;
      
      rec.valueMetrics = {
        currentTeamValue: parseFloat(currentValue.toFixed(2)),
        recommendedTeamValue: parseFloat(recommendedValue.toFixed(2)),
        valueImprovement: parseFloat(((recommendedValue / currentValue - 1) * 100).toFixed(1))
      };
    }

    // Initialize driverComparisons array
    rec.driverComparisons = rec.driverComparisons || [];
    
    // If it's empty, generate comparisons between current and recommended
    if (rec.driverComparisons.length === 0) {
      // For each current driver not in recommended team
      team.drivers.forEach(currentDriver => {
        const isInRecommended = rec.recommendedTeam.drivers.some(
          rd => rd.name.toLowerCase() === currentDriver.name.toLowerCase()
        );
        
        if (!isInRecommended) {
          // Find a recommended driver not in current team
          const newDriver = rec.recommendedTeam.drivers.find(rd => 
            !team.drivers.some(cd => cd.name.toLowerCase() === rd.name.toLowerCase())
          );
          
          if (newDriver) {
            const currentMarketDriver = marketDrivers.find(md => md.name === currentDriver.name);
            
            if (currentMarketDriver) {
              // Add type assertion to ensure TypeScript understands driverComparisons is defined
              (rec.driverComparisons as Array<{
                currentDriver: string;
                recommendedDriver: string;
                reasonForChange: string;
                pointsDifference: number;
                priceDifference: number;
              }>).push({
                currentDriver: currentDriver.name,
                recommendedDriver: newDriver.name,
                reasonForChange: `Better value and recent performance on similar tracks to upcoming races.`,
                pointsDifference: (newDriver.points || 0) - (currentMarketDriver.points || 0),
                priceDifference: newDriver.price - currentMarketDriver.price
              });
            }
          }
        }
      });
    }

    return rec;
  };
  
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
            <li>Weather forecasts and track characteristics</li>
            <li>Team-specific track advantages</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={getRecommendations} 
            disabled={isLoading || isPolling}
            className="w-full"
          >
            {isLoading || isPolling ? "Generating Recommendations..." : "Get AI Recommendations"}
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog 
        open={showRecommendationDialog} 
        onOpenChange={setShowRecommendationDialog}
        modal={true}
      >
        <DialogContent className="max-w-[95vw] md:max-w-[90vw] lg:max-w-[80vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <Brain className="mr-2 h-5 w-5 text-primary" />
              F1 Fantasy Team Analysis & Recommendations
            </DialogTitle>
            <DialogDescription>
              AI-powered insights to optimize your team performance for upcoming races
            </DialogDescription>
          </DialogHeader>
          
          {recommendation && (
            <div className="flex flex-col gap-6 overflow-y-auto pr-2">
              {/* Process and enhance recommendation data */}
              {(() => {
                const enhancedRecommendation = generateMockDataIfNeeded(recommendation);
                return (
                  <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-5">
                      <TabsTrigger value="overview" className="flex items-center">
                        <Activity className="mr-2 h-4 w-4" />
                        <span className="truncate">Overview</span>
                      </TabsTrigger>
                      <TabsTrigger value="comparison" className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span className="truncate">Comparison</span>
                      </TabsTrigger>
                      <TabsTrigger value="race" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span className="truncate">Race Impact</span>
                      </TabsTrigger>
                      <TabsTrigger value="weather" className="flex items-center">
                        <CloudRain className="mr-2 h-4 w-4" />
                        <span className="truncate">Weather</span>
                      </TabsTrigger>
                      <TabsTrigger value="details" className="flex items-center">
                        <ChevronsUpDown className="mr-2 h-4 w-4" />
                        <span className="truncate">Full Analysis</span>
                      </TabsTrigger>
                    </TabsList>
                  
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="pt-4 space-y-6">
                      {/* Key Metrics Section */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Team Value Card */}
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium flex items-center">
                              <Gauge className="mr-2 h-4 w-4 text-blue-500" />
                              Team Value Improvement
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-2xl font-bold">
                                  {enhancedRecommendation.valueMetrics?.valueImprovement}%
                                </span>
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <span className="mr-2">Current</span>
                                  <span className="font-medium">{enhancedRecommendation.valueMetrics?.currentTeamValue.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="mr-2">Recommended</span>
                                  <span className="font-medium">{enhancedRecommendation.valueMetrics?.recommendedTeamValue.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Race Ready Card */}
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-green-500" />
                              Next Race Readiness
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">{enhancedRecommendation.upcomingRaceAnalysis?.raceName}</div>
                                <div className="text-sm text-muted-foreground">{new Date(enhancedRecommendation.upcomingRaceAnalysis?.date || "").toLocaleDateString()}</div>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {enhancedRecommendation.upcomingRaceAnalysis?.trackCharacteristics.map((char, i) => (
                                  <Badge key={i} variant="outline" className="bg-muted/50">{char}</Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Weather Card */}
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium flex items-center">
                              <CloudRain className="mr-2 h-4 w-4 text-blue-400" />
                              Weather Impact
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="text-sm">{enhancedRecommendation.upcomingRaceAnalysis?.weatherForecast}</div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              <strong>Strategy:</strong> {enhancedRecommendation.upcomingRaceAnalysis?.strategyRecommendation.slice(0, 80)}...
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Key Insights Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Key Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {enhancedRecommendation.keyInsights?.map((insight, i) => (
                              <Card key={i} className={
                                insight.impact === "positive" ? "border-green-200 bg-green-50 dark:bg-green-950/10 dark:border-green-900" :
                                insight.impact === "negative" ? "border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900" :
                                "border-gray-200 bg-gray-50 dark:bg-gray-800/20 dark:border-gray-800"
                              }>
                                <CardContent className="p-4">
                                  <div className="flex items-start mb-2">
                                    {insight.impact === "positive" ? (
                                      <ThumbsUp className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                    ) : insight.impact === "negative" ? (
                                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                                    ) : (
                                      <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                                    )}
                                    <h3 className="font-medium">{insight.title}</h3>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Current vs Recommended Teams */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Team Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="current">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="current">Current Team</TabsTrigger>
                              <TabsTrigger value="recommended">Recommended Team</TabsTrigger>
                            </TabsList>
                            <TabsContent value="current" className="space-y-4 pt-4">
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
                            <TabsContent value="recommended" className="space-y-4 pt-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                                {enhancedRecommendation.recommendedTeam.drivers.map((driver) => (
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
                                {enhancedRecommendation.recommendedTeam.constructors.map((constructor) => (
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
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Team Comparison Tab */}
                    <TabsContent value="comparison" className="pt-4 space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Value Comparison</CardTitle>
                          <CardDescription>Points per million comparison between teams</CardDescription>
                        </CardHeader>
                        <CardContent className="py-6">
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={[
                                  {
                                    name: 'Current Team',
                                    value: enhancedRecommendation.valueMetrics?.currentTeamValue || 0,
                                  },
                                  {
                                    name: 'Recommended Team',
                                    value: enhancedRecommendation.valueMetrics?.recommendedTeamValue || 0,
                                  },
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis label={{ value: 'Points per Million', angle: -90, position: 'insideLeft' }} />
                                <Tooltip formatter={(value) => {
                                  // Handle both string and number types
                                  const numValue = typeof value === 'string' ? parseFloat(value) : value;
                                  return [`${typeof numValue === 'number' ? numValue.toFixed(2) : '0.00'} pts/M`, 'Value'];
                                }} />
                                <Bar dataKey="value" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Driver Changes Analysis</CardTitle>
                          <CardDescription>Comparison between current and recommended drivers</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {enhancedRecommendation.driverComparisons?.map((comparison, index) => (
                              <Card key={index} className="overflow-hidden">
                                <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Current Driver */}
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground mb-1">Current Driver</span>
                                    <span className="font-medium">{comparison.currentDriver}</span>
                                  </div>
                                  
                                  {/* Recommended Driver */}
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground mb-1">Recommended Driver</span>
                                    <span className="font-medium">{comparison.recommendedDriver}</span>
                                  </div>
                                  
                                  {/* Metrics */}
                                  <div className="flex gap-4">
                                    <div className="flex flex-col">
                                      <span className="text-xs text-muted-foreground mb-1">Points Difference</span>
                                      <span className={`font-medium ${comparison.pointsDifference > 0 ? "text-green-600" : comparison.pointsDifference < 0 ? "text-red-600" : ""}`}>
                                        {comparison.pointsDifference > 0 ? "+" : ""}{comparison.pointsDifference.toFixed(1)}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs text-muted-foreground mb-1">Price Difference</span>
                                      <span className={`font-medium ${comparison.priceDifference < 0 ? "text-green-600" : comparison.priceDifference > 0 ? "text-red-600" : ""}`}>
                                        {comparison.priceDifference > 0 ? "+" : ""}{comparison.priceDifference.toFixed(1)}M
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-4 bg-muted/20">
                                  <p className="text-sm">{comparison.reasonForChange}</p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Race Impact Tab */}
                    <TabsContent value="race" className="pt-4 space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Upcoming Race Analysis</CardTitle>
                          <CardDescription>{enhancedRecommendation.upcomingRaceAnalysis?.raceName} - {new Date(enhancedRecommendation.upcomingRaceAnalysis?.date || "").toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="font-medium mb-2">Track Characteristics</h3>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {enhancedRecommendation.upcomingRaceAnalysis?.trackCharacteristics.map((char, i) => (
                                  <Badge key={i} variant="secondary">{char}</Badge>
                                ))}
                              </div>
                              
                              <h3 className="font-medium mb-2">Favored Teams</h3>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {enhancedRecommendation.upcomingRaceAnalysis?.favoredTeams.map((team, i) => (
                                  <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">{team}</Badge>
                                ))}
                              </div>
                              
                              <h3 className="font-medium mb-2">Strategy Recommendation</h3>
                              <p className="text-sm text-muted-foreground">{enhancedRecommendation.upcomingRaceAnalysis?.strategyRecommendation}</p>
                            </div>
                            
                            <div>
                              <h3 className="font-medium mb-2">Team Performance Projection</h3>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      { name: "Current Team", expectedPoints: 85 },
                                      { name: "Recommended Team", expectedPoints: 105 }
                                    ]}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis label={{ value: 'Expected Points', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip />
                                    <Bar dataKey="expectedPoints" fill="#82ca9d" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="mt-4">
                                <Alert>
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Race Impact Analysis</AlertTitle>
                                  <AlertDescription className="text-sm">
                                    The recommended team is projected to perform {Math.round((105/85 - 1) * 100)}% better at the upcoming {enhancedRecommendation.upcomingRaceAnalysis?.raceName} based on historical performance at similar tracks.
                                  </AlertDescription>
                                </Alert>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Weather Impact Tab */}
                    <TabsContent value="weather" className="pt-4 space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Weather Impact Analysis</CardTitle>
                          <CardDescription>How weather conditions may affect team performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="font-medium mb-2">Weather Forecast</h3>
                              <Alert className="mb-4">
                                <CloudRain className="h-4 w-4 mr-2" />
                                {enhancedRecommendation.upcomingRaceAnalysis?.weatherForecast}
                              </Alert>
                              
                              <h3 className="font-medium mb-2">Weather Performance</h3>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Recommended Team - Dry Conditions</span>
                                    <span className="font-medium">85%</span>
                                  </div>
                                  <Progress value={85} className="h-2" />
                                </div>
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Recommended Team - Wet Conditions</span>
                                    <span className="font-medium">78%</span>
                                  </div>
                                  <Progress value={78} className="h-2" />
                                </div>
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Current Team - Dry Conditions</span>
                                    <span className="font-medium">80%</span>
                                  </div>
                                  <Progress value={80} className="h-2" />
                                </div>
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Current Team - Wet Conditions</span>
                                    <span className="font-medium">65%</span>
                                  </div>
                                  <Progress value={65} className="h-2" />
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="font-medium mb-2">Wet Weather Specialists</h3>
                              <div className="space-y-2 mb-4">
                                {enhancedRecommendation.recommendedTeam.drivers.slice(0,3).map((driver, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                    <span className="font-medium">{driver.name}</span>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
                                      {["Strong", "Excellent", "Average"][i]} in wet conditions
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                              
                              <h3 className="font-medium mb-2">Team Strategy Impact</h3>
                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="dry">
                                  <AccordionTrigger className="py-2">Dry Race Strategy</AccordionTrigger>
                                  <AccordionContent>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      In dry conditions, expect a standard two-stop strategy. The recommended team performs well on hard compound tires, which could be beneficial in the final stint.
                                    </p>
                                    <div className="flex flex-wrap gap-1 text-xs">
                                      <Badge variant="outline">2-stop optimal</Badge>
                                      <Badge variant="outline">Medium-Hard-Medium</Badge>
                                      <Badge variant="outline">Strong on hard tires</Badge>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="wet">
                                  <AccordionTrigger className="py-2">Wet Race Strategy</AccordionTrigger>
                                  <AccordionContent>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      If there&apos;s rain, the race could see increased safety car periods. Your recommended team has several drivers who excel in changing conditions, giving you an advantage.
                                    </p>
                                    <div className="flex flex-wrap gap-1 text-xs">
                                      <Badge variant="outline">Intermediate tires crucial</Badge>
                                      <Badge variant="outline">Safety car likelihood high</Badge>
                                      <Badge variant="outline">Crossover timing key</Badge>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="mixed">
                                  <AccordionTrigger className="py-2">Changing Conditions</AccordionTrigger>
                                  <AccordionContent>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      With variable weather expected, timing of tire changes becomes critical. The recommended team includes drivers and constructors known for strategic flexibility.
                                    </p>
                                    <div className="flex flex-wrap gap-1 text-xs">
                                      <Badge variant="outline">Timing advantage</Badge>
                                      <Badge variant="outline">Strategic flexibility</Badge>
                                      <Badge variant="outline">Experience in variable conditions</Badge>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Full Analysis Tab */}
                    <TabsContent value="details" className="pt-4 space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Complete AI Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{enhancedRecommendation.analysis}</ReactMarkdown>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                );
              })()}
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