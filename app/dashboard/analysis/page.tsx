"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DriverPerformance from "./_components/driver-performance"
import TeamAnalysis from "./_components/team-analysis"
import RacePrediction from "./_components/race-prediction"
import WeatherAnalysis from "./_components/weather-analysis"
import SeasonHistory from "./_components/season-history"

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState("drivers")
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Historical Analysis</h1>
        <p className="text-muted-foreground">
          Study past F1 seasons to inform your fantasy selections
        </p>
      </div>
      
      <Tabs defaultValue="drivers" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-5 h-auto">
          <TabsTrigger value="drivers">Driver Stats</TabsTrigger>
          <TabsTrigger value="teams">Constructor Stats</TabsTrigger>
          <TabsTrigger value="predictions">Race Predictions</TabsTrigger>
          <TabsTrigger value="weather">Weather Analysis</TabsTrigger>
          <TabsTrigger value="history">Championship History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="drivers" className="pt-4">
          <DriverPerformance />
        </TabsContent>
        
        <TabsContent value="teams" className="pt-4">
          <TeamAnalysis />
        </TabsContent>
        
        <TabsContent value="predictions" className="pt-4">
          <RacePrediction />
        </TabsContent>
        
        <TabsContent value="weather" className="pt-4">
          <WeatherAnalysis />
        </TabsContent>
        
        <TabsContent value="history" className="pt-4">
          <SeasonHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}