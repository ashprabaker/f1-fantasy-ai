"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface PerformanceData {
  race: string
  position: number
  points: number
  date: string
}

interface PerformanceChartProps {
  data: PerformanceData[]
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  // Format data for the chart - invert the position (lower is better in racing)
  const chartData = data.map(race => ({
    ...race,
    // Invert position so higher on chart is better (1st place at top)
    positionInverted: 21 - race.position,
    // Short name for x-axis
    shortName: race.race.split(' ')[0]
  }))
  
  return (
    <div className="w-full">
      {data.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No performance data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 40, left: 30, bottom: 65 }} // Increased margins for better text visibility
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
            <XAxis 
              dataKey="shortName" 
              angle={-45}
              textAnchor="end"
              height={80} // Increased height for labels
              tick={{ fontSize: 11 }} // Adjust font size
              interval={0} // Show all labels
              stroke="#888"
            />
            <YAxis 
              yAxisId="position"
              orientation="left"
              label={{ 
                value: 'Position', 
                angle: -90, 
                position: 'insideLeft', 
                style: { textAnchor: 'middle' },
                offset: -20, // Adjust position
              }}
              domain={[1, 20]} 
              reversed 
              ticks={[1, 5, 10, 15, 20]}
              stroke="#888"
              width={40} // More width for axis
            />
            <YAxis 
              yAxisId="points"
              orientation="right"
              label={{ 
                value: 'Points', 
                angle: -90, 
                position: 'insideRight', 
                style: { textAnchor: 'middle' },
                offset: 20, // Adjust position
              }}
              stroke="#888"
              width={40} // More width for axis
            />
            <Tooltip 
              labelFormatter={(value) => `Race: ${value}`}
              formatter={(value, name, props) => {
                return [value, name];
              }}
              wrapperStyle={{ fontSize: '12px', padding: '5px' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              wrapperStyle={{ paddingTop: '10px' }}
            />
            <Line 
              yAxisId="position"
              type="monotone" 
              dataKey="position" 
              name="Position"
              stroke="#ff5050" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
            <Line 
              yAxisId="points"
              type="monotone" 
              dataKey="points" 
              name="Points"
              stroke="#50c8ff" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      <div className="text-xs text-center mt-2 text-muted-foreground">
        {chartData.length > 0 
          ? `Race results from the ${chartData[0]?.race?.match(/\((\d{4})\)/) ? chartData[0]?.race?.match(/\((\d{4})\)/)[1] : ''} season`
          : 'No race data available for this season'
        }
      </div>
    </div>
  )
}