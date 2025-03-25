"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DriverFormEntry {
  driver: string
  team: string
  lastFive: (number | string)[] // Recent race positions
  trend: "up" | "down" | "neutral" | string
  formRating: number | string // 0-100 rating or "N/A"
  rookieNote?: string
}

interface DriverFormProps {
  driverForm: DriverFormEntry[]
}

export default function DriverForm({ driverForm }: DriverFormProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Last 5 Races</TableHead>
            <TableHead>Form</TableHead>
            <TableHead className="text-right">Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {driverForm.map((driver, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{driver.driver}</TableCell>
              <TableCell>{driver.team}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {Array.isArray(driver.lastFive) && driver.lastFive[0] !== "N/A" 
                    ? driver.lastFive.map((position, idx) => (
                        <FormBadge key={idx} position={position} />
                      ))
                    : <span className="text-sm italic text-muted-foreground">No historical data</span>
                  }
                </div>
              </TableCell>
              <TableCell>
                <FormTrend trend={driver.trend} />
              </TableCell>
              <TableCell className="text-right">
                {driver.formRating !== "N/A" 
                  ? <FormRating rating={driver.formRating as number} />
                  : <span className="text-gray-500">N/A</span>
                }
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
    </div>
  )
}

function FormBadge({ position }: { position: number | string }) {
  let variant = "default"
  
  if (position === 1 || position === "1") {
    variant = "destructive" // First place (gold)
  } else if (typeof position === 'number' && position <= 3) {
    variant = "secondary" // Podium (silver)
  } else if (typeof position === 'number' && position <= 10) {
    variant = "outline" // Points (bronze)
  }
  
  return (
    <Badge variant={variant as "default" | "destructive" | "secondary" | "outline"} className="w-6 h-6 flex items-center justify-center p-0">
      {position}
    </Badge>
  )
}

function FormTrend({ trend }: { trend: "up" | "down" | "neutral" | string }) {
  if (trend === "up") {
    return (
      <div className="flex items-center text-green-500">
        <ArrowUpIcon className="mr-1 h-4 w-4" />
        Rising
      </div>
    )
  } else if (trend === "down") {
    return (
      <div className="flex items-center text-red-500">
        <ArrowDownIcon className="mr-1 h-4 w-4" />
        Falling
      </div>
    )
  } else {
    return (
      <div className="flex items-center text-gray-500">
        <MinusIcon className="mr-1 h-4 w-4" />
        Stable
      </div>
    )
  }
}

function FormRating({ rating }: { rating: number }) {
  let color = "text-gray-500"
  
  if (rating >= 80) {
    color = "text-green-500 font-bold"
  } else if (rating >= 60) {
    color = "text-blue-500"
  } else if (rating >= 40) {
    color = "text-yellow-500"
  } else if (rating >= 20) {
    color = "text-orange-500"
  } else {
    color = "text-red-500"
  }
  
  return <span className={color}>{rating}/100</span>
}