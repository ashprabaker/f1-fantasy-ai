"use server"

import { db } from "@/db/db";
import { InsertTeam, teamsTable, driversTable, constructorsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createTeam = async (data: InsertTeam) => {
  try {
    const [team] = await db.insert(teamsTable).values(data).returning();
    return team;
  } catch (error) {
    console.error("Error creating team:", error);
    throw new Error("Failed to create team");
  }
}

export const getUserTeam = async (userId: string) => {
  try {
    // First get the team
    const team = await db.query.teams.findFirst({
      where: eq(teamsTable.userId, userId)
    });
    
    if (!team) {
      return null;
    }
    
    // Then get associated drivers and constructors
    const drivers = await db.select().from(driversTable).where(eq(driversTable.teamId, team.id));
    const constructors = await db.select().from(constructorsTable).where(eq(constructorsTable.teamId, team.id));
    
    // Return everything together
    return {
      ...team,
      drivers,
      constructors
    };
  } catch (error) {
    console.error("Error getting user team:", error);
    throw new Error("Failed to get user team");
  }
}

export const updateTeam = async (id: string, data: Partial<InsertTeam>) => {
  try {
    const [updatedTeam] = await db
      .update(teamsTable)
      .set(data)
      .where(eq(teamsTable.id, id))
      .returning();
    return updatedTeam;
  } catch (error) {
    console.error("Error updating team:", error);
    throw new Error("Failed to update team");
  }
}

export const deleteTeam = async (id: string) => {
  try {
    await db.delete(teamsTable).where(eq(teamsTable.id, id));
    return true;
  } catch (error) {
    console.error("Error deleting team:", error);
    throw new Error("Failed to delete team");
  }
} 