"use server"

export async function getProfile(userId: string | null | undefined) {
  if (!userId) return { isSuccess: false, message: "", data: undefined }
  
  const { getProfileAction } = await import("@/actions/db/profiles-actions")
  return getProfileAction(userId)
}

export async function fixSubscription(userId: string | null | undefined) {
  if (!userId) return { isSuccess: false, message: "Not authenticated", data: undefined }
  
  try {
    const { fixSubscriptionMembershipAction } = await import("@/actions/db/profiles-actions")
    const result = await fixSubscriptionMembershipAction(userId)
    
    // If the fix was successful, update the subscriptions table as well
    if (result.isSuccess && result.data) {
      // Import needed modules
      const { db } = await import("@/db/db")
      const { subscriptionsTable } = await import("@/db/schema")
      
      // Update subscriptions table using Drizzle ORM
      await db.insert(subscriptionsTable)
        .values({
          userId: userId,
          active: true,
          stripeCustomerId: result.data.stripeCustomerId || undefined,
          stripeSubscriptionId: result.data.stripeSubscriptionId || undefined
        })
        .onConflictDoUpdate({
          target: subscriptionsTable.userId,
          set: {
            active: true,
            stripeCustomerId: result.data.stripeCustomerId || undefined,
            stripeSubscriptionId: result.data.stripeSubscriptionId || undefined,
            updatedAt: new Date()
          }
        })
    }
    
    return result
  } catch (error) {
    console.error("Error fixing subscription:", error)
    return { isSuccess: false, message: "An error occurred", data: undefined }
  }
} 