// Script to check Stripe customer portal configuration
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

async function checkCustomerPortalConfig() {
  try {
    console.log('Checking Stripe Customer Portal Configuration...');
    
    // Check if customer portal is configured
    try {
      const configurations = await stripe.billingPortal.configurations.list();
      console.log(`Found ${configurations.data.length} customer portal configurations`);
      
      if (configurations.data.length === 0) {
        console.log('❌ No customer portal configurations found');
      } else {
        configurations.data.forEach((config, index) => {
          console.log(`\nConfiguration ${index + 1}:`);
          console.log(`- Active: ${config.active}`);
          console.log(`- Default: ${config.is_default}`);
          
          // Features
          console.log('\nFeatures:');
          console.log(`- Customer Update: ${config.features.customer_update.enabled}`);
          console.log(`- Invoice History: ${config.features.invoice_history.enabled}`);
          console.log(`- Payment Method Update: ${config.features.payment_method_update.enabled}`);
          console.log(`- Subscription Cancel: ${config.features.subscription_cancel.enabled}`);
          console.log(`- Subscription Update: ${config.features.subscription_update.enabled}`);
          
          // Business info
          if (config.business_profile) {
            console.log('\nBusiness Profile:');
            console.log(`- Privacy Policy URL: ${config.business_profile.privacy_policy_url || 'Not set'}`);
            console.log(`- Terms of Service URL: ${config.business_profile.terms_of_service_url || 'Not set'}`);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error listing customer portal configurations:', error);
    }
    
    // Check portal link in environment variables
    const portalLink = process.env.NEXT_PUBLIC_STRIPE_PORTAL_LINK;
    console.log('\nCustomer Portal Link:');
    console.log(`- ${portalLink || 'Not configured'}`);
    
    if (!portalLink) {
      console.log('❌ Customer portal link not configured in environment variables');
    }
    
    // Check subscriptions for a customer (if any)
    const customerId = process.env.TEST_CUSTOMER_ID;
    if (customerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          expand: ['data.items.data.price.product']
        });
        
        console.log(`\nFound ${subscriptions.data.length} subscriptions for test customer ${customerId}`);
        
        if (subscriptions.data.length > 0) {
          for (const [index, subscription] of subscriptions.data.entries()) {
            console.log(`\nSubscription ${index + 1}:`);
            console.log(`- ID: ${subscription.id}`);
            console.log(`- Status: ${subscription.status}`);
            
            if (subscription.items.data.length > 0) {
              const item = subscription.items.data[0];
              const price = item.price;
              const product = price.product as Stripe.Product;
              
              console.log('\nProduct Details:');
              console.log(`- Name: ${product.name}`);
              console.log(`- ID: ${product.id}`);
              console.log(`- Metadata: ${JSON.stringify(product.metadata)}`);
              
              console.log('\nPrice Details:');
              console.log(`- ID: ${price.id}`);
              console.log(`- Amount: ${price.unit_amount ? price.unit_amount/100 : 'N/A'} ${price.currency}`);
              console.log(`- Interval: ${price.recurring?.interval || 'N/A'}`);
            }
            
            // Test creating a portal session for this customer in a proper async context
            try {
              const session = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: 'https://yoursite.com/account'
              });
              
              console.log('\nCustomer Portal Session:');
              console.log(`- URL: ${session.url}`);
              console.log('✅ Successfully created customer portal session');
            } catch (error) {
              console.error('❌ Error creating customer portal session:', error);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error listing subscriptions:', error);
      }
    } else {
      console.log('\n❌ No test customer ID provided. Set TEST_CUSTOMER_ID in your environment to test with a real customer.');
    }
    
  } catch (error) {
    console.error('Error checking Stripe customer portal configuration:', error);
  }
}

checkCustomerPortalConfig(); 