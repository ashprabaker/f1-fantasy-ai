"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getMarketDriversAction } from "@/actions/db/market-data-actions"
import { SelectMarketDriver } from "@/db/schema"

interface DriverSelectorProps {
  onSelect: (driverId: string) => void
  selectedYear?: number
}

export function DriverSelector({ onSelect }: DriverSelectorProps) {
  const [drivers, setDrivers] = useState<SelectMarketDriver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Load drivers from market data (database)
  useEffect(() => {
    async function loadDrivers() {
      try {
        setIsLoading(true)
        const result = await getMarketDriversAction()
        
        if (result.isSuccess && result.data) {
          // Sort drivers by name
          const sortedDrivers = [...result.data].sort((a, b) => 
            a.name.localeCompare(b.name)
          )
          setDrivers(sortedDrivers)
        } else {
          setDrivers([])
        }
      } catch (error) {
        console.error("Error loading market drivers:", error)
        setDrivers([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDrivers()
  }, [])
  
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />
  }
  
  if (drivers.length === 0) {
    return <div className="text-sm text-muted-foreground">No drivers available</div>
  }
  
  return (
    <Select onValueChange={(id) => onSelect(drivers.find(d => d.id === id)?.name || id)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a driver" />
      </SelectTrigger>
      <SelectContent>
        {drivers.map((driver) => (
          <SelectItem key={driver.id} value={driver.id}>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: driver.teamColor || "#666" }}
              />
              {driver.name} ({driver.team})
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}