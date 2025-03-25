"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getMarketConstructorsAction } from "@/actions/db/market-data-actions"
import { SelectMarketConstructor } from "@/db/schema"

interface TeamSelectorProps {
  onSelect: (teamId: string) => void
  selectedYear?: number
}

export function TeamSelector({ onSelect }: TeamSelectorProps) {
  const [teams, setTeams] = useState<SelectMarketConstructor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Load constructors from market data (database)
  useEffect(() => {
    async function loadTeams() {
      try {
        setIsLoading(true)
        const result = await getMarketConstructorsAction()
        
        if (result.isSuccess && result.data) {
          // Sort teams by name
          const sortedTeams = [...result.data].sort((a, b) => 
            a.name.localeCompare(b.name)
          )
          setTeams(sortedTeams)
        } else {
          setTeams([])
        }
      } catch (error) {
        console.error("Error loading market constructors:", error)
        setTeams([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTeams()
  }, [])
  
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />
  }
  
  if (teams.length === 0) {
    return <div className="text-sm text-muted-foreground">No constructors available</div>
  }
  
  return (
    <Select onValueChange={(id) => onSelect(teams.find(t => t.id === id)?.name || id)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a constructor" />
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: team.color || "#666" }}
              />
              {team.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}