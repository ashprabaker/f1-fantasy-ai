"use server"

import { db } from "@/db/db";
import { 
  InsertDriver, 
  InsertConstructor, 
  driversTable, 
  constructorsTable 
} from "@/db/schema";
import { eq } from "drizzle-orm";

// Driver queries
export const addDriverToTeam = async (data: InsertDriver) => {
  try {
    const [driver] = await db.insert(driversTable).values(data).returning();
    return driver;
  } catch (error) {
    console.error("Error adding driver:", error);
    throw new Error("Failed to add driver");
  }
}

export const updateDriver = async (id: string, data: Partial<InsertDriver>) => {
  try {
    const [updatedDriver] = await db
      .update(driversTable)
      .set(data)
      .where(eq(driversTable.id, id))
      .returning();
    return updatedDriver;
  } catch (error) {
    console.error("Error updating driver:", error);
    throw new Error("Failed to update driver");
  }
}

export const removeDriver = async (id: string) => {
  try {
    await db.delete(driversTable).where(eq(driversTable.id, id));
    return true;
  } catch (error) {
    console.error("Error removing driver:", error);
    throw new Error("Failed to remove driver");
  }
}

// Constructor queries
export const addConstructorToTeam = async (data: InsertConstructor) => {
  try {
    const [constructor] = await db.insert(constructorsTable).values(data).returning();
    return constructor;
  } catch (error) {
    console.error("Error adding constructor:", error);
    throw new Error("Failed to add constructor");
  }
}

export const updateConstructor = async (id: string, data: Partial<InsertConstructor>) => {
  try {
    const [updatedConstructor] = await db
      .update(constructorsTable)
      .set(data)
      .where(eq(constructorsTable.id, id))
      .returning();
    return updatedConstructor;
  } catch (error) {
    console.error("Error updating constructor:", error);
    throw new Error("Failed to update constructor");
  }
}

export const removeConstructor = async (id: string) => {
  try {
    await db.delete(constructorsTable).where(eq(constructorsTable.id, id));
    return true;
  } catch (error) {
    console.error("Error removing constructor:", error);
    throw new Error("Failed to remove constructor");
  }
} 