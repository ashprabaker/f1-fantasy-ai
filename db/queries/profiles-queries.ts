"use server"

import { db } from "@/db/db";
import { InsertProfile, profilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createProfile = async (data: InsertProfile) => {
  try {
    const [profile] = await db.insert(profilesTable).values(data).returning();
    return profile;
  } catch (error) {
    console.error("Error creating profile:", error);
    throw new Error("Failed to create profile");
  }
}

export const getProfile = async (userId: string) => {
  try {
    return await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, userId)
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    throw new Error("Failed to get profile");
  }
}

export const updateProfile = async (userId: string, data: Partial<InsertProfile>) => {
  try {
    const [updatedProfile] = await db
      .update(profilesTable)
      .set(data)
      .where(eq(profilesTable.userId, userId))
      .returning();
    return updatedProfile;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
}

export const updateProfileByStripeCustomerId = async (
  stripeCustomerId: string,
  data: Partial<InsertProfile>
) => {
  try {
    const [updatedProfile] = await db
      .update(profilesTable)
      .set(data)
      .where(eq(profilesTable.stripeCustomerId, stripeCustomerId))
      .returning();
    return updatedProfile;
  } catch (error) {
    console.error("Error updating profile by stripe customer ID:", error);
    throw new Error("Failed to update profile by stripe customer ID");
  }
} 