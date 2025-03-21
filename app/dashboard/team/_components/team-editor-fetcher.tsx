"use server"

import { getUserTeamAction } from "@/actions/db/teams-actions"
import { getMarketDriversAction, getMarketConstructorsAction } from "@/actions/db/market-data-actions"
import { TeamEditor } from "./team-editor"
import { db } from "@/db/db"
import { driversTable, constructorsTable, SelectDriver, SelectConstructor } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function TeamEditorFetcher({ userId }: { userId: string }) {
  const [teamResult, driversResult, constructorsResult] = await Promise.all([
    getUserTeamAction(userId),
    getMarketDriversAction(),
    getMarketConstructorsAction()
  ])
  
  const marketDrivers = driversResult.isSuccess && driversResult.data ? driversResult.data : []
  const marketConstructors = constructorsResult.isSuccess && constructorsResult.data ? constructorsResult.data : []
  
  // Fetch team members if team exists
  let teamDrivers: SelectDriver[] = []
  let teamConstructors: SelectConstructor[] = []
  
  if (teamResult.isSuccess && teamResult.data) {
    const teamId = teamResult.data.id
    
    // Fetch team drivers and constructors
    const [drivers, constructors] = await Promise.all([
      db.select().from(driversTable).where(eq(driversTable.teamId, teamId)),
      db.select().from(constructorsTable).where(eq(constructorsTable.teamId, teamId))
    ])
    
    teamDrivers = drivers
    teamConstructors = constructors
  }
  
  return (
    <TeamEditor
      userId={userId}
      team={teamResult.isSuccess ? teamResult.data : undefined}
      marketDrivers={marketDrivers}
      marketConstructors={marketConstructors}
      teamDrivers={teamDrivers}
      teamConstructors={teamConstructors}
    />
  )
} 