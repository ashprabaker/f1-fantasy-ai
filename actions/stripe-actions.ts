"use server"

import { updateProfile, updateProfileByStripeCustomerId } from "@/db/queries/profiles-queries";
import { SelectProfile, subscriptionsTable } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { db } from "@/db/db";

type MembershipStatus = SelectProfile["membership"];

const getMembershipStatus = (status: Stripe.Subscription.Status, membership: MembershipStatus): MembershipStatus => {
  switch (status) {
    case "active":
    case "trialing":
      return membership;
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "paused":
    case "unpaid":
      return "free";
    default:
      return "free";
  }
};

const getSubscription = async (subscriptionId: string) => {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"]
  });
};

export const updateStripeCustomer = async (userId: string, subscriptionId: string, customerId: string) => {
  try {
    if (!userId || !subscriptionId || !customerId) {
      throw new Error("Missing required parameters for updateStripeCustomer");
    }

    const subscription = await getSubscription(subscriptionId);
    
    // When a checkout session is completed, the subscription should be for a Pro plan
    const updatedProfile = await updateProfile(userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      membership: "pro" // Set membership to pro for new subscriptions
    });

    if (!updatedProfile) {
      throw new Error("Failed to update customer profile");
    }

    return updatedProfile;
  } catch (error) {
    console.error("Error in updateStripeCustomer:", error);
    throw error instanceof Error ? error : new Error("Failed to update Stripe customer");
  }
};

export const manageSubscriptionStatusChange = async (subscriptionId: string, customerId: string, productId: string): Promise<MembershipStatus> => {
  try {
    if (!subscriptionId || !customerId || !productId) {
      throw new Error("Missing required parameters for manageSubscriptionStatusChange");
    }

    const subscription = await getSubscription(subscriptionId);

    const product = await stripe.products.retrieve(productId);
    const membership = product.metadata.membership as MembershipStatus;
    if (!["free", "pro"].includes(membership)) {
      throw new Error(`Invalid membership type in product metadata: ${membership}`);
    }

    const membershipStatus = getMembershipStatus(subscription.status, membership);

    await updateProfileByStripeCustomerId(customerId, {
      stripeSubscriptionId: subscription.id,
      membership: membershipStatus
    });

    return membershipStatus;
  } catch (error) {
    console.error("Error in manageSubscriptionStatusChange:", error);
    throw error instanceof Error ? error : new Error("Failed to update subscription status");
  }
};

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