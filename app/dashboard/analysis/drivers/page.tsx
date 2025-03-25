import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DriverSelectorFetcher } from "./_server/driver-selector-fetcher"
import { DriverPerformanceFetcher } from "./_server/driver-performance-fetcher"

export default function DriversPage({
  searchParams
}: {
  searchParams: { driver?: string }
}) {
  const driverId = searchParams?.driver || ""
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Driver Performance Analysis</CardTitle>
          <CardDescription>
            Select a driver to view detailed performance statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-10 w-[250px]" />}>
            <DriverSelectorFetcher defaultDriver={driverId} />
          </Suspense>
        </CardContent>
      </Card>

      {driverId && (
        <Suspense fallback={<DriverPerformanceSkeleton />}>
          <DriverPerformanceFetcher driverId={driverId} />
        </Suspense>
      )}
    </div>
  )
}

function DriverPerformanceSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-64" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  )
} 