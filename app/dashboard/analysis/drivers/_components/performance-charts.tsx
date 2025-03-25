"use client"

import { useState } from "react"
import { 
  BarChart,
  Bar,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RaceResult } from "@/types"

interface PerformanceChartsProps {
  results: RaceResult[]
}

export function PerformanceCharts({ results }: PerformanceChartsProps) {
  const [chartType, setChartType] = useState("position")
  
  // Sort results by date (descending)
  const sortedResults = [...results].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 10).reverse()

  // Generate data for position comparison chart
  const positionData = sortedResults.map(race => ({
    race: race.raceName,
    grid: parseInt(race.grid),
    finish: parseInt(race.position),
  }))

  // Generate data for points progression chart
  const pointsData = sortedResults.map(race => ({
    race: race.raceName,
    points: parseFloat(race.points)
  }))

  return (
    <div className="space-y-4">
      <Tabs defaultValue="position" onValueChange={setChartType}>
        <TabsList>
          <TabsTrigger value="position">Grid vs Finish Position</TabsTrigger>
          <TabsTrigger value="points">Points Progression</TabsTrigger>
        </TabsList>
        <TabsContent value="position" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={positionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[1, 20]} reversed/>
              <YAxis dataKey="race" type="category" width={150} />
              <Tooltip formatter={(value) => `P${value}`} />
              <Legend />
              <Bar dataKey="grid" name="Grid Position" fill="#8884d8" />
              <Bar dataKey="finish" name="Finish Position" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="points" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pointsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="race" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="points" 
                name="Points" 
                stroke="#ff7300" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  )
} 