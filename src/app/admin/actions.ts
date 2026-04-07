"use server";

import { createClient } from "@/lib/supabase/server";

// Admin User Management Types
interface UserSubscription {
  id: string;
  email: string;
  pro_days_left: number;
  is_admin: boolean;
  discord_id?: string;
  created_at: string;
}

interface SubscriptionLimits {
  max_servers: number;
  max_emails_per_day: number;
  max_members_tracked: number;
  max_discord_bots?: number;
}

export async function getAdminStats() {
  try {
    const supabase = await createClient();

    // 1. Fetch Pro Users (pro_days_left > 0)
    const { count: proUsers, error: proError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gt("pro_days_left", 0);

    // 2. Fetch Trial Users (roughly those with 0 pro_days_left)
    const { count: trialUsers, error: trialError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("pro_days_left", 0);

    // 3. Fetch total users
    const { count: totalUsers, error: totalError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // 4. Get Pricing for MRR calculation
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("pro_price, referral_active, maintenance_mode")
      .maybeSingle();

    const proPrice = settings?.pro_price || 3500;
    const mrr = (proUsers || 0) * proPrice;

    // 5. Calculate growth rate (users from last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { count: recentUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    const { count: previousUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString());

    const growthRate = (previousUsers ?? 0) > 0 ? (((recentUsers ?? 0) - (previousUsers ?? 0)) / (previousUsers ?? 0)) * 100 : 0;

    // 6. Calculate churn rate (users who became inactive)
    const { count: churnedUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("pro_days_left", 0)
      .lt("created_at", thirtyDaysAgo.toISOString());

    const churnRate = (totalUsers ?? 0) > 0 ? ((churnedUsers ?? 0) / (totalUsers ?? 0)) * 100 : 0;

    // 7. Active webhooks count
    const { count: activeWebhooks } = await supabase
      .from("communities")
      .select("*", { count: "exact", head: true })
      .not("webhook_url", "is", null);

    // 8. System health check
    const systemHealth = mrr > 10000 ? 'healthy' : mrr > 5000 ? 'warning' : 'critical';

    return {
      mrr,
      proUsers: proUsers || 0,
      trialUsers: trialUsers || 0,
      totalUsers: totalUsers || 0,
      settings,
      growthRate,
      churnRate,
      activeWebhooks: activeWebhooks || 0,
      systemHealth
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return null;
  }
}

export async function updateUserProDays(userId: string, days: number) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("users")
      .update({ pro_days_left: days })
      .eq("id", userId);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating user pro days:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string) {
  try {
    const supabase = await createClient();
    
    // Delete related data first
    await supabase.from("member_activity").delete().eq("user_id", userId);
    await supabase.from("communities").delete().eq("user_id", userId);
    await supabase.from("referrals").delete().eq("referrer_id", userId);
    
    // Delete user
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleUserAdmin(userId: string) {
  try {
    const supabase = await createClient();
    
    // Get current admin status
    const { data: user } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .single();

    // Toggle admin status
    const { error } = await supabase
      .from("users")
      .update({ is_admin: !user?.is_admin })
      .eq("id", userId);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling user admin:", error);
    return { success: false, error: error.message };
  }
}

export async function exportUsers() {
  try {
    const supabase = await createClient();
    
    const { data: users, error } = await supabase
      .from("users")
      .select("email, pro_days_left, is_admin, created_at, discord_username")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    return { users: users || [] };
  } catch (error: any) {
    console.error("Error exporting users:", error);
    return { users: [], error: error.message };
  }
}

export async function getSystemLogs() {
  try {
    const supabase = await createClient();
    
    // This would typically come from a logs table
    // For now, return mock data
    const logs = [
      { timestamp: new Date().toISOString(), level: 'info', message: 'System health check completed' },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), level: 'warning', message: 'High memory usage detected' },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), level: 'info', message: 'Database backup completed' },
    ];
    
    return { logs };
  } catch (error: any) {
    console.error("Error fetching system logs:", error);
    return { logs: [], error: error.message };
  }
}

// Get all users with subscription details
export async function getAllUsers(): Promise<{ users: UserSubscription[]; error: any }> {
  try {
    const supabase = await createClient();
    
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, pro_days_left, is_admin, discord_id, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { users: users || [], error: null };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { users: [], error };
  }
}

// Update user subscription
export async function updateUserSubscription(
  userId: string, 
  updates: { pro_days_left?: number; is_admin?: boolean }
): Promise<{ success: boolean; error: any }> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating user subscription:", error);
    return { success: false, error };
  }
}

// Get subscription usage limits
export async function getSubscriptionLimits(): Promise<{ 
  free: SubscriptionLimits; 
  pro: SubscriptionLimits;
  error: any 
}> {
  try {
    const supabase = await createClient();
    
    const { data: settings, error } = await supabase
      .from("admin_settings")
      .select("free_limits, pro_limits")
      .maybeSingle();

    if (error) throw error;

    const defaultFree: SubscriptionLimits = {
      max_servers: 1,
      max_emails_per_day: 10,
      max_members_tracked: 100
    };

    const defaultPro: SubscriptionLimits = {
      max_servers: 10,
      max_emails_per_day: 100,
      max_members_tracked: 10000
    };

    return {
      free: settings?.free_limits || defaultFree,
      pro: settings?.pro_limits || defaultPro,
      error: null
    };
  } catch (error) {
    console.error("Error fetching subscription limits:", error);
    return {
      free: { max_servers: 1, max_emails_per_day: 10, max_members_tracked: 100 },
      pro: { max_servers: 10, max_emails_per_day: 100, max_members_tracked: 10000 },
      error
    };
  }
}

// Update subscription limits
export async function updateSubscriptionLimits(
  plan: 'free' | 'pro',
  limits: SubscriptionLimits
): Promise<{ success: boolean; error: any }> {
  try {
    const supabase = await createClient();
    
    const updateField = plan === 'free' ? 'free_limits' : 'pro_limits';
    
    const { error } = await supabase
      .from("admin_settings")
      .update({ [updateField]: limits })
      .eq("id", 1);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating subscription limits:", error);
    return { success: false, error };
  }
}

export async function getAdminSettings() {
  const supabase = await createClient();
  
  // Try to get existing settings
  const { data, error } = await supabase
    .from("admin_settings")
    .select("*")
    .maybeSingle();
  
  // If no settings exist, return defaults
  if (!data && !error) {
    return { 
      data: {
        referral_active: true,
        maintenance_mode: false,
        pro_price: 3500
      }, 
      error: null 
    };
  }

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
