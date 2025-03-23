import { updateStripeCustomer, manageSubscriptionStatusChange } from "@/actions/stripe-actions";
import { NextRequest, NextResponse } from "next/server";

// Use Node.js runtime to be able to access database
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Verify internal webhook secret
  const secret = req.headers.get('x-webhook-secret');
  
  if (secret !== (process.env.INTERNAL_WEBHOOK_SECRET || 'internal-secret')) {
    console.error('Invalid internal webhook secret');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { type, data } = await req.json();
    
    console.log(`[WEBHOOK-PROCESSOR] Processing ${type} event`);
    
    switch (type) {
      case 'checkout.session.completed': {
        const { userId, subscriptionId, customerId } = data;
        
        if (!userId || !subscriptionId || !customerId) {
          return NextResponse.json({ 
            error: 'Missing required data',
            userId: userId ? 'Present' : 'Missing',
            subscriptionId: subscriptionId ? 'Present' : 'Missing',
            customerId: customerId ? 'Present' : 'Missing'
          }, { status: 400 });
        }
        
        try {
          const result = await updateStripeCustomer(
            userId,
            subscriptionId,
            customerId
          );
          
          console.log(`[WEBHOOK-PROCESSOR] Successfully updated customer:`, result?.membership);
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('[WEBHOOK-PROCESSOR] Error updating customer:', error);
          return NextResponse.json({ 
            error: 'Failed to update customer',
            message: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const { subscriptionId, customerId, productId } = data;
        
        if (!subscriptionId || !customerId || !productId) {
          return NextResponse.json({ 
            error: 'Missing required data',
            subscriptionId: subscriptionId ? 'Present' : 'Missing',
            customerId: customerId ? 'Present' : 'Missing',
            productId: productId ? 'Present' : 'Missing'
          }, { status: 400 });
        }
        
        try {
          const result = await manageSubscriptionStatusChange(
            subscriptionId,
            customerId,
            productId
          );
          
          console.log(`[WEBHOOK-PROCESSOR] Successfully managed subscription:`, result);
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('[WEBHOOK-PROCESSOR] Error managing subscription:', error);
          return NextResponse.json({ 
            error: 'Failed to manage subscription',
            message: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }
      
      default:
        return NextResponse.json({ error: `Unsupported event type: ${type}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[WEBHOOK-PROCESSOR] Error processing webhook:', error);
    return NextResponse.json({ 
      error: 'Error processing webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 