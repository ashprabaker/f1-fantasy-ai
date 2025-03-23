"use server"

import { db } from "@/db/db";
import { eq, desc } from "drizzle-orm";
import { 
  InsertMarketDriver, 
  InsertMarketConstructor, 
  marketDriversTable, 
  marketConstructorsTable 
} from "@/db/schema";

// Market Drivers CRUD

export const getMarketDrivers = async () => {
  try {
    return await db
      .select()
      .from(marketDriversTable)
      .orderBy(desc(marketDriversTable.points));
  } catch (error: any) {
    console.error("[F1-SYNC] Error getting market drivers:", error);
    // Log detailed error info
    if (error.response) {
      console.error("[F1-SYNC] Response error data:", {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    } else if (error.request) {
      console.error("[F1-SYNC] Request error:", error.request);
    }
    console.error("[F1-SYNC] Error stack:", error.stack);
    throw new Error("Failed to get market drivers");
  }
}

export const getMarketDriver = async (id: string) => {
  try {
    const results = await db
      .select()
      .from(marketDriversTable)
      .where(eq(marketDriversTable.id, id))
      .limit(1);
    return results[0];
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
    return await db
      .select()
      .from(marketConstructorsTable)
      .orderBy(desc(marketConstructorsTable.points));
  } catch (error: any) {
    console.error("[F1-SYNC] Error getting market constructors:", error);
    // Log detailed error info
    if (error.response) {
      console.error("[F1-SYNC] Response error data:", {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    } else if (error.request) {
      console.error("[F1-SYNC] Request error:", error.request);
    }
    console.error("[F1-SYNC] Error stack:", error.stack);
    throw new Error("Failed to get market constructors");
  }
}

export const getMarketConstructor = async (id: string) => {
  try {
    const results = await db
      .select()
      .from(marketConstructorsTable)
      .where(eq(marketConstructorsTable.id, id))
      .limit(1);
    return results[0];
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