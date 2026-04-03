"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  // Fetch counts from churn_scores
  // 1. Fetch current user pro_days_left
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from("users")
    .select("pro_days_left")
    .eq("id", user?.id)
    .single();

  // 2. High Risk count (risk_level = 'HIGH_RISK')
  const { count: highRisk } = await supabase
    .from("churn_scores")
    .select("*", { count: "exact", head: true })
    .eq("risk_level", "HIGH_RISK");

  // 3. Moderate Risk count (silent)
  const { count: moderateRisk } = await supabase
    .from("churn_scores")
    .select("*", { count: "exact", head: true })
    .eq("risk_level", "SILENT");

  // 4. Total Members count from member_activity
  const { count: activeCount } = await supabase
    .from("member_activity")
    .select("*", { count: "exact", head: true });

  return {
    highRisk: highRisk || 0,
    silent: moderateRisk || 0,
    active: activeCount || 0,
    proDays: userData?.pro_days_left || 0
  };
}

export async function getAtRiskMembers() {
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

  return { data: data || [], error };
}

export async function connectDiscord() {
  // Normally returns the Discord OAuth URL
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/discord`);
  const scope = "identify guilds bot applications.commands";
  const permissions = "8"; // Admin
  
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}`;
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
  } catch (error: any) {
    return { error: error.message };
  }
}
