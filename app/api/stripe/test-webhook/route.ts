import { NextRequest } from "next/server";
import Stripe from "stripe";

// Use Edge Runtime
export const runtime = 'edge';

// Initialize Stripe without requiring lib/stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export async function POST(req: NextRequest) {
  try {
    // Log basic request info
    console.log("[WEBHOOK-TEST] Received test webhook request");
    
    // Get the request body
    const rawBody = await req.text();
    console.log("[WEBHOOK-TEST] Request body length:", rawBody.length);
    
    // Get the Stripe signature
    const signature = req.headers.get("Stripe-Signature") || req.headers.get("stripe-signature");
    console.log("[WEBHOOK-TEST] Signature present:", !!signature);
    
    // Log webhook secret info
    console.log("[WEBHOOK-TEST] Webhook secret available:", !!process.env.STRIPE_WEBHOOK_SECRET);
    console.log("[WEBHOOK-TEST] Webhook secret length:", process.env.STRIPE_WEBHOOK_SECRET?.length || 0);
    
    // Try to construct an event
    if (signature && process.env.STRIPE_WEBHOOK_SECRET) {
      try {
        const event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log("[WEBHOOK-TEST] Successfully validated signature for event type:", event.type);
        return new Response(JSON.stringify({ success: true, message: "Signature validated", eventType: event.type }), {
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