import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import postgres from "postgres";
import Stripe from "stripe";

// This endpoint processes Stripe webhook events
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  try {
    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && customerId && subscriptionId) {
          // Connect to database directly
          const sql = postgres(process.env.DATABASE_URL!);
          
          // Add/update the subscription in both tables
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
              ${customerId}, 
              ${subscriptionId}
            )
            ON CONFLICT (user_id) 
            DO UPDATE SET 
              active = ${true},
              stripe_customer_id = ${customerId},
              stripe_subscription_id = ${subscriptionId},
              updated_at = NOW()
          `;
          
          // Close the connection
          await sql.end();
          
          console.log(`User ${userId} upgraded to pro membership via checkout session`);
        }
        break;
      }
      
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;
        const customerId = subscription.customer as string;
        
        // If subscription is not active/trialing, set active to false
        if (status !== "active" && status !== "trialing") {
          // Connect to database directly
          const sql = postgres(process.env.DATABASE_URL!);
          
          // Find user by stripe customer ID
          const users = await sql`
            SELECT user_id FROM subscriptions 
            WHERE stripe_customer_id = ${customerId}
          `;
          
          if (users.length > 0) {
            const userId = users[0].user_id;
            
            // Update subscription to inactive
            await sql`
              UPDATE subscriptions 
              SET active = ${false}, updated_at = NOW()
              WHERE user_id = ${userId}
            `;
            
            console.log(`User ${userId} downgraded due to subscription ${status}`);
          }
          
          // Close the connection
          await sql.end();
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
} 