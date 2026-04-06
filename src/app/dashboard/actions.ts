"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats(): Promise<{ 
  highRisk: number; 
  silent: number; 
  active: number; 
  proDays: number; 
  isPro: boolean;
  userEmail: string | undefined;
}> {
  try {
    const supabase = await createClient();

    // Fetch current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { highRisk: 0, silent: 0, active: 0, proDays: 0, isPro: false, userEmail: undefined };
    }

    // Fetch user's pro status
    const { data: userData } = await supabase
      .from("users")
      .select("pro_days_left")
      .eq("id", user.id)
      .maybeSingle();

    const proDays = userData?.pro_days_left || 0;
    const isPro = proDays > 0;

    // Fetch counts from churn_scores (with error handling for empty tables)
    const { count: highRisk } = await supabase
      .from("churn_scores")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "HIGH_RISK");

    const { count: moderateRisk } = await supabase
      .from("churn_scores")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "SILENT");

    const { count: activeCount } = await supabase
      .from("member_activity")
      .select("*", { count: "exact", head: true });

    return {
      highRisk: highRisk || 0,
      silent: moderateRisk || 0,
      active: activeCount || 0,
      proDays,
      isPro,
      userEmail: user.email || undefined
    };
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    return { highRisk: 0, silent: 0, active: 0, proDays: 0, isPro: false, userEmail: undefined };
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

export async function connectDiscord() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://communityguard.pages.dev';
    
    // Use Supabase built-in Discord OAuth instead of manual bot install
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${siteUrl}/dashboard`,
        scopes: 'identify email guilds bot applications.commands',
      },
    });
    
    if (error || !data.url) {
      console.error("Discord OAuth error:", error);
      throw new Error("Failed to generate Discord OAuth URL");
    }
    
    return data.url;
  } catch (error) {
    console.error("Error in connectDiscord:", error);
    throw error;
  }
}

export async function sendRecoveryEmails() {
  const cookieStore = (await import('next/headers')).cookies();
  const origin = (await (await import('next/headers')).headers()).get('origin') || "http://localhost:3000";
  
  try {
    const res = await fetch(`${origin}/api/churn/send-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) throw new Error("Failed to send emails");
    
    return await res.json();
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Failed to send emails" };
  }
}
