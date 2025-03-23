"use server"

import { Header } from "@/components/ui/header"
import { Footer } from "@/components/ui/footer"
import { Sidebar } from "./_components/sidebar"
import { auth } from "@clerk/nextjs/server"
import { getProfileAction } from "@/actions/db/profiles-actions"
import { redirect } from "next/navigation"
import postgres from "postgres"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/login")
  }
  
  // Check if user has subscription in the database
  let isPro = false;
  
  try {
    // Connect to database directly
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Check in subscriptions table
    const subscriptions = await sql`
      SELECT * FROM subscriptions WHERE user_id = ${userId}
    `;
    
    // Check if the user has an active subscription
    if (subscriptions.length > 0 && subscriptions[0].active === true) {
      isPro = true;
    } else {
      // Also try the getProfileAction as a fallback
      const { data: profile, isSuccess } = await getProfileAction(userId);
      if (isSuccess && profile && profile.membership === "pro") {
        isPro = true;
        
        // Ensure the subscription is also recorded in the subscriptions table
        await sql`
          INSERT INTO subscriptions (
            user_id, 
            active, 
            stripe_customer_id, 
            stripe_subscription_id
          )
          VALUES (
            ${userId}, 
            ${true}, 
            ${profile.stripeCustomerId || null}, 
            ${profile.stripeSubscriptionId || null}
          )
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            active = ${true},
            updated_at = NOW()
        `;
      }
    }
    
    // If still not pro, add to subscriptions as an override (for development testing only)
    if (process.env.NODE_ENV === "development" && !isPro) {
      await sql`
        INSERT INTO subscriptions (user_id, active)
        VALUES (${userId}, ${true})
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          active = ${true},
          updated_at = NOW()
      `;
      isPro = true;
      console.log(`[DEV ONLY] Added user ${userId} to subscriptions with active=true`);
    }
    
    // Close the connection
    await sql.end();
  } catch (error) {
    console.error("Error checking subscription status:", error);
    
    // For development, allow access anyway if there was an error
    if (process.env.NODE_ENV === "development") {
      isPro = true;
      console.log("[DEV ONLY] Allowing access despite error");
    }
  }
  
  // Redirect to pricing if not a pro member
  if (!isPro) {
    redirect("/pricing");
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 mx-auto w-full">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 overflow-auto">
          <div className="mx-auto max-w-4xl">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
} 