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

export async function fixSubscriptionMembershipAction(
  userId: string
): Promise<ActionState<SelectProfile>> {
  try {
    // First get the profile to check if they have a subscription ID but not pro status
    const profile = await getProfile(userId);
    
    if (!profile) {
      return {
        isSuccess: false,
        message: "Profile not found"
      };
    }
    
    // If they already have pro membership, no fix needed
    if (profile.membership === "pro") {
      return {
        isSuccess: true,
        message: "User already has pro membership",
        data: profile
      };
    }
    
    // If they have a subscription ID but aren't marked as pro, fix it
    if (profile.stripeSubscriptionId) {
      // Import stripe dynamically to avoid server/client issues
      const { stripe } = await import("@/lib/stripe");
      
      try {
        // Check if the subscription is active
        const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
        
        if (subscription.status === "active" || subscription.status === "trialing") {
          // Update the profile to pro
          const updatedProfile = await updateProfile(userId, {
            membership: "pro"
          });
          
          return {
            isSuccess: true,
            message: "Fixed subscription membership status",
            data: updatedProfile
          };
        }
      } catch (stripeError) {
        console.error("Error checking subscription:", stripeError);
        // If we can't retrieve the subscription, it might be invalid
      }
    }
    
    return {
      isSuccess: false,
      message: "No valid subscription found to fix",
      data: profile
    };
  } catch (error) {
    console.error("Error fixing subscription membership:", error);
    return { isSuccess: false, message: "Failed to fix subscription membership" };
  }
} 