import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db/db"
import { driversTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  // Authorize request
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const teamId = params.teamId
  
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