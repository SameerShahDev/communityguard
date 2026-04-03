"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAdminStats() {
  const supabase = await createClient();

  // 1. Fetch Pro Users (pro_days_left > 0)
  const { count: proUsers, error: proError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("pro_days_left", 0);

  // 2. Fetch Trial Users (roughly those with 0 pro_days_left but recent signup)
  const { count: trialUsers, error: trialError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("pro_days_left", 0);

  // 3. Get Pricing for MRR calculation
  const { data: settings } = await supabase
    .from("admin_settings")
    .select("pro_price")
    .single();

  const proPrice = settings?.pro_price || 3500;
  const mrr = (proUsers || 0) * proPrice;

  return {
    mrr,
    proUsers: proUsers || 0,
    trialUsers: trialUsers || 0,
    error: proError || trialError
  };
}

export async function getAdminSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_settings")
    .select("*")
    .single();

  return { data, error };
}

export async function updateAdminSettings(settings: { 
  referral_active?: boolean; 
  maintenance_mode?: boolean; 
  pro_price?: number; 
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_settings")
    .update(settings)
    .eq("id", 1)
    .select()
    .single();

  return { data, error };
}

export async function generateGiftCode(code: string, uses: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gift_codes")
    .insert([{ code, uses_left: uses, created_by_admin: true }])
    .select()
    .single();

  return { data, error };
}

export async function addManualCredits(emailOrId: string, days: number, reason: string) {
  const supabase = await createClient();
  
  // Find user by email or ID
  const { data: user, error: findError } = await supabase
    .from("users")
    .select("id, pro_days_left")
    .or(`email.eq.${emailOrId},id.eq.${emailOrId}`)
    .single();

  if (findError || !user) return { error: "User not found" };

  // Update user pro days
  const { error: updateError } = await supabase
    .from("users")
    .update({ pro_days_left: (user.pro_days_left || 0) + days })
    .eq("id", user.id);

  if (updateError) return { error: updateError };

  // Log manual credit
  await supabase
    .from("manual_credits")
    .insert([{ 
      user_id: user.id, 
      days_added: days, 
      reason, 
      added_by_admin: true 
    }]);

  return { success: true };
}
