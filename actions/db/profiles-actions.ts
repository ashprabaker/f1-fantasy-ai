"use server"

import { createProfile, getProfile, updateProfile } from "@/db/queries/profiles-queries";
import { InsertProfile, SelectProfile } from "@/db/schema";
import { ActionState } from "@/types";

export async function createProfileAction(
  data: InsertProfile
): Promise<ActionState<SelectProfile>> {
  try {
    const profile = await createProfile(data);
    return {
      isSuccess: true,
      message: "Profile created successfully",
      data: profile
    };
  } catch (error) {
    console.error("Error creating profile:", error);
    return { isSuccess: false, message: "Failed to create profile" };
  }
}

export async function getProfileAction(
  userId: string
): Promise<ActionState<SelectProfile>> {
  try {
    const profile = await getProfile(userId);
    if (!profile) {
      return {
        isSuccess: false,
        message: "Profile not found"
      };
    }
    
    return {
      isSuccess: true,
      message: "Profile retrieved successfully",
      data: profile
    };
  } catch (error) {
    console.error("Error getting profile:", error);
    return { isSuccess: false, message: "Failed to get profile" };
  }
}

export async function updateProfileAction(
  userId: string,
  data: Partial<InsertProfile>
): Promise<ActionState<SelectProfile>> {
  try {
    const updatedProfile = await updateProfile(userId, data);
    return {
      isSuccess: true,
      message: "Profile updated successfully",
      data: updatedProfile
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { isSuccess: false, message: "Failed to update profile" };
  }
} 