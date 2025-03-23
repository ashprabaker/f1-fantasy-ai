import { manageSubscriptionStatusChange, updateStripeCustomer } from "@/actions/stripe-actions";
import { stripe } from "@/lib/stripe";
import { NextRequest } from "next/server";
import Stripe from "stripe";

// Use Edge Runtime for this route
export const runtime = 'edge';

// Relevant events to process
const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted"
]);

export async function POST(req: NextRequest) {
  // For Edge Runtime we need to read the raw body ourselves
  const rawBody = await req.text();
  
  // Get the Stripe signature from headers
  const signature = req.headers.get("Stripe-Signature") || req.headers.get("stripe-signature");
  
  // Debug logging
  console.log('[WEBHOOK-DEBUG] Received webhook request');
  console.log('[WEBHOOK-DEBUG] Signature:', signature ? 'Present' : 'Missing');
  console.log('[WEBHOOK-DEBUG] Body length:', rawBody.length);
  console.log('[WEBHOOK-DEBUG] Webhook secret length:', process.env.STRIPE_WEBHOOK_SECRET?.length || 0);
  
  if (!signature) {
    console.error('[WEBHOOK-DEBUG] Missing Stripe signature header');
    return new Response('Missing Stripe signature header', { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[WEBHOOK-DEBUG] Missing STRIPE_WEBHOOK_SECRET environment variable');
    return new Response('Webhook secret not configured', { status: 500 });
  }
  
  // Parse the event
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('[WEBHOOK-DEBUG] Successfully constructed event:', event.type);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error('[WEBHOOK-DEBUG] Error processing webhook:', errorMessage);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
  
  // Check if this is an event we care about
  if (relevantEvents.has(event.type)) {
    try {
      console.log('[WEBHOOK-DEBUG] Processing relevant event:', event.type);
      
      // Handle different event types
      switch (event.type) {
        case "checkout.session.completed": {
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          
          console.log('[WEBHOOK-DEBUG] Checkout session data:', {
            customer: checkoutSession.customer ? 'Present' : 'Missing',
            subscription: checkoutSession.subscription ? 'Present' : 'Missing',
            client_reference_id: checkoutSession.client_reference_id ? 'Present' : 'Missing'
          });
          
          if (!checkoutSession.customer || !checkoutSession.subscription) {
            return new Response("Missing customer or subscription ID", { status: 400 });
          }
          
          if (!checkoutSession.client_reference_id) {
            console.warn('[WEBHOOK-DEBUG] Missing client_reference_id in checkout session');
            return new Response("Missing client_reference_id", { status: 400 });
          }
          
          try {
            await updateStripeCustomer(
              checkoutSession.client_reference_id,
              checkoutSession.subscription as string,
              checkoutSession.customer as string
            );
            console.log('[WEBHOOK-DEBUG] Successfully updated stripe customer');
          } catch (updateError) {
            console.error('[WEBHOOK-DEBUG] Error in updateStripeCustomer:', updateError);
            throw updateError;
          }
          break;
        }
          
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('[WEBHOOK-DEBUG] Processing subscription event with ID:', subscription.id);
          
          if (!subscription.items?.data[0]?.price?.product) {
            return new Response("Missing product in subscription", { status: 400 });
          }
          
          try {
            await manageSubscriptionStatusChange(
              subscription.id,
              subscription.customer as string,
              subscription.items.data[0].price.product as string
            );
            console.log('[WEBHOOK-DEBUG] Successfully managed subscription status change');
          } catch (manageError) {
            console.error('[WEBHOOK-DEBUG] Error in manageSubscriptionStatusChange:', manageError);
            throw manageError;
          }
          break;
        }
          
        default:
          console.warn(`[WEBHOOK-DEBUG] Unhandled event type: ${event.type}`);
          return new Response(`Unhandled event type: ${event.type}`, { status: 400 });
      }
      
      return new Response(JSON.stringify({ received: true }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('[WEBHOOK-DEBUG] Error handling webhook event:', errorMessage);
      return new Response(`Webhook error: ${errorMessage}`, { status: 400 });
    }
  }
  
  // Return 200 for event types we don't handle
  return new Response(JSON.stringify({ received: true }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} 