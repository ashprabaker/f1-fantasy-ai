// Script to manually fix a user's membership status
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Stripe from 'stripe';
import { db } from '../db/db';
import { profilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

async function fixUserMembership(userId: string) {
  try {
    console.log(`Attempting to fix membership for user: ${userId}`);
    
    // 1. Get user profile from database
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
    
    if (!profile) {
      console.error(`❌ User profile not found for user ID: ${userId}`);
      return;
    }
    
    console.log('\nUser Profile:');
    console.log(`- User ID: ${profile.userId}`);
    console.log(`- Membership: ${profile.membership}`);
    console.log(`- Stripe Customer ID: ${profile.stripeCustomerId || 'Not set'}`);
    console.log(`- Stripe Subscription ID: ${profile.stripeSubscriptionId || 'Not set'}`);
    
    // 2. Check if user has a Stripe customer ID but no subscription ID
    if (profile.stripeCustomerId && !profile.stripeSubscriptionId) {
      console.log('\nUser has Stripe customer ID but no subscription ID. Looking for subscriptions...');
      
      // Find subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripeCustomerId,
        status: 'all',
        expand: ['data.items.data.price.product']
      });
      
      console.log(`Found ${subscriptions.data.length} subscriptions for this customer`);
      
      if (subscriptions.data.length > 0) {
        // Find active subscription
        const activeSubscription = subscriptions.data.find(sub => 
          sub.status === 'active' || sub.status === 'trialing'
        );
        
        if (activeSubscription) {
          console.log(`\n✅ Found active subscription: ${activeSubscription.id}`);
          
          // Update profile with subscription ID and pro membership
          await db.update(profilesTable)
            .set({
              stripeSubscriptionId: activeSubscription.id,
              membership: 'pro'
            })
            .where(eq(profilesTable.userId, userId));
          
          console.log('✅ Updated user profile with subscription ID and Pro membership');
          return;
        } else {
          console.log('❌ No active subscriptions found');
        }
      }
    }
    
    // 3. Check if user has subscription ID but not pro membership
    if (profile.stripeSubscriptionId && profile.membership !== 'pro') {
      console.log('\nUser has subscription ID but not pro membership. Checking subscription status...');
      
      try {
        const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          console.log(`\n✅ Subscription ${subscription.id} is ${subscription.status}`);
          
          // Update profile to pro membership
          await db.update(profilesTable)
            .set({ membership: 'pro' })
            .where(eq(profilesTable.userId, userId));
          
          console.log('✅ Updated user membership to Pro');
          return;
        } else {
          console.log(`❌ Subscription is not active (status: ${subscription.status})`);
        }
      } catch (error) {
        console.error('❌ Error retrieving subscription:', error);
      }
    }
    
    // 4. If user has pro membership but inactive subscription, check for other active subscriptions
    if (profile.membership === 'pro' && profile.stripeCustomerId) {
      if (profile.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
          
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            console.log(`\n✅ User already has active subscription ${subscription.id} and pro membership`);
            return;
          }
        } catch (error) {
          console.log(`❌ Could not retrieve subscription ${profile.stripeSubscriptionId}:`, error);
        }
      }
      
      // Look for other active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripeCustomerId,
        status: 'active',
      });
      
      if (subscriptions.data.length > 0) {
        console.log(`\n✅ Found ${subscriptions.data.length} active subscriptions for this customer`);
        
        // Update profile with the first active subscription
        await db.update(profilesTable)
          .set({ stripeSubscriptionId: subscriptions.data[0].id })
          .where(eq(profilesTable.userId, userId));
        
        console.log(`✅ Updated user profile with subscription ID: ${subscriptions.data[0].id}`);
        return;
      } else {
        console.log('❌ No active subscriptions found for this customer');
      }
    }
    
    console.log('\n❌ Could not automatically fix user membership');
    console.log('Consider manually updating the membership to "pro" if you can verify payment:');
    console.log(`
UPDATE profiles 
SET membership = 'pro' 
WHERE user_id = '${userId}';
`);
    
  } catch (error) {
    console.error('Error fixing user membership:', error);
  }
}

// Run the script with user ID provided as argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID as an argument:');
  console.error('npx tsx scripts/fix-user-membership.ts USER_ID');
  process.exit(1);
}

fixUserMembership(userId); 