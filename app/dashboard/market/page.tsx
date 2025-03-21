"use server"

import { getMarketDriversAction, getMarketConstructorsAction } from "@/actions/db/market-data-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@clerk/nextjs/server"
import SyncF1DataButton from "./_components/sync-f1-data-button"
import { SelectMarketDriver, SelectMarketConstructor } from "@/db/schema"
import Image from "next/image"

export default async function MarketPage() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }
  
  const [driversResult, constructorsResult] = await Promise.all([
    getMarketDriversAction(),
    getMarketConstructorsAction()
  ])
  
  const drivers: SelectMarketDriver[] = driversResult.isSuccess && driversResult.data ? driversResult.data : []
  const constructors: SelectMarketConstructor[] = constructorsResult.isSuccess && constructorsResult.data ? constructorsResult.data : []
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">F1 Market</h2>
          <p className="text-muted-foreground">
            Current driver and constructor data from the F1 season
          </p>
        </div>
        <SyncF1DataButton />
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Drivers</CardTitle>
            <CardDescription>Current F1 drivers sorted by points</CardDescription>
          </CardHeader>
          <CardContent>
            {drivers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No driver data available. Click the &quot;Sync F1 Data&quot; button to fetch the latest information.
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b px-4 py-3 font-medium">
                  <div className="col-span-1">No.</div>
                  <div className="col-span-3">Driver</div>
                  <div className="col-span-3">Team</div>
                  <div className="col-span-2 text-right">Points</div>
                  <div className="col-span-2 text-right">Price ($M)</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="divide-y">
                  {drivers.map(driver => (
                    <div key={driver.id} className="grid grid-cols-12 px-4 py-3 items-center">
                      <div className="col-span-1">{driver.driverNumber}</div>
                      <div className="col-span-3 font-medium flex items-center gap-2">
                        {driver.imageUrl && (
                          <div className="h-8 w-8 rounded-full overflow-hidden">
                            <Image 
                              src={driver.imageUrl}
                              alt={driver.name}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <span>{driver.name}</span>
                      </div>
                      <div 
                        className="col-span-3 flex items-center"
                        style={{ color: driver.teamColor ? `#${driver.teamColor}` : undefined }}
                      >
                        {driver.team}
                      </div>
                      <div className="col-span-2 text-right">{driver.points}</div>
                      <div className="col-span-2 text-right">${driver.price}M</div>
                      <div className="col-span-1"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Constructors</CardTitle>
            <CardDescription>Current F1 constructors sorted by points</CardDescription>
          </CardHeader>
          <CardContent>
            {constructors.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No constructor data available. Click the &quot;Sync F1 Data&quot; button to fetch the latest information.
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b px-4 py-3 font-medium">
                  <div className="col-span-4">Constructor</div>
                  <div className="col-span-4 text-right">Points</div>
                  <div className="col-span-3 text-right">Price ($M)</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="divide-y">
                  {constructors.map(constructor => (
                    <div key={constructor.id} className="grid grid-cols-12 px-4 py-3 items-center">
                      <div 
                        className="col-span-4 font-medium"
                        style={{ color: constructor.color ? `#${constructor.color}` : undefined }}
                      >
                        {constructor.name}
                      </div>
                      <div className="col-span-4 text-right">{constructor.points}</div>
                      <div className="col-span-3 text-right">${constructor.price}M</div>
                      <div className="col-span-1"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 