"use client"

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

interface CircuitData {
  circuit: string
  bestResult: number
  avgPosition: number
  totalRaces: number
}

interface CircuitPerformanceProps {
  data: CircuitData[]
}

export default function CircuitPerformance({ data }: CircuitPerformanceProps) {
  // Prepare the data for the chart - invert positions so 1st place shows highest on chart
  const chartData = data.map(circuit => {
    return {
      ...circuit,
      // Create shortened name for display
      circuitShort: circuit.circuit.split(' ')[0],
      // Invert best result for chart (lower is better in racing)
      bestResultInverted: circuit.bestResult > 0 ? 21 - circuit.bestResult : 0,
      // Invert average position for chart
      avgPositionInverted: circuit.avgPosition > 0 ? 21 - circuit.avgPosition : 0,
    }
  })
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Circuit Performance</CardTitle>
        <CardDescription>
          Driver performance across different circuits
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No circuit data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="circuitShort" 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 20]} 
                label={{ value: 'Position', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                ticks={[1, 5, 10, 15, 20]}
                reversed 
              />
              <Tooltip 
                formatter={(value, name) => {
                  // Convert inverted values back to actual positions
                  if (name === 'Best Result') return [21 - Number(value), name]
                  if (name === 'Average Position') return [(21 - Number(value)).toFixed(1), name]
                  return [value, name]
                }}
              />
              <Legend />
              <Bar 
                dataKey="bestResultInverted" 
                name="Best Result" 
                fill="#ff5050" 
              />
              <Bar 
                dataKey="avgPositionInverted" 
                name="Average Position" 
                fill="#50c8ff" 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
        
        <div className="grid grid-cols-1 gap-4 mt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              * Lower positions are better (1st place is the highest possible)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}