// Script to manually test webhook event processing
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Stripe from 'stripe';
import { manageSubscriptionStatusChange, updateStripeCustomer } from '../actions/stripe-actions';
import { updateProfileByStripeCustomerId } from '../db/queries/profiles-queries';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Mock HTTP request and response for testing
class MockRequest {
  private _body: string;
  
  constructor(body: object) {
    this._body = JSON.stringify(body);
  }
  
  async text() {
    return this._body;
  }
}

class MockResponse {
  status(code: number) {
    console.log(`Response status code: ${code}`);
    return this;
  }
}

// Function to simulate webhook event handling
async function processWebhookEvent(eventType: string, data: any) {
  try {
    console.log(`Processing ${eventType} event...`);
    
    switch (eventType) {
      case 'checkout.session.completed': {
        if (!data.customer || !data.subscription) {
          console.error('Missing customer or subscription ID');
          return;
        }
        
        await updateStripeCustomer(
          data.client_reference_id,
          data.subscription,
          data.customer
        );
        console.log('✅ updateStripeCustomer completed successfully');
        break;
      }
        
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        if (!data.items?.data[0]?.price?.product) {
          console.error('Missing product in subscription');
          return;
        }
        
        await manageSubscriptionStatusChange(
          data.id,
          data.customer,
          data.items.data[0].price.product
        );
        console.log('✅ manageSubscriptionStatusChange completed successfully');
        break;
      }
        
      default:
        console.error(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error processing ${eventType} event:`, error);
  }
}

// Function to simulate checkout.session.completed event
async function simulateCheckoutCompleted(customerId: string, subscriptionId: string, userId: string) {
  try {
    console.log('Simulating checkout.session.completed event...');
    
    const eventData = {
      customer: customerId,
      subscription: subscriptionId,
      client_reference_id: userId
    };
    
    await processWebhookEvent('checkout.session.completed', eventData);
  } catch (error) {
    console.error('Error simulating checkout.session.completed event:', error);
  }
}

// Function to simulate customer.subscription.updated event
async function simulateSubscriptionUpdated(subscriptionId: string) {
  try {
    console.log('Simulating customer.subscription.updated event...');
    
    // Fetch the actual subscription to use real data
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product']
    });
    
    await processWebhookEvent('customer.subscription.updated', subscription);
  } catch (error) {
    console.error('Error simulating customer.subscription.updated event:', error);
  }
}

// Function to check database state
async function checkUserProfile(userId: string) {
  try {
    const { getProfile } = await import('../db/queries/profiles-queries');
    const profile = await getProfile(userId);
    
    console.log('\nUser Profile:');
    console.log(JSON.stringify(profile, null, 2));
    
    if (!profile) {
      console.log('❌ Profile not found');
      return;
    }
    
    console.log(`Membership: ${profile.membership}`);
    console.log(`Stripe Customer ID: ${profile.stripeCustomerId || 'Not set'}`);
    console.log(`Stripe Subscription ID: ${profile.stripeSubscriptionId || 'Not set'}`);
    
    if (profile.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
        console.log(`Subscription Status: ${subscription.status}`);
      } catch (error) {
        console.error('Error retrieving subscription:', error);
      }
    }
  } catch (error) {
    console.error('Error checking user profile:', error);
  }
}

// Main function
async function main() {
  try {
    // Use environment variables for test values
    const userId = process.env.TEST_USER_ID || 'user_test';
    
    // Get active subscription for a test if specified
    let customerId = 'cus_test';
    let subscriptionId = 'sub_test';
    
    // If user wants to test with real values, uncomment and use these
    
    // List all customers to find the right one
    const customers = await stripe.customers.list({
      limit: 10
    });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log(`Using first available customer: ${customerId}`);
      
      // Get subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all'
      });
      
      if (subscriptions.data.length > 0) {
        subscriptionId = subscriptions.data[0].id;
        console.log(`Using first available subscription: ${subscriptionId}`);
      }
    }
    
    
    console.log('Starting tests with:');
    console.log(`- User ID: ${userId}`);
    console.log(`- Customer ID: ${customerId}`);
    console.log(`- Subscription ID: ${subscriptionId}`);
    
    // Check initial state
    await checkUserProfile(userId);
    
    // Uncomment the test you want to run
    console.log('\nRunning checkout.session.completed simulation:');
    await simulateCheckoutCompleted(customerId, subscriptionId, userId);
    
    // Check final state
    console.log('\nChecking final state:');
    await checkUserProfile(userId);
    
    console.log('\nTests completed');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

main(); 