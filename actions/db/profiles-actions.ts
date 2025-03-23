"use server"

import { createProfile, getProfile, updateProfile } from "@/db/queries/profiles-queries";
import { InsertProfile, SelectProfile } from "@/db/schema";
import { ActionState } from "@/types";

// Rate limit configuration
const FREE_RECOMMENDATION_LIMIT = 5; // 5 recommendations per day for free users
const PRO_RECOMMENDATION_LIMIT = 20; // 20 recommendations per day for pro users
const FREE_SYNC_LIMIT = 3; // 3 syncs per day for free users
const PRO_SYNC_LIMIT = 10; // 10 syncs per day for pro users
const DAY_IN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const HOUR_IN_MS = 60 * 60 * 1000; // 1 hour in milliseconds

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

export async function checkRecommendationRateLimitAction(
  userId: string
): Promise<ActionState<{canMakeRequest: boolean; resetTime: Date | null; requestsRemaining: number}>> {
  try {
    const profile = await getProfile(userId);
    
    if (!profile) {
      return {
        isSuccess: false,
        message: "Profile not found",
        data: {
          canMakeRequest: false,
          resetTime: null,
          requestsRemaining: 0
        }
      };
    }
    
    const now = new Date();
    const isPro = profile.membership === "pro";
    const dailyLimit = isPro ? PRO_RECOMMENDATION_LIMIT : FREE_RECOMMENDATION_LIMIT;
    
    // Check if last recommendation was today
    if (profile.lastRecommendationAt) {
      const lastRecommendation = new Date(profile.lastRecommendationAt);
      const isToday = now.getTime() - lastRecommendation.getTime() < DAY_IN_MS;
      
      if (isToday) {
        // User has made requests today, check count against limit
        const count = profile.recommendationCount || 0;
        
        if (count >= dailyLimit) {
          // Rate limit exceeded
          // Calculate reset time (next day from first request)
          const resetTime = new Date(lastRecommendation.getTime() + DAY_IN_MS);
          
          return {
            isSuccess: true,
            message: `Rate limit exceeded. You can make ${dailyLimit} requests per day.`,
            data: {
              canMakeRequest: false,
              resetTime,
              requestsRemaining: 0
            }
          };
        }
        
        // User still has requests available today
        return {
          isSuccess: true,
          message: `${dailyLimit - count} recommendation requests remaining today`,
          data: {
            canMakeRequest: true,
            resetTime: new Date(lastRecommendation.getTime() + DAY_IN_MS),
            requestsRemaining: dailyLimit - count
          }
        };
      }
    }
    
    // No recent requests or they were from a previous day
    return {
      isSuccess: true,
      message: `${dailyLimit} recommendation requests available`,
      data: {
        canMakeRequest: true,
        resetTime: null,
        requestsRemaining: dailyLimit
      }
    };
  } catch (error) {
    console.error("Error checking recommendation rate limit:", error);
    return { 
      isSuccess: false,
      message: "Failed to check rate limit",
      data: {
        canMakeRequest: false,
        resetTime: null,
        requestsRemaining: 0
      }
    };
  }
}

export async function updateRecommendationUsageAction(
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
    
    const now = new Date();
    const currentCount = profile.recommendationCount || 0;
    
    // Check if last recommendation was today
    let newCount = 1;
    if (profile.lastRecommendationAt) {
      const lastRecommendation = new Date(profile.lastRecommendationAt);
      const isToday = now.getTime() - lastRecommendation.getTime() < DAY_IN_MS;
      
      if (isToday) {
        // Increment count
        newCount = currentCount + 1;
      }
    }
    
    // Update profile with new count and timestamp
    const updatedProfile = await updateProfile(userId, {
      lastRecommendationAt: now,
      recommendationCount: newCount
    });
    
    return {
      isSuccess: true,
      message: "Recommendation usage updated",
      data: updatedProfile
    };
  } catch (error) {
    console.error("Error updating recommendation usage:", error);
    return { isSuccess: false, message: "Failed to update recommendation usage" };
  }
}

export async function checkSyncRateLimitAction(
  userId: string
): Promise<ActionState<{canMakeRequest: boolean; resetTime: Date | null; requestsRemaining: number}>> {
  try {
    const profile = await getProfile(userId);
    
    if (!profile) {
      return {
        isSuccess: false,
        message: "Profile not found",
        data: {
          canMakeRequest: false,
          resetTime: null,
          requestsRemaining: 0
        }
      };
    }
    
    const now = new Date();
    const isPro = profile.membership === "pro";
    const dailyLimit = isPro ? PRO_SYNC_LIMIT : FREE_SYNC_LIMIT;
    
    // Check if last sync was today
    if (profile.lastSyncAt) {
      const lastSync = new Date(profile.lastSyncAt);
      const isToday = now.getTime() - lastSync.getTime() < DAY_IN_MS;
      
      if (isToday) {
        // User has made requests today, check count against limit
        const count = profile.syncCount || 0;
        
        if (count >= dailyLimit) {
          // Rate limit exceeded
          // Calculate reset time (next day from first request)
          const resetTime = new Date(lastSync.getTime() + DAY_IN_MS);
          
          return {
            isSuccess: true,
            message: `Rate limit exceeded. You can make ${dailyLimit} sync requests per day.`,
            data: {
              canMakeRequest: false,
              resetTime,
              requestsRemaining: 0
            }
          };
        }
        
        // User still has requests available today
        return {
          isSuccess: true,
          message: `${dailyLimit - count} sync requests remaining today`,
          data: {
            canMakeRequest: true,
            resetTime: new Date(lastSync.getTime() + DAY_IN_MS),
            requestsRemaining: dailyLimit - count
          }
        };
      }
    }
    
    // No recent requests or they were from a previous day
    return {
      isSuccess: true,
      message: `${dailyLimit} sync requests available`,
      data: {
        canMakeRequest: true,
        resetTime: null,
        requestsRemaining: dailyLimit
      }
    };
  } catch (error) {
    console.error("Error checking sync rate limit:", error);
    return { 
      isSuccess: false,
      message: "Failed to check rate limit",
      data: {
        canMakeRequest: false,
        resetTime: null,
        requestsRemaining: 0
      }
    };
  }
}

export async function updateSyncUsageAction(
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
    
    const now = new Date();
    const currentCount = profile.syncCount || 0;
    
    // Check if last sync was today
    let newCount = 1;
    if (profile.lastSyncAt) {
      const lastSync = new Date(profile.lastSyncAt);
      const isToday = now.getTime() - lastSync.getTime() < DAY_IN_MS;
      
      if (isToday) {
        // Increment count
        newCount = currentCount + 1;
      }
    }
    
    // Update profile with new count and timestamp
    const updatedProfile = await updateProfile(userId, {
      lastSyncAt: now,
      syncCount: newCount
    });
    
    return {
      isSuccess: true,
      message: "Sync usage updated",
      data: updatedProfile
    };
  } catch (error) {
    console.error("Error updating sync usage:", error);
    return { isSuccess: false, message: "Failed to update sync usage" };
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