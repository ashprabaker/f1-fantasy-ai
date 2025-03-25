"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DriverPerformance } from "@/types"

interface DriverStatsProps {
  stats: DriverPerformance['stats']
  driver: DriverPerformance['driver']
}

export function DriverStats({ stats, driver }: DriverStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPoints.toFixed(0)}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Best Finish</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            P{stats.bestFinish}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Podiums</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.podiums}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Wins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.wins}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average Finish</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            P{stats.averageFinishPosition.toFixed(1)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Best Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            P{stats.bestGrid}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Nationality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {driver.nationality}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Driver Number</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {driver.permanentNumber || "N/A"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 