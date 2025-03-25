import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db/db"
import { driversTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

export async function GET(req: NextRequest): Promise<Response> {
  // Authorize request
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Extract teamId from URL using the context API
  // For Next.js 15, we need to manually get it from the URL
  const url = new URL(req.url)
  
  // Match the pattern /api/team/[teamId]/drivers
  const regex = /\/api\/team\/([^\/]+)\/drivers/;
  const match = url.pathname.match(regex);
  
  // Debug URL path parsing
  console.log('URL pathname:', url.pathname);
  console.log('Regex match:', match);
  
  // Extract the teamId from the regex match
  const teamId = match ? match[1] : null;
  console.log('Extracted teamId:', teamId);
  
  if (!teamId) {
    return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
  }
  
  try {
    // Fetch drivers for this team
    const drivers = await db.select().from(driversTable).where(eq(driversTable.teamId, teamId))
    
    return NextResponse.json(drivers)
  } catch (error) {
    console.error("Error fetching team drivers:", error)
    return NextResponse.json(
      { error: "Failed to fetch team drivers" }, 
      { status: 500 }
    )
  }
}