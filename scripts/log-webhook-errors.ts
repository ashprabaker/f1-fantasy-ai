// Script to enhance webhook logging for debugging
import fs from 'fs';
import path from 'path';

const enhanceWebhookLogging = () => {
  const webhookFilePath = path.join(process.cwd(), 'app', 'api', 'stripe', 'webhooks', 'route.ts');
  
  try {
    // Read current file content
    const content = fs.readFileSync(webhookFilePath, 'utf8');
    
    // Only modify if enhanced logging doesn't already exist
    if (!content.includes('WEBHOOK-DEBUG')) {
      // Add enhanced logging
      const enhancedContent = content
        .replace(
          'try {',
          `try {
    console.log('[WEBHOOK-DEBUG] Received webhook request');
    console.log('[WEBHOOK-DEBUG] Signature:', signature ? 'Present' : 'Missing');`
        )
        .replace(
          'event = stripe.webhooks.constructEvent(',
          `console.log('[WEBHOOK-DEBUG] Attempting to construct event with webhook secret length:', 
            process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.length : 0);
    event = stripe.webhooks.constructEvent(`
        )
        .replace(
          'return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });',
          `console.error('[WEBHOOK-DEBUG] Failed to construct event:', errorMessage);
    return new Response(\`Webhook Error: \${errorMessage}\`, { status: 400 });`
        )
        .replace(
          'if (relevantEvents.has(event.type)) {',
          `console.log('[WEBHOOK-DEBUG] Received event type:', event.type);
  if (relevantEvents.has(event.type)) {`
        )
        .replace(
          'switch (event.type) {',
          `console.log('[WEBHOOK-DEBUG] Processing relevant event:', event.type);
      switch (event.type) {`
        )
        .replace(
          'case "checkout.session.completed":',
          `case "checkout.session.completed":
          console.log('[WEBHOOK-DEBUG] Processing checkout.session.completed');`
        )
        .replace(
          'if (!checkoutSession.customer || !checkoutSession.subscription) {',
          `console.log('[WEBHOOK-DEBUG] Checkout session data:', {
            customer: checkoutSession.customer ? 'Present' : 'Missing',
            subscription: checkoutSession.subscription ? 'Present' : 'Missing',
            client_reference_id: checkoutSession.client_reference_id ? 'Present' : 'Missing'
          });
          if (!checkoutSession.customer || !checkoutSession.subscription) {`
        )
        .replace(
          'await updateStripeCustomer(',
          `console.log('[WEBHOOK-DEBUG] Calling updateStripeCustomer with:', {
            client_reference_id: checkoutSession.client_reference_id,
            subscription: typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : 'Object',
            customer: typeof checkoutSession.customer === 'string' ? checkoutSession.customer : 'Object'
          });
          try {
            await updateStripeCustomer(`
        )
        .replace(
          'break;',
          `console.log('[WEBHOOK-DEBUG] updateStripeCustomer completed successfully');
          } catch (updateError) {
            console.error('[WEBHOOK-DEBUG] Error in updateStripeCustomer:', updateError);
            throw updateError;
          }
          break;`
        )
        .replace(
          'const subscription = event.data.object as Stripe.Subscription;',
          `const subscription = event.data.object as Stripe.Subscription;
          console.log('[WEBHOOK-DEBUG] Processing subscription event with subscription ID:', subscription.id);`
        )
        .replace(
          'if (!subscription.items?.data[0]?.price?.product) {',
          `console.log('[WEBHOOK-DEBUG] Subscription data:', {
            items: subscription.items ? 'Present' : 'Missing',
            itemsData: subscription.items?.data?.length ? 'Present' : 'Missing',
            price: subscription.items?.data[0]?.price ? 'Present' : 'Missing',
            product: subscription.items?.data[0]?.price?.product ? 'Present' : 'Missing',
          });
          if (!subscription.items?.data[0]?.price?.product) {`
        )
        .replace(
          'await manageSubscriptionStatusChange(',
          `console.log('[WEBHOOK-DEBUG] Calling manageSubscriptionStatusChange with:', {
            id: subscription.id,
            customer: typeof subscription.customer === 'string' ? subscription.customer : 'Object',
            product: typeof subscription.items.data[0].price.product === 'string' ? 
              subscription.items.data[0].price.product : 'Object'
          });
          try {
            await manageSubscriptionStatusChange(`
        )
        .replace(
          'break;',
          `console.log('[WEBHOOK-DEBUG] manageSubscriptionStatusChange completed successfully');
          } catch (manageError) {
            console.error('[WEBHOOK-DEBUG] Error in manageSubscriptionStatusChange:', manageError);
            throw manageError;
          }
          break;`
        )
        .replace(
          'return new Response(null, { status: 200 });',
          `console.log('[WEBHOOK-DEBUG] Successfully processed event:', event.type);
      return new Response(null, { status: 200 });`
        )
        .replace(
          'const errorMessage = error instanceof Error ? error.message : "Unknown error";',
          `const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('[WEBHOOK-DEBUG] Error processing webhook:', errorMessage);
      console.error('[WEBHOOK-DEBUG] Error details:', error);`
        );
      
      // Write the enhanced file back
      fs.writeFileSync(webhookFilePath, enhancedContent, 'utf8');
      console.log('✅ Enhanced webhook logging successfully added to:', webhookFilePath);
    } else {
      console.log('ℹ️ Enhanced logging already exists in webhook file');
    }
  } catch (error) {
    console.error('❌ Error enhancing webhook logging:', error);
  }
};

enhanceWebhookLogging(); 