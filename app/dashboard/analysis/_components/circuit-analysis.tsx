"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface CircuitDriverPerformance {
  driver: string
  team: string
  bestFinish: number
  avgFinish: number
  winProbability: number
}

interface CircuitAnalysisProps {
  circuitId: string
  circuitName: string
  driverPerformance: CircuitDriverPerformance[]
}

export default function CircuitAnalysis({ 
  circuitId, 
  circuitName, 
  driverPerformance 
}: CircuitAnalysisProps) {
  // Circuit characteristics mapping (just for display purposes)
  const circuitCharacteristics = {
    "bahrain": {
      type: "Medium-speed",
      tireWear: "High",
      overtaking: "Good",
      length: 5.412,
      corners: 15,
      keyFeatures: "Heavy braking zones, long straights"
    },
    "saudi-arabia": {
      type: "High-speed street",
      tireWear: "Low",
      overtaking: "Limited",
      length: 6.174,
      corners: 27,
      keyFeatures: "Fast flowing corners, walls close to track"
    },
    "australia": {
      type: "Street/Park",
      tireWear: "Medium",
      overtaking: "Limited",
      length: 5.278,
      corners: 14,
      keyFeatures: "Technical middle sector, fast final sector"
    },
    "japan": {
      type: "High-speed technical",
      tireWear: "High",
      overtaking: "Limited",
      length: 5.807,
      corners: 18,
      keyFeatures: "Fast, flowing first sector (S curves)"
    },
    "miami": {
      type: "Street circuit",
      tireWear: "Medium",
      overtaking: "Good",
      length: 5.412,
      corners: 19,
      keyFeatures: "Long straights, technical sections"
    },
    "monaco": {
      type: "Slow street",
      tireWear: "Low",
      overtaking: "Very difficult",
      length: 3.337,
      corners: 19,
      keyFeatures: "Tight corners, no room for error"
    },
    "canada": {
      type: "Stop-start",
      tireWear: "Medium",
      overtaking: "Good",
      length: 4.361,
      corners: 14,
      keyFeatures: "Chicanes, wall of champions"
    },
    // Default characteristics if none match
    "default": {
      type: "Mixed",
      tireWear: "Medium",
      overtaking: "Variable",
      length: 5.0,
      corners: 16,
      keyFeatures: "Various technical sections"
    }
  }
  
  // Get circuit details or use default
  const circuit = circuitCharacteristics[circuitId as keyof typeof circuitCharacteristics] || 
                 circuitCharacteristics.default
  
  // Team colors for bars
  const getTeamColor = (team: string) => {
    const teamColors: Record<string, string> = {
      'Red Bull Racing': '#0600EF',
      'Ferrari': '#DC0000',
      'Mercedes': '#00D2BE',
      'McLaren': '#FF8700',
      'Aston Martin': '#006F62',
      'Alpine': '#0090FF',
      'Williams': '#005AFF',
      'Racing Bulls': '#1E41FF',
      'Haas F1 Team': '#FFFFFF',
      'Sauber': '#900000'
    }
    
    for (const [key, value] of Object.entries(teamColors)) {
      if (team.includes(key)) return value
    }
    
    return '#666666'
  }
  
  // Prepare data for win probability chart
  const winProbabilityData = driverPerformance
    .map(driver => ({
      name: driver.driver.split(' ')[1] || driver.driver, // Use last name for display
      fullName: driver.driver,
      team: driver.team,
      winProbability: driver.winProbability
    }))
    .sort((a, b) => b.winProbability - a.winProbability)
    .slice(0, 7) // Top 7 for cleaner display
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Circuit Characteristics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Circuit Type</div>
                <div className="font-medium">{circuit.type}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Length</div>
                <div className="font-medium">{circuit.length} km</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Corners</div>
                <div className="font-medium">{circuit.corners}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tire Wear</div>
                <div className="font-medium">{circuit.tireWear}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Overtaking</div>
                <div className="font-medium">{circuit.overtaking}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Key Features</div>
                <div className="font-medium">{circuit.keyFeatures}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Win Probability at {circuitName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={winProbabilityData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Win Probability']}
                    labelFormatter={(value) => `${winProbabilityData.find(d => d.name === value)?.fullName} (${winProbabilityData.find(d => d.name === value)?.team})`}
                  />
                  <Bar dataKey="winProbability" fill="#8884d8">
                    {winProbabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getTeamColor(entry.team)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historical Driver Performance</CardTitle>
          <CardDescription>
            Analysis based on previous races at {circuitName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Best Finish</TableHead>
                <TableHead>Avg. Finish</TableHead>
                <TableHead className="text-right">Win Probability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverPerformance.map((driver, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{driver.driver}</TableCell>
                  <TableCell>{driver.team}</TableCell>
                  <TableCell>
                    {typeof driver.bestFinish === 'number' 
                      ? `${driver.bestFinish}${getOrdinal(driver.bestFinish)}`
                      : driver.bestFinish}
                  </TableCell>
                  <TableCell>
                    {typeof driver.avgFinish === 'number' 
                      ? driver.avgFinish.toFixed(1)
                      : driver.avgFinish}
                  </TableCell>
                  <TableCell className="text-right">
                    {driver.winProbability}%
                    {driver.rookieNote && (
                      <div className="text-xs italic text-yellow-600 dark:text-yellow-400 mt-1">
                        {driver.rookieNote}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}