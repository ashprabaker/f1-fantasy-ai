"use server"

import { getDriverPerformanceAction } from "@/actions/analysis/driver-actions"
import { DriverStats } from "../_components/driver-stats"
import { PerformanceCharts } from "../_components/performance-charts"
import { CircuitPerformance } from "../_components/circuit-performance"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export async function DriverPerformanceFetcher({ driverId }: { driverId: string }) {
  const { data } = await getDriverPerformanceAction(driverId)
  
  if (!data) {
    return <p>No performance data available for this driver.</p>
  }
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">
        {data.driver.givenName} {data.driver.familyName}
      </h2>
      
      <DriverStats stats={data.stats} driver={data.driver} />
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Recent race results and points progression</CardDescription>
        </CardHeader>
        <CardContent>
          <PerformanceCharts results={data.results} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Circuit Analysis</CardTitle>
          <CardDescription>Performance breakdown by circuit</CardDescription>
        </CardHeader>
        <CardContent>
          <CircuitPerformance circuitPerformance={data.circuitPerformance} />
        </CardContent>
      </Card>
    </div>
  )
} 