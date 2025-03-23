// Test script for Stripe webhook handling
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Stripe from 'stripe';
import { manageSubscriptionStatusChange, updateStripeCustomer } from '../actions/stripe-actions';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

async function testUpdateStripeCustomer() {
  try {
    console.log('Testing updateStripeCustomer function...');
    
    // Replace these with real test values from your Stripe dashboard
    const userId = 'test_user_id'; // Your Clerk user ID for testing
    const subscriptionId = 'sub_test'; // A real subscription ID from Stripe
    const customerId = 'cus_test'; // A real customer ID from Stripe
    
    console.log(`Using userId: ${userId}, subscriptionId: ${subscriptionId}, customerId: ${customerId}`);
    
    const result = await updateStripeCustomer(userId, subscriptionId, customerId);
    console.log('UpdateStripeCustomer Result:', result);
  } catch (error) {
    console.error('Error in updateStripeCustomer test:', error);
  }
}

async function testManageSubscriptionStatusChange() {
  try {
    console.log('Testing manageSubscriptionStatusChange function...');
    
    // Replace these with real test values from your Stripe dashboard
    const subscriptionId = 'sub_test'; // A real subscription ID from Stripe
    const customerId = 'cus_test'; // A real customer ID from Stripe
    const productId = 'prod_test'; // A real product ID from Stripe
    
    console.log(`Using subscriptionId: ${subscriptionId}, customerId: ${customerId}, productId: ${productId}`);
    
    // Log the product metadata to check if it has membership field
    const product = await stripe.products.retrieve(productId);
    console.log('Product metadata:', product.metadata);
    
    const result = await manageSubscriptionStatusChange(subscriptionId, customerId, productId);
    console.log('ManageSubscriptionStatusChange Result:', result);
  } catch (error) {
    console.error('Error in manageSubscriptionStatusChange test:', error);
  }
}

async function main() {
  try {
    // Uncomment the test you want to run
    // await testUpdateStripeCustomer();
    // await testManageSubscriptionStatusChange();
    
    console.log('Tests completed');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

main(); 