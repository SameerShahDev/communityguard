"use server";

import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession, createCustomerPortalSession, getSubscriptionStatus } from "@/lib/cashfree";

// Helper function to generate recovery email content
function generateRecoveryEmail(username: string, serverName: string): string {
  return `
    Hi ${username},
    
    We noticed you haven't been active on ${serverName} Discord server lately.
    
    Your community misses you! Come back and reconnect with your friends.
    
    Best regards,
    CommunityGuard Team
  `;
}

// Mock email sending function
async function sendEmail(to: string, subject: string, content: string): Promise<void> {
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  console.log(`Sending email to ${to}: ${subject}`);
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 100));
}

export async function createCashfreeCheckout(userId: string, priceId?: string) {
  try {
    const supabase = await createClient();
    
    // Get user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, stripe_customer_id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return { success: false, error: "User not found" };
    }

    // Default to Pro Monthly if no price specified
    const defaultPriceId = "price_1OGdGv2eZvKYlo2C7s8h9X2L"; // Replace with your actual price ID
    
    const result = await createCheckoutSession(userId, priceId || defaultPriceId);
    
    if (result.success) {
      return { 
        success: true, 
        url: result.url,
        sessionId: result.sessionId
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error creating Stripe checkout:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create checkout session" 
    };
  }
}

export async function createBillingPortalSession(userId: string) {
  try {
    const result = await createCustomerPortalSession(userId);
    
    if (result.success) {
      return { success: true, url: result.url };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create billing portal session" 
    };
  }
}

export async function getUserSubscriptionStatus(userId: string) {
  try {
    const supabase = await createClient();
    
    // Get subscription status using Supabase function
    const { data: subscriptionData, error } = await supabase
      .rpc('get_user_subscription_status', { p_user_id: userId });

    if (error) {
      console.error("Error getting subscription status:", error);
      return { active: false, daysLeft: 0 };
    }

    const subscription = subscriptionData?.[0];
    if (!subscription) {
      return { active: false, daysLeft: 0 };
    }

    return {
      active: subscription.is_active,
      daysLeft: subscription.days_left,
      planName: subscription.plan_name,
      billingCycle: subscription.billing_cycle,
      priceInr: subscription.price_inr,
      endsAt: subscription.ends_at
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return { active: false, daysLeft: 0 };
  }
}

export async function getMemberActivity(userId: string, timeRange: '7d' | '30d' | '90d' = '30d') {
  try {
    const supabase = await createClient();
    
    // Calculate date range
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    const { data: activity, error } = await supabase
      .from("member_activity")
      .select("*")
      .eq("user_id", userId)
      .gte("last_message_at", startDate.toISOString())
      .order("last_message_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    
    return { activity: activity || [] };
  } catch (error: any) {
    console.error("Error fetching member activity:", error);
    return { activity: [], error: error.message };
  }
}

export async function getServerMetrics(userId: string) {
  try {
    const supabase = await createClient();
    
    // Get user's server
    const { data: server, error: serverError } = await supabase
      .from("communities")
      .select("guild_id, guild_name, member_count")
      .eq("user_id", userId)
      .single();

    if (serverError || !server) {
      return { error: "Server not found" };
    }

    // Get activity metrics
    const { data: activity, error: activityError } = await supabase
      .from("member_activity")
      .select("risk_level, last_message_at")
      .eq("guild_id", server.guild_id);

    if (activityError) throw activityError;

    const totalMembers = activity?.length || 0;
    const activeMembers = activity?.filter(m => m.risk_level === 'LOW_RISK').length || 0;
    const atRiskMembers = activity?.filter(m => m.risk_level === 'HIGH_RISK').length || 0;

    return {
      serverName: server.guild_name,
      totalMembers,
      activeMembers,
      atRiskMembers,
      activity: activity || []
    };
  } catch (error: any) {
    console.error("Error fetching server metrics:", error);
    return { error: error.message };
  }
}

export async function getWeeklyActivity(userId: string) {
  try {
    const supabase = await createClient();
    
    // Get last 7 days of activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: activity, error } = await supabase
      .from("member_activity")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", sevenDaysAgo.toISOString());

    if (error) throw error;

    // Group by day of week
    const weeklyData = [0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
    
    activity?.forEach(item => {
      const dayOfWeek = new Date(item.created_at).getDay();
      weeklyData[dayOfWeek]++;
    });

    return weeklyData;
  } catch (error: any) {
    console.error("Error fetching weekly activity:", error);
    return [0, 0, 0, 0, 0, 0];
  }
}

export async function getDashboardStats(): Promise<{
  highRisk: number;
  silent: number;
  active: number;
  proDays: number;
  isPro: boolean;
  hasServer: boolean;
  userEmail: string | undefined;
  totalMembers: number;
  serverName: string | null;
  growthRate: number;
  engagementRate: number;
  weeklyActivity: number[];
  topPerformers: any[];
  recentAlerts: any[];
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  planName: string | null;
  billingCycle: string | null;
  priceInr: number | null;
  endsAt: string | null;
}> {
  try {
    const supabase = await createClient();

    // Fetch current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { 
        highRisk: 0, 
        silent: 0, 
        active: 0, 
        proDays: 0, 
        isPro: false, 
        hasServer: false, 
        userEmail: undefined, 
        totalMembers: 0, 
        serverName: null, 
        growthRate: 0, 
        engagementRate: 0, 
        weeklyActivity: [0,0,0,0,0], 
        topPerformers: [], 
        recentAlerts: [], 
        systemHealth: 'good',
        planName: null, 
        billingCycle: null, 
        priceInr: null, 
        endsAt: null 
      };
    }

    // Get subscription status using Supabase function
    const subscriptionStatus = await getUserSubscriptionStatus(user.id);
    const proDays = subscriptionStatus.daysLeft || 0;
    const isPro = subscriptionStatus.active;

    // Fetch counts from churn_scores
    const { count: highRiskCount } = await supabase
      .from("churn_scores")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "HIGH_RISK");

    const { count: moderateRiskCount } = await supabase
      .from("churn_scores")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "SILENT");

    // Check if user has connected a Discord server and get member count
    const { data: communities } = await supabase
      .from("communities")
      .select("id, guild_id, guild_name, member_count")
      .eq("user_id", user.id)
      .limit(1);
    
    const hasServer = !!(communities && communities.length > 0);
    const community = communities?.[0];
    
    // Get total members from member_activity if community exists
    let totalMembersCount = 0;
    if (community?.guild_id) {
      const { count: memberCount } = await supabase
        .from("member_activity")
        .select("*", { count: "exact", head: true })
        .eq("guild_id", community.guild_id);
      totalMembersCount = memberCount || 0;
    }

    return {
      highRisk: highRiskCount || 0,
      silent: moderateRiskCount || 0,
      active: totalMembersCount, // Use actual member count as active
      proDays,
      isPro,
      hasServer,
      userEmail: user.email || undefined,
      totalMembers: totalMembersCount,
      serverName: community?.guild_name || null,
      growthRate: 0,
      engagementRate: 0,
      weeklyActivity: [0,0,0,0,0],
      topPerformers: [],
      recentAlerts: [],
      systemHealth: 'good',
      planName: subscriptionStatus.planName,
      billingCycle: subscriptionStatus.billingCycle,
      priceInr: subscriptionStatus.priceInr,
      endsAt: subscriptionStatus.endsAt
    };
  } catch (error: any) {
    console.error("Error in getDashboardStats:", error);
    return { 
      highRisk: 0, 
      silent: 0, 
      active: 0, 
      proDays: 0, 
      isPro: false, 
      hasServer: false, 
      userEmail: undefined, 
      totalMembers: 0, 
      serverName: null, 
      growthRate: 0, 
      engagementRate: 0, 
      weeklyActivity: [0,0,0,0,0,0], 
      topPerformers: [], 
      recentAlerts: [], 
      systemHealth: 'good',
      planName: null, 
      billingCycle: null, 
      priceInr: null, 
      endsAt: null 
    };
  }
}

export async function getAtRiskMembers() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("churn_scores")
      .select(`
        member_id,
        risk_level,
        score,
        updated_at,
        username,
        last_message
      `)
      .order("score", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching at-risk members:", error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error in getAtRiskMembers:", error);
    return { data: [], error };
  }
}

export async function connectDiscord(userId: string) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://communityguard.pages.dev';
    const clientId = process.env.DISCORD_CLIENT_ID || '1489654332361019422';
    
    // Include user_id in state parameter for reliable auth
    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
    
    // Discord Bot Authorization URL (not user OAuth)
    const params = new URLSearchParams({
      client_id: clientId,
      permissions: '8', // Admin permissions
      scope: 'bot applications.commands identify guilds',
      redirect_uri: `${siteUrl}/api/auth/callback/discord`,
      response_type: 'code',
      state: state
    });
    
    const discordUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
    console.log('Generated Discord Bot URL with state:', discordUrl);
    
    return discordUrl;
  } catch (error) {
    console.error("Error in connectDiscord:", error);
    throw error;
  }
}

export async function createSubscription(
  userId: string, 
  planId: string, 
  billingCycle: 'monthly' | 'yearly',
  paymentDetails: any
) {
  try {
    const supabase = await createClient();
    
    // Plan details
    const plans: Record<string, { name: string; price_inr: number; price_usd: number }> = {
      starter_monthly: { name: 'CommunityGuard Starter - Monthly', price_inr: 29900, price_usd: 359 },
      starter_yearly: { name: 'CommunityGuard Starter - Yearly', price_inr: 299000, price_usd: 3590 },
      pro_monthly: { name: 'CommunityGuard Professional - Monthly', price_inr: 49900, price_usd: 599 },
      pro_yearly: { name: 'CommunityGuard Professional - Yearly', price_inr: 499000, price_usd: 5990 },
      enterprise_monthly: { name: 'CommunityGuard Enterprise - Monthly', price_inr: 99900, price_usd: 1199 },
      enterprise_yearly: { name: 'CommunityGuard Enterprise - Yearly', price_inr: 999000, price_usd: 11990 }
    };
    
    const plan = plans[`${planId}_${billingCycle}`];
    if (!plan) {
      return { success: false, error: 'Invalid plan selected' };
    }

    // Calculate end date
    const now = new Date();
    const endsAt = billingCycle === 'yearly' 
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // Insert subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        plan_name: plan.name,
        status: 'active',
        billing_cycle: billingCycle,
        price_inr: plan.price_inr,
        price_usd: plan.price_usd,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        payment_provider: 'cashfree',
        external_subscription_id: paymentDetails?.order_id || null,
        last_payment_at: now.toISOString(),
        next_billing_at: endsAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Create subscription error:', error);
      return { success: false, error: 'Failed to create subscription' };
    }

    return { success: true, subscription };
  } catch (error) {
    console.error('Create subscription error:', error);
    return { success: false, error: 'Failed to create subscription' };
  }
}

export async function cancelSubscription(userId: string, reason?: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        auto_renew: false
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Cancel subscription error:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }

    return { success: true };
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return { success: false, error: 'Failed to cancel subscription' };
  }
}

export async function upgradeSubscription(userId: string, newPlanId: string, billingCycle: 'monthly' | 'yearly') {
  try {
    const supabase = await createClient();
    
    // Cancel current subscription
    await cancelSubscription(userId, 'Upgrading to new plan');
    
    // Create new subscription
    return await createSubscription(userId, newPlanId, billingCycle, {});
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    return { success: false, error: 'Failed to upgrade subscription' };
  }
}

export async function sendRecoveryEmails(userId: string) {
  try {
    const supabase = await createClient();
    
    // Get user's server details and at-risk members
    const { data: serverData, error: serverError } = await supabase
      .from('user_servers')
      .select('server_id, server_name')
      .eq('user_id', userId)
      .single();

    if (serverError || !serverData) {
      return { success: false, error: 'Server not found' };
    }

    // Get at-risk members
    const { data: atRiskMembers, error: membersError } = await supabase
      .from('members')
      .select('member_id, risk_level, username, email')
      .eq('server_id', serverData.server_id)
      .in('risk_level', ['HIGH_RISK', 'SILENT'])
      .limit(50);

    if (membersError) {
      return { success: false, error: 'Failed to fetch members' };
    }

    // Send recovery emails (mock implementation)
    const emailPromises = atRiskMembers?.map(async (member) => {
      const emailContent = generateRecoveryEmail(member.username, serverData.server_name);
      return sendEmail(member.email, 'We miss you on Discord!', emailContent);
    }) || [];

    const results = await Promise.allSettled(emailPromises);
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Track email sending
    const recipientEmails = atRiskMembers?.map(m => m.email).filter(Boolean) || [];
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email-tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          emailsSent: sent,
          recipientEmails,
          campaignType: 'recovery'
        })
      });
    } catch (trackingError) {
      console.error('Failed to track emails:', trackingError);
    }

    return { success: true, sent, failed };
  } catch (error) {
    console.error('Send recovery emails error:', error);
    return { success: false, error: 'Failed to send recovery emails' };
  }
}
