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
      // Connect to database directly
      const postgres = (await import("postgres")).default
      const sql = postgres(process.env.DATABASE_URL!)
      
      // Update subscriptions table
      await sql`
        INSERT INTO subscriptions (user_id, membership, stripe_customer_id, stripe_subscription_id)
        VALUES (${userId}, 'pro', ${result.data.stripeCustomerId || null}, ${result.data.stripeSubscriptionId || null})
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          membership = 'pro',
          stripe_customer_id = ${result.data.stripeCustomerId || null},
          stripe_subscription_id = ${result.data.stripeSubscriptionId || null},
          updated_at = NOW()
      `
      
      // Close the connection
      await sql.end()
    }
    
    return result
  } catch (error) {
    console.error("Error fixing subscription:", error)
    return { isSuccess: false, message: "An error occurred", data: undefined }
  }
} 