"use server"

import {
  addDriverToTeam,
  updateDriver,
  removeDriver,
  addConstructorToTeam,
  updateConstructor,
  removeConstructor
} from "@/db/queries/team-members-queries";
import {
  InsertDriver,
  SelectDriver,
  InsertConstructor,
  SelectConstructor
} from "@/db/schema";
import { ActionState } from "@/types";
import { revalidatePath } from "next/cache";

// Driver actions
export async function addDriverAction(
  data: InsertDriver
): Promise<ActionState<SelectDriver>> {
  try {
    const driver = await addDriverToTeam(data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Driver added successfully",
      data: driver
    };
  } catch (error) {
    console.error("Error adding driver:", error);
    return { isSuccess: false, message: "Failed to add driver" };
  }
}

export async function updateDriverAction(
  id: string,
  data: Partial<InsertDriver>
): Promise<ActionState<SelectDriver>> {
  try {
    const updatedDriver = await updateDriver(id, data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Driver updated successfully",
      data: updatedDriver
    };
  } catch (error) {
    console.error("Error updating driver:", error);
    return { isSuccess: false, message: "Failed to update driver" };
  }
}

export async function removeDriverAction(
  id: string
): Promise<ActionState<boolean>> {
  try {
    await removeDriver(id);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Driver removed successfully",
      data: true
    };
  } catch (error) {
    console.error("Error removing driver:", error);
    return { isSuccess: false, message: "Failed to remove driver" };
  }
}

// Constructor actions
export async function addConstructorAction(
  data: InsertConstructor
): Promise<ActionState<SelectConstructor>> {
  try {
    const constructor = await addConstructorToTeam(data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Constructor added successfully",
      data: constructor
    };
  } catch (error) {
    console.error("Error adding constructor:", error);
    return { isSuccess: false, message: "Failed to add constructor" };
  }
}

export async function updateConstructorAction(
  id: string,
  data: Partial<InsertConstructor>
): Promise<ActionState<SelectConstructor>> {
  try {
    const updatedConstructor = await updateConstructor(id, data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Constructor updated successfully",
      data: updatedConstructor
    };
  } catch (error) {
    console.error("Error updating constructor:", error);
    return { isSuccess: false, message: "Failed to update constructor" };
  }
}

export async function removeConstructorAction(
  id: string
): Promise<ActionState<boolean>> {
  try {
    await removeConstructor(id);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Constructor removed successfully",
      data: true
    };
  } catch (error) {
    console.error("Error removing constructor:", error);
    return { isSuccess: false, message: "Failed to remove constructor" };
  }
} 