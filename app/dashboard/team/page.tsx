"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { TeamEditorFetcher } from "./_components/team-editor-fetcher"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default async function TeamPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/login")
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Team</h2>
        <p className="text-muted-foreground">
          Create and manage your F1 Fantasy team. Remember to follow the rules: 5 drivers, 2 constructors, and a 100M budget cap.
        </p>
      </div>
      
      <Suspense fallback={<TeamEditorSkeleton />}>
        <TeamEditorFetcher userId={userId} />
      </Suspense>
    </div>
  )
}

function TeamEditorSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-36" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-60" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-8 w-32" />
        </div>
      </CardContent>
    </Card>
  )
} 