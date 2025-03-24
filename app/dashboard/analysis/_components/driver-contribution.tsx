"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DriverData {
  name: string
  points: number
  wins: number
  podiums: number
}

interface DriverContributionProps {
  data: DriverData[]
}

export default function DriverContribution({ data }: DriverContributionProps) {
  // Create data for the stacked bar chart
  const chartData = [
    {
      category: 'Points',
      [data[0]?.name || 'Driver 1']: data[0]?.points || 0,
      [data[1]?.name || 'Driver 2']: data[1]?.points || 0,
    },
    {
      category: 'Wins',
      [data[0]?.name || 'Driver 1']: data[0]?.wins || 0,
      [data[1]?.name || 'Driver 2']: data[1]?.wins || 0,
    },
    {
      category: 'Podiums',
      [data[0]?.name || 'Driver 1']: data[0]?.podiums || 0,
      [data[1]?.name || 'Driver 2']: data[1]?.podiums || 0,
    }
  ]
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Contributions</CardTitle>
        <CardDescription>
          Breakdown of points, wins, and podiums between team drivers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No driver data available</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={data[0]?.name || 'Driver 1'} stackId="a" fill="#ff5050" />
                <Bar dataKey={data[1]?.name || 'Driver 2'} stackId="a" fill="#50c8ff" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {data.map((driver, index) => (
                <div key={index} className="rounded-md border p-4">
                  <h3 className="font-medium mb-2">{driver.name}</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Points</p>
                      <p className="font-bold">{driver.points}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Wins</p>
                      <p className="font-bold">{driver.wins}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Podiums</p>
                      <p className="font-bold">{driver.podiums}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}