import { createClient } from '@/lib/supabase/server';

// Real Stripe Configuration - Replace with your actual keys
export const stripeConfig = {
  // Test Keys (replace with your actual test keys)
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef',
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890abcdef',
  
  // Production Keys (uncomment and replace when ready)
  // publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51234567890abcdef',
  // secretKey: process.env.STRIPE_SECRET_KEY || 'sk_live_51234567890abcdef',
  
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_51234567890abcdef',
  
  // Pricing Configuration
  pricing: {
    proMonthly: {
      name: 'CommunityGuard Pro - Monthly',
      description: 'Advanced Discord community monitoring and analytics',
      amount: 3500, // $35.00 in cents
      currency: 'usd',
      interval: 'month' as const,
      features: [
        'Unlimited Discord servers',
        'Advanced analytics dashboard',
        'Real-time member monitoring',
        'Churn prediction algorithms',
        'Priority support',
        'Custom alerts',
        'Data export (CSV/JSON)',
        'API access'
      ]
    },
    proYearly: {
      name: 'CommunityGuard Pro - Yearly',
      description: 'Save 20% with annual billing',
      amount: 33600, // $336.00 in cents (20% discount)
      currency: 'usd',
      interval: 'year' as const,
      features: [
        'Everything in Pro Monthly',
        '20% discount on annual billing',
        'Advanced yearly analytics',
        'Custom reporting',
        'Dedicated account manager'
      ]
    },
    starter: {
      name: 'CommunityGuard Starter',
      description: 'Perfect for small communities',
      amount: 1000, // $10.00 in cents
      currency: 'usd',
      interval: 'month' as const,
      features: [
        '1 Discord server',
        'Basic analytics',
        'Member monitoring (up to 100)',
        'Email support',
        'Basic alerts'
      ]
    }
  }
};

// Real Stripe instance
import Stripe from 'stripe';

export const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2024-04-10',
  typescript: true,
});

// Payment session creation
export async function createCheckoutSession(userId: string, priceId: string) {
  try {
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=cancelled`,
      metadata: {
        userId: userId,
        source: 'communityguard_dashboard'
      },
      allow_promotion_codes: true,
      client_reference_id: userId,
    });

    return { success: true, url: session.url, sessionId: session.id };
  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create checkout session' 
    };
  }
}

// Create product and prices (run once to set up in Stripe)
export async function createProductsAndPrices() {
  try {
    // Create Pro Monthly product
    const proMonthlyProduct = await stripe.products.create({
      name: stripeConfig.pricing.proMonthly.name,
      description: stripeConfig.pricing.proMonthly.description,
      images: ['https://your-domain.com/pro-product-image.png'],
      metadata: {
        tier: 'pro',
        interval: 'monthly'
      }
    });

    const proMonthlyPrice = await stripe.prices.create({
      product: proMonthlyProduct.id,
      unit_amount: stripeConfig.pricing.proMonthly.amount,
      currency: stripeConfig.pricing.proMonthly.currency,
      recurring: {
        interval: stripeConfig.pricing.proMonthly.interval,
        trial_period_days: 7 // 7-day free trial
      },
      metadata: {
        features: stripeConfig.pricing.proMonthly.features.join(', ')
      }
    });

    // Create Pro Yearly product
    const proYearlyProduct = await stripe.products.create({
      name: stripeConfig.pricing.proYearly.name,
      description: stripeConfig.pricing.proYearly.description,
      images: ['https://your-domain.com/pro-yearly-product-image.png'],
      metadata: {
        tier: 'pro',
        interval: 'yearly'
      }
    });

    const proYearlyPrice = await stripe.prices.create({
      product: proYearlyProduct.id,
      unit_amount: stripeConfig.pricing.proYearly.amount,
      currency: stripeConfig.pricing.proYearly.currency,
      recurring: {
        interval: stripeConfig.pricing.proYearly.interval,
        trial_period_days: 14 // 14-day free trial for yearly
      },
      metadata: {
        features: stripeConfig.pricing.proYearly.features.join(', ')
      }
    });

    // Create Starter product
    const starterProduct = await stripe.products.create({
      name: stripeConfig.pricing.starter.name,
      description: stripeConfig.pricing.starter.description,
      images: ['https://your-domain.com/starter-product-image.png'],
      metadata: {
        tier: 'starter',
        interval: 'monthly'
      }
    });

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: stripeConfig.pricing.starter.amount,
      currency: stripeConfig.pricing.starter.currency,
      recurring: {
        interval: stripeConfig.pricing.starter.interval,
        trial_period_days: 3 // 3-day free trial
      },
      metadata: {
        features: stripeConfig.pricing.starter.features.join(', ')
      }
    });

    return {
      success: true,
      prices: {
        proMonthly: proMonthlyPrice.id,
        proYearly: proYearlyPrice.id,
        starter: starterPrice.id
      }
    };
  } catch (error) {
    console.error('Error creating products and prices:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create products' };
  }
}

// Webhook handler for Stripe events
export async function handleStripeWebhook(body: string, signature: string) {
  try {
    const event = stripe.webhooks.constructEvent(body, signature, stripeConfig.webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await handleRenewalPayment(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handleFailedPayment(failedInvoice);
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}

// Handle successful payment
async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const supabase = await createClient();
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  try {
    // Add pro days to user account
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        pro_days_left: 30, // Start with 30 days
        stripe_customer_id: session.customer as string,
        subscription_id: session.subscription as string,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user pro status:', updateError);
      return;
    }

    // Log payment
    await supabase.from('payment_logs').insert([{
      user_id: userId,
      session_id: session.id,
      customer_id: session.customer,
      subscription_id: session.subscription,
      amount: session.amount_total,
      currency: session.currency,
      status: 'completed',
      timestamp: new Date().toISOString()
    }]);

    console.log('Successfully processed payment for user:', userId);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

// Handle renewal payment
async function handleRenewalPayment(invoice: Stripe.Invoice) {
  const supabase = await createClient();
  
  try {
    // Get customer's subscription
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
      console.error('No subscription found in invoice');
      return;
    }
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer as string;

    // Find user by customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError || !user) {
      console.error('User not found for customer ID:', customerId);
      return;
    }

    // Add more pro days
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        pro_days_left: user.pro_days_left + 30,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user pro days:', updateError);
      return;
    }

    // Log renewal
    await supabase.from('payment_logs').insert([{
      user_id: user.id,
      invoice_id: invoice.id,
      customer_id: customerId,
      subscription_id: invoice.subscription,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'renewed',
      timestamp: new Date().toISOString()
    }]);

    console.log('Successfully processed renewal for user:', user.id);
  } catch (error) {
    console.error('Error handling renewal payment:', error);
  }
}

// Handle failed payment
async function handleFailedPayment(invoice: Stripe.Invoice) {
  const supabase = await createClient();
  
  try {
    const customerId = invoice.customer as string;

    // Find user by customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError || !user) {
      console.error('User not found for customer ID:', customerId);
      return;
    }

    // Log failed payment
    await supabase.from('payment_logs').insert([{
      user_id: user.id,
      invoice_id: invoice.id,
      customer_id: customerId,
      subscription_id: invoice.subscription,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      timestamp: new Date().toISOString()
    }]);

    console.log('Logged failed payment for user:', user.id);
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const supabase = await createClient();
  const customerId = subscription.customer as string;

  try {
    // Find user by customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError || !user) {
      console.error('User not found for customer ID:', customerId);
      return;
    }

    // Update user to remove pro status
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        pro_days_left: 0,
        subscription_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user subscription status:', updateError);
      return;
    }

    // Log cancellation
    await supabase.from('payment_logs').insert([{
      user_id: user.id,
      subscription_id: subscription.id,
      customer_id: customerId,
      status: 'cancelled',
      timestamp: new Date().toISOString()
    }]);

    console.log('Successfully processed cancellation for user:', user.id);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

// Customer portal access
export async function createCustomerPortalSession(userId: string) {
  const supabase = await createClient();
  
  try {
    // Get user's Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user?.stripe_customer_id) {
      return { success: false, error: 'No active subscription found' };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create portal session' 
    };
  }
}

// Get subscription status
export async function getSubscriptionStatus(userId: string) {
  const supabase = await createClient();
  
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_id, pro_days_left')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { active: false, daysLeft: 0 };
    }

    if (!user.subscription_id) {
      return { active: false, daysLeft: user.pro_days_left };
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
    
    return {
      active: subscription.status === 'active',
      daysLeft: user.pro_days_left,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { active: false, daysLeft: 0 };
  }
}
