"use server"

import { db } from "@/db/db";
import { 
  InsertRace,
  InsertRaceResult,
  racesTable,
  raceResultsTable
} from "@/db/schema";
import { eq } from "drizzle-orm";

// Race queries
export const createRace = async (data: InsertRace) => {
  try {
    const [race] = await db.insert(racesTable).values(data).returning();
    return race;
  } catch (error) {
    console.error("Error creating race:", error);
    throw new Error("Failed to create race");
  }
}

export const getAllRaces = async () => {
  try {
    return await db.query.races.findMany({
      orderBy: (races, { desc, asc }) => [desc(races.season), asc(races.round)]
    });
  } catch (error) {
    console.error("Error getting races:", error);
    throw new Error("Failed to get races");
  }
}

// Race results queries
export const addRaceResult = async (data: InsertRaceResult) => {
  try {
    const [result] = await db.insert(raceResultsTable).values(data).returning();
    return result;
  } catch (error) {
    console.error("Error adding race result:", error);
    throw new Error("Failed to add race result");
  }
}

export const getRaceResults = async (raceId: string) => {
  try {
    return await db.query.raceResults.findMany({
      where: eq(raceResultsTable.raceId, raceId),
      orderBy: (results, { asc }) => [asc(results.position)]
    });
  } catch (error) {
    console.error("Error getting race results:", error);
    throw new Error("Failed to get race results");
  }
} 