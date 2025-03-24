"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DriverPerformance from "./_components/driver-performance"
import TeamAnalysis from "./_components/team-analysis"

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
          <TabsTrigger value="predictions" disabled>Season Comparisons</TabsTrigger>
          <TabsTrigger value="weather" disabled>Circuit Analysis</TabsTrigger>
          <TabsTrigger value="history" disabled>Championship History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="drivers" className="pt-4">
          <DriverPerformance />
        </TabsContent>
        
        <TabsContent value="teams" className="pt-4">
          <TeamAnalysis />
        </TabsContent>
        
        <TabsContent value="predictions" className="pt-4">
          <div className="p-8 text-center">
            <h2 className="text-xl font-medium mb-2">Race Predictions</h2>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </TabsContent>
        
        <TabsContent value="weather" className="pt-4">
          <div className="p-8 text-center">
            <h2 className="text-xl font-medium mb-2">Weather Impact</h2>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="pt-4">
          <div className="p-8 text-center">
            <h2 className="text-xl font-medium mb-2">Season History</h2>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}