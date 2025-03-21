"use server"

import { createTeam, getUserTeam, updateTeam, deleteTeam } from "@/db/queries/teams-queries";
import { InsertTeam, SelectTeam } from "@/db/schema";
import { ActionState } from "@/types";
import { revalidatePath } from "next/cache";

export async function createTeamAction(
  data: InsertTeam
): Promise<ActionState<SelectTeam>> {
  try {
    const team = await createTeam(data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Team created successfully",
      data: team
    };
  } catch (error) {
    console.error("Error creating team:", error);
    return { isSuccess: false, message: "Failed to create team" };
  }
}

export async function getUserTeamAction(
  userId: string
): Promise<ActionState<SelectTeam>> {
  try {
    const team = await getUserTeam(userId);
    if (!team) {
      return {
        isSuccess: false,
        message: "Team not found"
      };
    }
    
    return {
      isSuccess: true,
      message: "Team retrieved successfully",
      data: team
    };
  } catch (error) {
    console.error("Error getting user team:", error);
    return { isSuccess: false, message: "Failed to get user team" };
  }
}

export async function updateTeamAction(
  id: string,
  data: Partial<InsertTeam>
): Promise<ActionState<SelectTeam>> {
  try {
    const updatedTeam = await updateTeam(id, data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Team updated successfully",
      data: updatedTeam
    };
  } catch (error) {
    console.error("Error updating team:", error);
    return { isSuccess: false, message: "Failed to update team" };
  }
}

export async function deleteTeamAction(
  id: string
): Promise<ActionState<boolean>> {
  try {
    await deleteTeam(id);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Team deleted successfully",
      data: true
    };
  } catch (error) {
    console.error("Error deleting team:", error);
    return { isSuccess: false, message: "Failed to delete team" };
  }
} 