import { NextRequest } from "next/server";
import Stripe from "stripe";

// Use Edge Runtime for this route
export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

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
          
          if (!checkoutSession.customer || !checkoutSession.subscription || !checkoutSession.client_reference_id) {
            return new Response(JSON.stringify({
              error: "Missing required data in checkout session",
              customer: checkoutSession.customer ? 'Present' : 'Missing',
              subscription: checkoutSession.subscription ? 'Present' : 'Missing',
              client_reference_id: checkoutSession.client_reference_id ? 'Present' : 'Missing'
            }), { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Forward the event data to a server action that can handle DB operations
          const response = await fetch(new URL('/api/stripe/process-webhook', req.url).toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-webhook-secret': process.env.INTERNAL_WEBHOOK_SECRET || 'internal-secret'
            },
            body: JSON.stringify({
              type: event.type,
              data: {
                userId: checkoutSession.client_reference_id,
                subscriptionId: checkoutSession.subscription as string,
                customerId: checkoutSession.customer as string
              }
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[WEBHOOK-DEBUG] Error from webhook processor:', errorText);
            return new Response(errorText, { status: 500 });
          }
          
          console.log('[WEBHOOK-DEBUG] Successfully forwarded checkout event to processor');
          break;
        }
          
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('[WEBHOOK-DEBUG] Processing subscription event with ID:', subscription.id);
          
          if (!subscription.items?.data[0]?.price?.product || !subscription.customer) {
            return new Response(JSON.stringify({
              error: "Missing required data in subscription",
              items: subscription.items ? 'Present' : 'Missing',
              customer: subscription.customer ? 'Present' : 'Missing'
            }), { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Forward the event data to a server action that can handle DB operations
          const response = await fetch(new URL('/api/stripe/process-webhook', req.url).toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-webhook-secret': process.env.INTERNAL_WEBHOOK_SECRET || 'internal-secret'
            },
            body: JSON.stringify({
              type: event.type,
              data: {
                subscriptionId: subscription.id,
                customerId: subscription.customer as string,
                productId: subscription.items.data[0].price.product as string
              }
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[WEBHOOK-DEBUG] Error from webhook processor:', errorText);
            return new Response(errorText, { status: 500 });
          }
          
          console.log('[WEBHOOK-DEBUG] Successfully forwarded subscription event to processor');
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