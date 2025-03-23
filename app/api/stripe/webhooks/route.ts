import { manageSubscriptionStatusChange, updateStripeCustomer } from "@/actions/stripe-actions";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted"
]);

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature") as string;
  
  let event: Stripe.Event;
  
  try {
    console.log('[WEBHOOK-DEBUG] Received webhook request');
    console.log('[WEBHOOK-DEBUG] Signature:', signature ? 'Present' : 'Missing');
    console.log('[WEBHOOK-DEBUG] Attempting to construct event with webhook secret length:', 
            process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.length : 0);
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('[WEBHOOK-DEBUG] Error processing webhook:', errorMessage);
      console.error('[WEBHOOK-DEBUG] Error details:', error);
    console.error('[WEBHOOK-DEBUG] Failed to construct event:', errorMessage);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
  
  console.log('[WEBHOOK-DEBUG] Received event type:', event.type);
  if (relevantEvents.has(event.type)) {
    try {
      console.log('[WEBHOOK-DEBUG] Processing relevant event:', event.type);
      switch (event.type) {
        case "checkout.session.completed":
          console.log('[WEBHOOK-DEBUG] Processing checkout.session.completed');
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          
          console.log('[WEBHOOK-DEBUG] Checkout session data:', {
            customer: checkoutSession.customer ? 'Present' : 'Missing',
            subscription: checkoutSession.subscription ? 'Present' : 'Missing',
            client_reference_id: checkoutSession.client_reference_id ? 'Present' : 'Missing'
          });
          if (!checkoutSession.customer || !checkoutSession.subscription) {
            return new Response("Missing customer or subscription ID", { status: 400 });
          }
          
          console.log('[WEBHOOK-DEBUG] Calling updateStripeCustomer with:', {
            client_reference_id: checkoutSession.client_reference_id,
            subscription: typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : 'Object',
            customer: typeof checkoutSession.customer === 'string' ? checkoutSession.customer : 'Object'
          });
          try {
            await updateStripeCustomer(
            checkoutSession.client_reference_id as string,
            checkoutSession.subscription as string,
            checkoutSession.customer as string
          );
          console.log('[WEBHOOK-DEBUG] updateStripeCustomer completed successfully');
          } catch (updateError) {
            console.error('[WEBHOOK-DEBUG] Error in updateStripeCustomer:', updateError);
            throw updateError;
          }
          console.log('[WEBHOOK-DEBUG] manageSubscriptionStatusChange completed successfully');
          } catch (manageError) {
            console.error('[WEBHOOK-DEBUG] Error in manageSubscriptionStatusChange:', manageError);
            throw manageError;
          }
          break;
          
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          const subscription = event.data.object as Stripe.Subscription;
          console.log('[WEBHOOK-DEBUG] Processing subscription event with subscription ID:', subscription.id);
          
          console.log('[WEBHOOK-DEBUG] Subscription data:', {
            items: subscription.items ? 'Present' : 'Missing',
            itemsData: subscription.items?.data?.length ? 'Present' : 'Missing',
            price: subscription.items?.data[0]?.price ? 'Present' : 'Missing',
            product: subscription.items?.data[0]?.price?.product ? 'Present' : 'Missing',
          });
          if (!subscription.items?.data[0]?.price?.product) {
            return new Response("Missing product in subscription", { status: 400 });
          }
          
          console.log('[WEBHOOK-DEBUG] Calling manageSubscriptionStatusChange with:', {
            id: subscription.id,
            customer: typeof subscription.customer === 'string' ? subscription.customer : 'Object',
            product: typeof subscription.items.data[0].price.product === 'string' ? 
              subscription.items.data[0].price.product : 'Object'
          });
          try {
            await manageSubscriptionStatusChange(
            subscription.id,
            subscription.customer as string,
            subscription.items.data[0].price.product as string
          );
          break;
          
        default:
          throw new Error(`Unhandled relevant event: ${event.type}`);
      }
      
      console.log('[WEBHOOK-DEBUG] Successfully processed event:', event.type);
      return new Response(null, { status: 200 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return new Response(`Webhook error: ${errorMessage}`, { status: 400 });
    }
  }
  
  return new Response(null, { status: 200 });
} 