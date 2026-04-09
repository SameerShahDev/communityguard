// Advanced Subscription Management System
// Easy to use, feature-rich subscription actions

"use server";

import { createClient } from "@/lib/supabase/server";

// ==================== SUBSCRIPTION PLANS ====================

export const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'starter',
    name: 'IGone Starter',
    monthly: { price_inr: 29900, price_usd: 359 },
    yearly: { price_inr: 299000, price_usd: 3590 },
    features: ['1 Discord Server', '100 Members Tracked', '10 Emails/Day', 'Basic Analytics'],
    limits: { max_servers: 1, max_members: 100, max_emails_per_day: 10 }
  },
  pro: {
    id: 'pro',
    name: 'IGone Professional',
    monthly: { price_inr: 49900, price_usd: 599 },
    yearly: { price_inr: 499000, price_usd: 5990 },
    features: ['5 Discord Servers', '1,000 Members Tracked', '100 Emails/Day', 'Advanced Analytics', 'Priority Support'],
    limits: { max_servers: 5, max_members: 1000, max_emails_per_day: 100 }
  },
  enterprise: {
    id: 'enterprise',
    name: 'IGone Enterprise',
    monthly: { price_inr: 99900, price_usd: 1199 },
    yearly: { price_inr: 999000, price_usd: 11990 },
    features: ['Unlimited Servers', 'Unlimited Members', 'Unlimited Emails', 'AI-Powered Insights', '24/7 Support', 'Custom Integrations'],
    limits: { max_servers: 999, max_members: 999999, max_emails_per_day: 9999 }
  }
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;
export type BillingCycle = 'monthly' | 'yearly';

// ==================== EASY SUBSCRIPTION SEARCH ====================

export async function searchUserSubscriptions(
  userId: string,
  options?: {
    status?: 'active' | 'cancelled' | 'expired' | 'all';
    query?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .rpc('search_subscriptions', {
        search_query: options?.query || null,
        status_filter: options?.status === 'all' ? null : options?.status || null,
        date_from: options?.dateFrom || null,
        date_to: options?.dateTo || null,
        is_admin_view: false
      });
    
    if (error) throw error;
    
    return { 
      subscriptions: data || [], 
      count: data?.length || 0,
      error: null 
    };
  } catch (error: any) {
    console.error("Error searching subscriptions:", error);
    return { subscriptions: [], count: 0, error: error.message };
  }
}

// Admin: Search all subscriptions
export async function searchAllSubscriptions(
  options?: {
    query?: string;
    status?: string;
    plan?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  try {
    const supabase = await createClient();
    
    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user?.id)
      .single();
    
    if (!userData?.is_admin) {
      return { subscriptions: [], count: 0, error: 'Unauthorized' };
    }
    
    const { data, error } = await supabase
      .rpc('search_subscriptions', {
        search_query: options?.query || null,
        status_filter: options?.status || null,
        plan_filter: options?.plan || null,
        date_from: options?.dateFrom || null,
        date_to: options?.dateTo || null,
        is_admin_view: true
      });
    
    if (error) throw error;
    
    return { 
      subscriptions: data || [], 
      count: data?.length || 0,
      error: null 
    };
  } catch (error: any) {
    console.error("Error searching all subscriptions:", error);
    return { subscriptions: [], count: 0, error: error.message };
  }
}

// ==================== SUBSCRIPTION SUMMARY ====================

export async function getSubscriptionDashboard(userId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .rpc('get_subscription_summary', { p_user_id: userId });
    
    if (error) throw error;
    
    return { 
      summary: data?.[0] || null,
      error: null 
    };
  } catch (error: any) {
    console.error("Error getting subscription summary:", error);
    return { summary: null, error: error.message };
  }
}

// ==================== CREATE SUBSCRIPTION (ADVANCED) ====================

export async function createSubscriptionAdvanced(
  userId: string,
  planId: PlanId,
  billingCycle: BillingCycle,
  options?: {
    trialDays?: number;
    couponCode?: string;
    prorationEnabled?: boolean;
    metadata?: Record<string, any>;
  }
) {
  try {
    const supabase = await createClient();
    
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return { success: false, error: 'Invalid plan selected' };
    }
    
    const price = plan[billingCycle];
    const now = new Date();
    
    // Check if user has active subscription (for upgrades)
    const { data: activeSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    const isUpgrade = activeSub && activeSub.plan_id !== planId;
    
    // Calculate dates
    const trialDays = options?.trialDays || 0;
    const trialEndsAt = trialDays > 0 
      ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
      : null;
    
    const subscriptionDuration = billingCycle === 'yearly' 
      ? 365 * 24 * 60 * 60 * 1000 
      : 30 * 24 * 60 * 60 * 1000;
    
    const endsAt = trialDays > 0
      ? new Date(trialEndsAt!.getTime() + subscriptionDuration)
      : new Date(now.getTime() + subscriptionDuration);
    
    // Calculate proration if upgrading
    let finalPrice: number = price.price_inr;
    if (isUpgrade && options?.prorationEnabled !== false && activeSub) {
      const daysRemaining = Math.max(0, Math.floor((new Date(activeSub.ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyRate = (activeSub.price_inr as number) / 30; // Approximate daily rate
      const credit = Math.floor(dailyRate * daysRemaining);
      finalPrice = Math.max(0, (price.price_inr as number) - credit);
    }
    
    // Apply coupon discount
    let discountAmount = 0;
    if (options?.couponCode) {
      // Validate coupon (simplified - you should check against a coupons table)
      discountAmount = Math.floor(finalPrice * 0.1); // 10% discount example
    }
    
    const totalAmount = finalPrice - discountAmount;
    
    // Create subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        plan_name: trialDays > 0 ? `${plan.name} (Trial)` : plan.name,
        status: 'active',
        billing_cycle: billingCycle,
        price_inr: price.price_inr,
        price_usd: price.price_usd,
        total_amount: totalAmount,
        trial_days: trialDays,
        trial_ends_at: trialEndsAt?.toISOString(),
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        next_billing_at: endsAt.toISOString(),
        auto_renew: true,
        is_upgrade: isUpgrade,
        previous_plan_id: isUpgrade ? activeSub.plan_id : null,
        previous_plan_name: isUpgrade ? activeSub.plan_name : null,
        coupon_code: options?.couponCode,
        discount_amount: discountAmount,
        proration_enabled: options?.prorationEnabled ?? true,
        payment_status: trialDays > 0 ? 'completed' : 'pending',
        metadata: {
          ...options?.metadata,
          features: plan.features,
          limits: plan.limits,
          is_trial: trialDays > 0
        }
      })
      .select()
      .single();
    
    if (error) {
      console.error('Create subscription error:', error);
      return { success: false, error: 'Failed to create subscription' };
    }
    
    // If upgrading, cancel old subscription
    if (isUpgrade && activeSub) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
          cancellation_reason: 'Upgraded to new plan',
          auto_renew: false
        })
        .eq('id', activeSub.id);
    }
    
    return { 
      success: true, 
      subscription,
      isUpgrade,
      proratedAmount: isUpgrade ? finalPrice : null,
      discountApplied: discountAmount > 0 ? discountAmount : null
    };
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== TRIAL MANAGEMENT ====================

export async function startTrial(userId: string, planId: PlanId, trialDays: number = 7) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .rpc('start_trial_period', {
        p_user_id: userId,
        p_plan_id: planId,
        p_trial_days: trialDays
      });
    
    if (error) throw error;
    
    return { success: true, subscriptionId: data, error: null };
  } catch (error: any) {
    console.error('Start trial error:', error);
    return { success: false, subscriptionId: null, error: error.message };
  }
}

// ==================== CANCEL SUBSCRIPTION (ADVANCED) ====================

export async function cancelSubscriptionAdvanced(
  userId: string, 
  options?: {
    immediate?: boolean;
    reason?: string;
    feedback?: string;
  }
) {
  try {
    const supabase = await createClient();
    
    // Get active subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError || !subscription) {
      return { success: false, error: 'No active subscription found' };
    }
    
    const now = new Date();
    
    // If immediate cancellation or trial period
    if (options?.immediate || subscription.trial_days > 0) {
      // Cancel immediately
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
          cancellation_reason: options?.reason,
          auto_renew: false,
          metadata: {
            ...subscription.metadata,
            cancellation_feedback: options?.feedback,
            cancelled_immediately: true
          }
        })
        .eq('id', subscription.id);
      
      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Subscription cancelled immediately',
        effectiveDate: now.toISOString()
      };
    } else {
      // Cancel at period end (graceful)
      const { error } = await supabase
        .from('subscriptions')
        .update({
          auto_renew: false,
          cancellation_reason: options?.reason,
          metadata: {
            ...subscription.metadata,
            cancellation_feedback: options?.feedback,
            will_cancel_at: subscription.ends_at,
            cancelled_at_period_end: true
          }
        })
        .eq('id', subscription.id);
      
      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Subscription will cancel at period end',
        effectiveDate: subscription.ends_at
      };
    }
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== REACTIVATE SUBSCRIPTION ====================

export async function reactivateSubscription(
  subscriptionId: string,
  options?: {
    newPlanId?: PlanId;
    billingCycle?: BillingCycle;
  }
) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .rpc('reactivate_subscription', {
        p_subscription_id: subscriptionId,
        p_new_plan_id: options?.newPlanId || null,
        p_billing_cycle: options?.billingCycle || 'monthly'
      });
    
    if (error) throw error;
    
    return { success: data, error: null };
  } catch (error: any) {
    console.error('Reactivate subscription error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== UPGRADE/DOWNGRADE ====================

export async function changePlan(
  userId: string,
  newPlanId: PlanId,
  options?: {
    billingCycle?: BillingCycle;
    prorationEnabled?: boolean;
  }
) {
  return createSubscriptionAdvanced(
    userId,
    newPlanId,
    options?.billingCycle || 'monthly',
    {
      prorationEnabled: options?.prorationEnabled,
      trialDays: 0 // No trial for upgrades
    }
  );
}

// ==================== GET SUBSCRIPTION EVENTS ====================

export async function getSubscriptionHistory(
  userId: string,
  subscriptionId?: string
) {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('subscription_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (subscriptionId) {
      query = query.eq('subscription_id', subscriptionId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { events: data || [], error: null };
  } catch (error: any) {
    console.error('Get subscription history error:', error);
    return { events: [], error: error.message };
  }
}

// ==================== WEBHOOK HANDLING ====================

export async function handleCashfreeWebhook(payload: any) {
  try {
    const supabase = await createClient();
    
    const { order_id, order_status, payment_details } = payload;
    
    // Find subscription by order_id
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('external_subscription_id', order_id)
      .single();
    
    if (fetchError || !subscription) {
      return { success: false, error: 'Subscription not found' };
    }
    
    // Update based on status
    let updates: any = {
      updated_at: new Date().toISOString()
    };
    
    if (order_status === 'PAID') {
      updates.payment_status = 'completed';
      updates.last_payment_at = new Date().toISOString();
      
      // If was trial, extend subscription
      if (subscription.trial_days > 0 && subscription.trial_ends_at) {
        const billingCycle = subscription.billing_cycle;
        const newEndsAt = billingCycle === 'yearly'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        updates.ends_at = newEndsAt.toISOString();
        updates.next_billing_at = newEndsAt.toISOString();
        updates.plan_name = subscription.plan_name.replace(' (Trial)', '');
      }
    } else if (order_status === 'FAILED') {
      updates.payment_status = 'failed';
    }
    
    const { error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscription.id);
    
    if (error) throw error;
    
    return { success: true, subscriptionId: subscription.id };
  } catch (error: any) {
    console.error('Webhook handling error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== ADMIN FUNCTIONS ====================

export async function adminUpdateSubscription(
  subscriptionId: string,
  updates: {
    status?: string;
    extendDays?: number;
    addTrialDays?: number;
    reason?: string;
  }
) {
  try {
    const supabase = await createClient();
    
    // Check admin
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user?.id)
      .single();
    
    if (!userData?.is_admin) {
      return { success: false, error: 'Unauthorized' };
    }
    
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();
    
    if (fetchError || !subscription) {
      return { success: false, error: 'Subscription not found' };
    }
    
    const updateData: any = {};
    
    if (updates.status) {
      updateData.status = updates.status;
    }
    
    if (updates.extendDays && updates.extendDays > 0) {
      const currentEndsAt = new Date(subscription.ends_at);
      const newEndsAt = new Date(currentEndsAt.getTime() + updates.extendDays * 24 * 60 * 60 * 1000);
      updateData.ends_at = newEndsAt.toISOString();
      updateData.next_billing_at = newEndsAt.toISOString();
    }
    
    if (updates.addTrialDays && updates.addTrialDays > 0) {
      updateData.trial_days = (subscription.trial_days || 0) + updates.addTrialDays;
      updateData.trial_ends_at = new Date(Date.now() + updateData.trial_days * 24 * 60 * 60 * 1000).toISOString();
    }
    
    updateData.metadata = {
      ...subscription.metadata,
      admin_updated_at: new Date().toISOString(),
      admin_update_reason: updates.reason,
      admin_updated_by: user?.id
    };
    
    const { error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId);
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Admin update error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== UTILITY FUNCTIONS ====================

export function calculateProration(
  currentPlanPrice: number,
  newPlanPrice: number,
  daysRemaining: number,
  totalDays: number = 30
) {
  const dailyRate = currentPlanPrice / totalDays;
  const credit = Math.floor(dailyRate * daysRemaining);
  const finalPrice = Math.max(0, newPlanPrice - credit);
  
  return {
    credit,
    finalPrice,
    savings: credit
  };
}

export async function getPlanDetails(planId: PlanId) {
  return SUBSCRIPTION_PLANS[planId];
}

export async function getAllPlans() {
  return Object.values(SUBSCRIPTION_PLANS);
}

export async function validateCouponCode(couponCode: string) {
  // Simplified coupon validation - integrate with your coupon system
  const validCoupons: Record<string, { discount: number; type: 'percentage' | 'fixed' }> = {
    'STARTER10': { discount: 10, type: 'percentage' },
    'PRO20': { discount: 20, type: 'percentage' },
    'WELCOME50': { discount: 50, type: 'fixed' }
  };
  
  const coupon = validCoupons[couponCode.toUpperCase()];
  
  if (!coupon) {
    return { valid: false, error: 'Invalid coupon code' };
  }
  
  return { valid: true, coupon, error: null };
}
