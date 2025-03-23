// Script to check Stripe configuration
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

async function checkStripeConfig() {
  try {
    console.log('Checking Stripe Configuration...');
    
    // Check API Key
    try {
      const balance = await stripe.balance.retrieve();
      console.log('✅ Stripe API key is valid');
    } catch (error) {
      console.error('❌ Stripe API key is invalid:', error);
      return;
    }
    
    // Check Products
    try {
      const products = await stripe.products.list({ active: true, limit: 100 });
      console.log(`Found ${products.data.length} active products`);
      
      // Check for products with 'membership' metadata
      const proProducts = products.data.filter(
        p => p.metadata.membership === 'pro'
      );
      
      console.log(`Found ${proProducts.length} products with membership=pro metadata`);
      
      if (proProducts.length === 0) {
        console.log('❌ No products found with membership=pro metadata');
        console.log('Products with metadata:');
        products.data.forEach(p => {
          console.log(`- ${p.name} (${p.id}): metadata = ${JSON.stringify(p.metadata)}`);
        });
      } else {
        proProducts.forEach(p => {
          console.log(`- ${p.name} (${p.id}): ${JSON.stringify(p.metadata)}`);
        });
      }
    } catch (error) {
      console.error('❌ Error listing products:', error);
    }
    
    // Check Prices
    try {
      const prices = await stripe.prices.list({ active: true, limit: 100 });
      console.log(`Found ${prices.data.length} active prices`);
      
      // Check if prices have products attached
      const pricesWithProducts = prices.data.filter(p => p.product);
      
      if (pricesWithProducts.length < prices.data.length) {
        console.log('❌ Some prices do not have products attached');
      }
      
      for (const price of prices.data) {
        const productId = typeof price.product === 'string' ? price.product : price.product?.id;
        if (productId) {
          const product = await stripe.products.retrieve(productId);
          console.log(`- ${price.nickname || 'Unnamed price'} (${price.id}): ${price.unit_amount ? price.unit_amount/100 : 'N/A'} ${price.currency} for product ${product.name}`);
          console.log(`  Product metadata: ${JSON.stringify(product.metadata)}`);
        }
      }
    } catch (error) {
      console.error('❌ Error listing prices:', error);
    }
    
    // Check Webhook Endpoints
    try {
      const webhooks = await stripe.webhookEndpoints.list();
      console.log(`Found ${webhooks.data.length} webhook endpoints`);
      
      if (webhooks.data.length === 0) {
        console.log('❌ No webhook endpoints configured');
      } else {
        webhooks.data.forEach(webhook => {
          console.log(`- ${webhook.url}`);
          console.log(`  Events: ${webhook.enabled_events.join(', ')}`);
          console.log(`  Status: ${webhook.status}`);
        });
      }
    } catch (error) {
      console.error('❌ Error listing webhook endpoints:', error);
    }
    
    // Check Payment Links
    const paymentLinkMonthly = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY;
    const paymentLinkYearly = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY;
    const portalLink = process.env.NEXT_PUBLIC_STRIPE_PORTAL_LINK;
    
    console.log('\nPayment Links:');
    console.log(`- Monthly: ${paymentLinkMonthly || 'Not configured'}`);
    console.log(`- Yearly: ${paymentLinkYearly || 'Not configured'}`);
    console.log(`- Portal: ${portalLink || 'Not configured'}`);
    
    if (!paymentLinkMonthly || !paymentLinkYearly) {
      console.log('❌ Payment links not fully configured');
    }
    
    if (!portalLink) {
      console.log('❌ Portal link not configured');
    }
    
  } catch (error) {
    console.error('Error checking Stripe configuration:', error);
  }
}

checkStripeConfig(); 