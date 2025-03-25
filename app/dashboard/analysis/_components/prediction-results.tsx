"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Progress } from "@/components/ui/progress"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { InfoIcon } from "lucide-react"

interface PredictionResult {
  id: string
  name: string
  team: string
  probability: number
  calculationFactors?: {
    team: { 
      score: string
      weight: string
      contribution: string
    }
    skill: {
      score: string
      weight: string
      contribution: string
    }
    form: {
      score: string
      weight: string
      contribution: string
    }
    circuit: {
      advantage: string
      description: string
    }
    rookie: string
    totalScore: string
  }
  note?: string
}

interface PredictionResultsProps {
  predictions: PredictionResult[]
  confidence: number
}

export default function PredictionResults({ predictions, confidence }: PredictionResultsProps) {
  // Only show top 10 drivers for cleaner visualization
  const topDrivers = predictions.slice(0, 10)
  
  // Prepare data for chart
  const chartData = topDrivers.map(driver => ({
    name: driver.name.split(' ')[1] || driver.name, // Use last name for display
    fullName: driver.name,
    team: driver.team,
    probability: driver.probability
  })).sort((a, b) => b.probability - a.probability)
  
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
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Podium Probabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <YAxis 
                  dataKey="fullName" 
                  type="category" 
                  tick={{ fontSize: 12 }} 
                  width={80}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Probability']}
                  labelFormatter={(value) => `${value} (${chartData.find(d => d.fullName === value)?.team})`}
                  contentStyle={{ fontSize: '12px' }}
                  wrapperStyle={{ outline: 'none', border: '1px solid #eaeaea', borderRadius: '6px', padding: '0' }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Bar dataKey="probability" fill="#8884d8" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getTeamColor(entry.team)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Predicted Podium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {chartData.slice(0, 3).map((driver, index) => (
                <div key={index} className="flex-1 rounded-md border p-4 text-center">
                  <div className="text-2xl font-bold mb-1">{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'}</div>
                  <div 
                    className="w-full h-2 rounded mb-3" 
                    style={{ backgroundColor: getTeamColor(driver.team) }}
                  />
                  <div className="font-semibold">{driver.fullName}</div>
                  <div className="text-sm text-muted-foreground">{driver.team}</div>
                  
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <div className="font-bold text-lg">{driver.probability}%</div>
                    
                    {predictions[index]?.calculationFactors && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center justify-center rounded-full p-1 text-xs">
                            <InfoIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                            <span className="sr-only">Show prediction factors</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-3 text-left">
                            <h4 className="font-medium">Prediction Factors for {driver.fullName}</h4>
                            
                            <div className="space-y-2">
                              <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-sm">
                                <div>Team Strength ({predictions[index].calculationFactors.team.weight})</div>
                                <div className="text-right">{predictions[index].calculationFactors.team.score}/10</div>
                                <div className="text-right text-green-600">+{predictions[index].calculationFactors.team.contribution}</div>
                              </div>
                              
                              <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-sm">
                                <div>Driver Skill ({predictions[index].calculationFactors.skill.weight})</div>
                                <div className="text-right">{predictions[index].calculationFactors.skill.score}/10</div>
                                <div className="text-right text-green-600">+{predictions[index].calculationFactors.skill.contribution}</div>
                              </div>
                              
                              <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-sm">
                                <div>Current Form ({predictions[index].calculationFactors.form.weight})</div>
                                <div className="text-right">{predictions[index].calculationFactors.form.score}/10</div>
                                <div className="text-right text-green-600">+{predictions[index].calculationFactors.form.contribution}</div>
                              </div>
                              
                              <div className="grid grid-cols-[1fr_auto] gap-2 text-sm">
                                <div>Circuit Advantage</div>
                                <div className="text-right">
                                  {predictions[index].calculationFactors.circuit.description === "Advantage" 
                                    ? <span className="text-green-600">+{parseFloat(predictions[index].calculationFactors.circuit.advantage) > 1 
                                        ? `${Math.round((parseFloat(predictions[index].calculationFactors.circuit.advantage) - 1) * 100)}%` 
                                        : '0%'}</span>
                                    : <span>0%</span>
                                  }
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-[1fr_auto] gap-2 text-sm">
                                <div>Rookie Status</div>
                                <div className="text-right">
                                  {predictions[index].calculationFactors.rookie === "Yes (-20%)" 
                                    ? <span className="text-red-600">-20%</span>
                                    : <span>No penalty</span>
                                  }
                                </div>
                              </div>
                              
                              <div className="pt-2 border-t">
                                <div className="grid grid-cols-[1fr_auto] gap-2 text-sm font-medium">
                                  <div>Total Score</div>
                                  <div className="text-right">{predictions[index].calculationFactors.totalScore}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  
                  {driver.note && (
                    <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 italic">
                      {driver.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prediction Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-4xl font-bold mb-3">{confidence}%</div>
              <Progress value={confidence} className="w-full h-2" />
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Based on historical data, current form, and team performance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}