"use server"

export async function getProfile(userId: string | null | undefined) {
  if (!userId) return { isSuccess: false, message: "", data: undefined }
  
  const { getProfileAction } = await import("@/actions/db/profiles-actions")
  return getProfileAction(userId)
}

export async function fixSubscription(userId: string | null | undefined) {
  if (!userId) return { isSuccess: false, message: "User ID is required", data: undefined }
  
  const { fixSubscriptionMembershipAction } = await import("@/actions/db/profiles-actions")
  return fixSubscriptionMembershipAction(userId)
} 