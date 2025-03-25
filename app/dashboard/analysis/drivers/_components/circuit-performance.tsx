"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DriverPerformance } from "@/types"

interface CircuitPerformanceProps {
  circuitPerformance: DriverPerformance['circuitPerformance']
}

export function CircuitPerformance({ circuitPerformance }: CircuitPerformanceProps) {
  const [searchTerm, setSearchTerm] = useState("")
  
  // Convert circuit performance object to array for easier filtering/sorting
  const circuits = Object.entries(circuitPerformance).map(([circuitId, data]) => ({
    id: circuitId,
    name: getCircuitName(circuitId),
    avgPosition: data.avgPosition,
    bestPosition: data.bestPosition,
    appearances: data.appearances
  }))

  // Filter circuits based on search term
  const filteredCircuits = circuits.filter(circuit => 
    circuit.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort circuits by best performance (lowest average position)
  const sortedCircuits = filteredCircuits.sort((a, b) => a.avgPosition - b.avgPosition)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Circuit Performance</h3>
      
      <div>
        <Input
          placeholder="Search circuits..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Circuit</TableHead>
              <TableHead className="text-right">Average Position</TableHead>
              <TableHead className="text-right">Best Position</TableHead>
              <TableHead className="text-right">Appearances</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCircuits.map((circuit) => (
              <TableRow key={circuit.id}>
                <TableCell className="font-medium">{circuit.name}</TableCell>
                <TableCell className="text-right">P{circuit.avgPosition.toFixed(1)}</TableCell>
                <TableCell className="text-right">P{circuit.bestPosition}</TableCell>
                <TableCell className="text-right">{circuit.appearances}</TableCell>
              </TableRow>
            ))}
            {sortedCircuits.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No circuit data found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Helper function to get circuit readable name from ID
function getCircuitName(circuitId: string): string {
  const circuitNames: Record<string, string> = {
    "albert_park": "Melbourne (Australia)",
    "americas": "COTA (USA)",
    "bahrain": "Bahrain",
    "baku": "Baku (Azerbaijan)",
    "catalunya": "Barcelona (Spain)",
    "hungaroring": "Hungaroring (Hungary)",
    "imola": "Imola (Italy)",
    "interlagos": "Interlagos (Brazil)",
    "jeddah": "Jeddah (Saudi Arabia)",
    "las_vegas": "Las Vegas (USA)",
    "losail": "Losail (Qatar)",
    "marina_bay": "Marina Bay (Singapore)",
    "miami": "Miami (USA)",
    "monaco": "Monaco",
    "monza": "Monza (Italy)",
    "red_bull_ring": "Red Bull Ring (Austria)",
    "rodriguez": "Mexico City (Mexico)",
    "silverstone": "Silverstone (UK)",
    "spa": "Spa-Francorchamps (Belgium)",
    "suzuka": "Suzuka (Japan)",
    "yas_marina": "Yas Marina (Abu Dhabi)",
    "zandvoort": "Zandvoort (Netherlands)"
  }
  
  return circuitNames[circuitId] || circuitId.replace(/_/g, ' ')
} 