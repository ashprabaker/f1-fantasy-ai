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
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
  
  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case "checkout.session.completed":
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          
          if (!checkoutSession.customer || !checkoutSession.subscription) {
            return new Response("Missing customer or subscription ID", { status: 400 });
          }
          
          await updateStripeCustomer(
            checkoutSession.client_reference_id as string,
            checkoutSession.subscription as string,
            checkoutSession.customer as string
          );
          break;
          
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          const subscription = event.data.object as Stripe.Subscription;
          
          if (!subscription.items?.data[0]?.price?.product) {
            return new Response("Missing product in subscription", { status: 400 });
          }
          
          await manageSubscriptionStatusChange(
            subscription.id,
            subscription.customer as string,
            subscription.items.data[0].price.product as string
          );
          break;
          
        default:
          throw new Error(`Unhandled relevant event: ${event.type}`);
      }
      
      return new Response(null, { status: 200 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return new Response(`Webhook error: ${errorMessage}`, { status: 400 });
    }
  }
  
  return new Response(null, { status: 200 });
} 