"use server"

import { getDriversAction } from "@/actions/analysis/driver-actions"
import { DriverSelector } from "../_components/driver-selector"

export async function DriverSelectorFetcher({ defaultDriver }: { defaultDriver?: string }) {
  try {
    const { data, isSuccess } = await getDriversAction()
    
    // Ensure we have a valid array of drivers
    const drivers = isSuccess && Array.isArray(data) ? data : []
    
    return (
      <DriverSelector initialDrivers={drivers} defaultDriver={defaultDriver} />
    )
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return <DriverSelector initialDrivers={[]} defaultDriver={defaultDriver} />
  }
} 