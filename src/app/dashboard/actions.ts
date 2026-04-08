"use server";

import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession, createCustomerPortalSession, getSubscriptionStatus } from "@/lib/cashfree";

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
    const result = await getSubscriptionStatus(userId);
    return result;
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
    
    // Get community info
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (communityError) throw communityError;
    
    // Get member metrics
    const { data: members, error: membersError } = await supabase
      .from("member_activity")
      .select("risk_level, score, last_message_at")
      .eq("user_id", userId);

    if (membersError) throw membersError;
    
    // Calculate metrics
    const totalMembers = members?.length || 0;
    const highRiskMembers = members?.filter(m => m.risk_level === 'high').length || 0;
    const avgRiskScore = members?.reduce((acc, m) => acc + m.score, 0) / totalMembers || 0;
    
    const metrics = {
      community,
      totalMembers,
      highRiskMembers,
      avgRiskScore,
      healthScore: Math.max(0, 100 - (highRiskMembers * 10) - (avgRiskScore / 2))
    };
    
    return { metrics };
  } catch (error: any) {
    console.error("Error fetching server metrics:", error);
    return { metrics: null, error: error.message };
  }
}

export async function exportData(userId: string, format: 'csv' | 'json') {
  try {
    const supabase = await createClient();
    
    // Get all member data
    const { data: members, error: membersError } = await supabase
      .from("member_activity")
      .select("*")
      .eq("user_id", userId);

    if (membersError) throw membersError;
    
    let data: string;
    
    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Username', 'Risk Level', 'Score', 'Last Message', 'Member ID'];
      const rows = members?.map(m => [
        m.username || 'Unknown',
        m.risk_level,
        m.score,
        new Date(m.last_message_at).toLocaleDateString(),
        m.member_id
      ]) || [];
      
      data = [headers, ...rows].map(row => row.join(',')).join('\n');
    } else {
      // Convert to JSON
      data = JSON.stringify(members || [], null, 2);
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error("Error exporting data:", error);
    return { success: false, error: error.message };
  }
}

export async function getWeeklyActivity(userId: string) {
  try {
    const supabase = await createClient();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: activity, error } = await supabase
      .from("member_activity")
      .select("last_message_at")
      .eq("user_id", userId)
      .gte("last_message_at", sevenDaysAgo.toISOString());

    if (error) throw error;
    
    // Group by day of week
    const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
    
    activity?.forEach(item => {
      const day = new Date(item.last_message_at).getDay();
      weeklyData[day === 0 ? 6 : day - 1]++; // Convert Sun=0 to Sat=6
    });
    
    return weeklyData;
  } catch (error: any) {
    console.error("Error fetching weekly activity:", error);
    return [0, 0, 0, 0, 0, 0, 0];
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
}> {
  try {
    const supabase = await createClient();

    // Fetch current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { highRisk: 0, silent: 0, active: 0, proDays: 0, isPro: false, hasServer: false, userEmail: undefined, totalMembers: 0, serverName: null, growthRate: 0, engagementRate: 0, weeklyActivity: [0,0,0,0,0,0,0], topPerformers: [], recentAlerts: [], systemHealth: 'good' };
    }

    // Fetch user's pro status
    const { data: userData } = await supabase
      .from("users")
      .select("pro_days_left")
      .eq("id", user.id)
      .maybeSingle();

    const proDays = userData?.pro_days_left || 0;
    const isPro = proDays > 0;

    // Fetch counts from churn_scores
    const { count: highRisk } = await supabase
      .from("churn_scores")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "HIGH_RISK");

    const { count: moderateRisk } = await supabase
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
    let totalMembers = 0;
    if (community?.guild_id) {
      const { count: memberCount } = await supabase
        .from("member_activity")
        .select("*", { count: "exact", head: true })
        .eq("guild_id", community.guild_id);
      totalMembers = memberCount || 0;
    }

    return {
      highRisk: highRisk || 0,
      silent: moderateRisk || 0,
      active: totalMembers, // Use actual member count as active
      proDays,
      isPro,
      hasServer,
      userEmail: user.email || undefined,
      totalMembers,
      serverName: community?.guild_name || null,
      growthRate: 0,
      engagementRate: 0,
      weeklyActivity: [0,0,0,0,0,0,0],
      topPerformers: [],
      recentAlerts: [],
      systemHealth: 'good'
    };
  } catch (error: any) {
    console.error("Error in getDashboardStats:", error);
    return { highRisk: 0, silent: 0, active: 0, proDays: 0, isPro: false, hasServer: false, userEmail: undefined, totalMembers: 0, serverName: null, growthRate: 0, engagementRate: 0, weeklyActivity: [0,0,0,0,0,0,0], topPerformers: [], recentAlerts: [], systemHealth: 'good' };
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

export async function sendRecoveryEmails() {
  try {
    const res = await fetch('/api/emails/send-recovery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to send emails");
    }
    
    return await res.json();
  } catch (error: any) {
    console.error("Send recovery emails error:", error);
    return { error: error.message || "Failed to send emails", sent: 0, recovered: 0 };
  }
}
