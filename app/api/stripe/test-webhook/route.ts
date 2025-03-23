import { stripe } from "@/lib/stripe";
import { NextRequest } from "next/server";

// Disable body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    // Log basic request info
    console.log("[WEBHOOK-TEST] Received test webhook request");
    
    // Get the request body
    const body = await req.text();
    console.log("[WEBHOOK-TEST] Request body length:", body.length);
    
    // Get the Stripe signature
    const signature = req.headers.get("Stripe-Signature");
    console.log("[WEBHOOK-TEST] Signature present:", !!signature);
    
    // Log webhook secret info
    console.log("[WEBHOOK-TEST] Webhook secret available:", !!process.env.STRIPE_WEBHOOK_SECRET);
    console.log("[WEBHOOK-TEST] Webhook secret length:", process.env.STRIPE_WEBHOOK_SECRET?.length || 0);
    
    // Try to construct an event
    if (signature && process.env.STRIPE_WEBHOOK_SECRET) {
      try {
        const event = stripe.webhooks.constructEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log("[WEBHOOK-TEST] Successfully validated signature for event type:", event.type);
        return new Response(JSON.stringify({ success: true, message: "Signature validated" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[WEBHOOK-TEST] Failed to validate signature:", errorMessage);
        return new Response(JSON.stringify({ success: false, error: errorMessage }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: "Test endpoint working, but signature or webhook secret missing",
      signaturePresent: !!signature,
      webhookSecretPresent: !!process.env.STRIPE_WEBHOOK_SECRET
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[WEBHOOK-TEST] Unexpected error:", errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 