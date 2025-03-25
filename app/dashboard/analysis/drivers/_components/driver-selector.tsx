"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DriverSelectorProps {
  initialDrivers?: { driverId: string; fullName: string }[]
  defaultDriver?: string
}

export function DriverSelector({ initialDrivers = [], defaultDriver }: DriverSelectorProps) {
  const [open, setOpen] = useState(false)
  const [drivers, setDrivers] = useState<Array<{ driverId: string; fullName: string }>>(
    Array.isArray(initialDrivers) ? initialDrivers : []
  )
  const [selectedDriver, setSelectedDriver] = useState(defaultDriver || "")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (defaultDriver) {
      setSelectedDriver(defaultDriver)
    }
  }, [defaultDriver])

  const handleDriverSelect = (driverId: string) => {
    setSelectedDriver(driverId)
    setOpen(false)
    
    // Update URL to include selected driver
    const params = new URLSearchParams(searchParams.toString())
    params.set("driver", driverId)
    router.push(`/analysis/drivers?${params.toString()}`)
  }

  const selectedDriverName = drivers.find(d => d.driverId === selectedDriver)?.fullName || ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-[250px] justify-between"
        >
          {selectedDriverName || "Select a driver..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search drivers..." />
          <CommandEmpty>No driver found.</CommandEmpty>
          <CommandGroup>
            {drivers.map((driver) => (
              <CommandItem
                key={driver.driverId}
                value={driver.driverId}
                onSelect={handleDriverSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedDriver === driver.driverId ? "opacity-100" : "opacity-0"
                  )}
                />
                {driver.fullName}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 