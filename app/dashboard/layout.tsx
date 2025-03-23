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
    
    // Check if the user has a pro membership
    if (subscriptions.length > 0 && subscriptions[0].membership === 'pro') {
      isPro = true;
    } else {
      // Also try the getProfileAction as a fallback
      const { data: profile, isSuccess } = await getProfileAction(userId);
      if (isSuccess && profile && profile.membership === "pro") {
        isPro = true;
        
        // Ensure the subscription is also recorded in the subscriptions table
        await sql`
          INSERT INTO subscriptions (user_id, membership, stripe_customer_id, stripe_subscription_id)
          VALUES (${userId}, 'pro', ${profile.stripeCustomerId || null}, ${profile.stripeSubscriptionId || null})
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            membership = 'pro',
            updated_at = NOW()
        `;
      }
    }
    
    // Close the connection
    await sql.end();
  } catch (error) {
    console.error("Error checking subscription status:", error);
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