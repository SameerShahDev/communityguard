"use server";

import { createClient } from "@/lib/supabase/server";

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
}> {
  try {
    const supabase = await createClient();

    // Fetch current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { highRisk: 0, silent: 0, active: 0, proDays: 0, isPro: false, hasServer: false, userEmail: undefined, totalMembers: 0, serverName: null };
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
      serverName: community?.guild_name || null
    };
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    return { highRisk: 0, silent: 0, active: 0, proDays: 0, isPro: false, hasServer: false, userEmail: undefined, totalMembers: 0, serverName: null };
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
        updated_at
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

export async function createStripeCheckout() {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to create checkout");
    }
    
    const data = await res.json();
    return { url: data.url, error: null };
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return { url: null, error: error.message || "Failed to create checkout session" };
  }
}
