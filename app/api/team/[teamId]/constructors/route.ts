import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db/db"
import { constructorsTable } from "@/db/schema"
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
    // Fetch constructors for this team
    const constructors = await db.select().from(constructorsTable).where(eq(constructorsTable.teamId, teamId))
    
    return NextResponse.json(constructors)
  } catch (error) {
    console.error("Error fetching team constructors:", error)
    return NextResponse.json(
      { error: "Failed to fetch team constructors" }, 
      { status: 500 }
    )
  }
}