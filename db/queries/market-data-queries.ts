"use server"

import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { 
  InsertMarketDriver, 
  InsertMarketConstructor, 
  marketDriversTable, 
  marketConstructorsTable 
} from "@/db/schema";

// Market Drivers CRUD

export const getMarketDrivers = async () => {
  try {
    return await db.query.marketDrivers.findMany({
      orderBy: (marketDrivers, { desc }) => [desc(marketDrivers.points)]
    });
  } catch (error) {
    console.error("Error getting market drivers:", error);
    throw new Error("Failed to get market drivers");
  }
}

export const getMarketDriver = async (id: string) => {
  try {
    return await db.query.marketDrivers.findFirst({
      where: eq(marketDriversTable.id, id)
    });
  } catch (error) {
    console.error("Error getting market driver:", error);
    throw new Error("Failed to get market driver");
  }
}

export const createMarketDriver = async (data: InsertMarketDriver) => {
  try {
    const [newDriver] = await db.insert(marketDriversTable).values(data).returning();
    return newDriver;
  } catch (error) {
    console.error("Error creating market driver:", error);
    throw new Error("Failed to create market driver");
  }
}

export const updateMarketDriver = async (id: string, data: Partial<InsertMarketDriver>) => {
  try {
    const [updatedDriver] = await db
      .update(marketDriversTable)
      .set(data)
      .where(eq(marketDriversTable.id, id))
      .returning();
    return updatedDriver;
  } catch (error) {
    console.error("Error updating market driver:", error);
    throw new Error("Failed to update market driver");
  }
}

export const deleteMarketDriver = async (id: string) => {
  try {
    await db.delete(marketDriversTable).where(eq(marketDriversTable.id, id));
    return true;
  } catch (error) {
    console.error("Error deleting market driver:", error);
    throw new Error("Failed to delete market driver");
  }
}

// Market Constructors CRUD

export const getMarketConstructors = async () => {
  try {
    return await db.query.marketConstructors.findMany({
      orderBy: (marketConstructors, { desc }) => [desc(marketConstructors.points)]
    });
  } catch (error) {
    console.error("Error getting market constructors:", error);
    throw new Error("Failed to get market constructors");
  }
}

export const getMarketConstructor = async (id: string) => {
  try {
    return await db.query.marketConstructors.findFirst({
      where: eq(marketConstructorsTable.id, id)
    });
  } catch (error) {
    console.error("Error getting market constructor:", error);
    throw new Error("Failed to get market constructor");
  }
}

export const createMarketConstructor = async (data: InsertMarketConstructor) => {
  try {
    const [newConstructor] = await db.insert(marketConstructorsTable).values(data).returning();
    return newConstructor;
  } catch (error) {
    console.error("Error creating market constructor:", error);
    throw new Error("Failed to create market constructor");
  }
}

export const updateMarketConstructor = async (id: string, data: Partial<InsertMarketConstructor>) => {
  try {
    const [updatedConstructor] = await db
      .update(marketConstructorsTable)
      .set(data)
      .where(eq(marketConstructorsTable.id, id))
      .returning();
    return updatedConstructor;
  } catch (error) {
    console.error("Error updating market constructor:", error);
    throw new Error("Failed to update market constructor");
  }
}

export const deleteMarketConstructor = async (id: string) => {
  try {
    await db.delete(marketConstructorsTable).where(eq(marketConstructorsTable.id, id));
    return true;
  } catch (error) {
    console.error("Error deleting market constructor:", error);
    throw new Error("Failed to delete market constructor");
  }
}

// Bulk update method
export const updateMarketData = async (
  drivers: InsertMarketDriver[],
  constructors: InsertMarketConstructor[]
) => {
  try {
    // Clear existing data
    await db.delete(marketDriversTable);
    await db.delete(marketConstructorsTable);
    
    // Insert new data
    await db.insert(marketDriversTable).values(drivers);
    await db.insert(marketConstructorsTable).values(constructors);
    
    return true;
  } catch (error) {
    console.error("Error updating market data:", error);
    throw new Error("Failed to update market data");
  }
} 