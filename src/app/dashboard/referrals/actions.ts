"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/edge";

// Generate unique referral code for user
export async function getOrCreateReferralCode(): Promise<{ code: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { code: null, error: "Not authenticated" };
    }

    // Check if user already has a referral code stored
    const { data: userData } = await supabase
      .from("users")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    if (userData?.referral_code) {
      return { code: userData.referral_code, error: null };
    }

    // Generate new code based on user's email or random
    const baseCode = user.email?.split('@')[0]?.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'USER';
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referralCode = `${baseCode}_${randomSuffix}`;

    // Save to user record
    const { error } = await supabase
      .from("users")
      .update({ referral_code: referralCode })
      .eq("id", user.id);

    if (error) {
      console.error("Error saving referral code:", error);
      return { code: null, error: error.message };
    }

    return { code: referralCode, error: null };
  } catch (error: any) {
    console.error("Error in getOrCreateReferralCode:", error);
    return { code: null, error: error.message || "Failed to generate referral code" };
  }
}

// Get user's referral stats
export async function getReferralStats(): Promise<{
  totalReferrals: number;
  paidReferrals: number;
  earnedDays: number;
  pendingInstalls: number;
  referralCode: string | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { 
        totalReferrals: 0, 
        paidReferrals: 0, 
        earnedDays: 0, 
        pendingInstalls: 0,
        referralCode: null,
        error: "Not authenticated" 
      };
    }

    // Get user's referral code
    const { data: userData } = await supabase
      .from("users")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    const referralCode = userData?.referral_code || null;

    // Count total referrals (where this user is the referrer)
    const { count: totalReferrals } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    // Count paid referrals
    const { count: paidReferrals } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .eq("is_paid", true);

    // Calculate earned days (15 days per paid referral)
    const earnedDays = (paidReferrals || 0) * 15;

    // Count pending installs (not paid yet)
    const pendingInstalls = (totalReferrals || 0) - (paidReferrals || 0);

    return {
      totalReferrals: totalReferrals || 0,
      paidReferrals: paidReferrals || 0,
      earnedDays,
      pendingInstalls,
      referralCode,
      error: null
    };
  } catch (error: any) {
    console.error("Error in getReferralStats:", error);
    return { 
      totalReferrals: 0, 
      paidReferrals: 0, 
      earnedDays: 0, 
      pendingInstalls: 0,
      referralCode: null,
      error: error.message || "Failed to get referral stats" 
    };
  }
}

// Apply referral code during signup/onboarding
export async function applyReferralCode(code: string): Promise<{ success: boolean; message: string; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, message: "", error: "Not authenticated" };
    }

    // Don't allow self-referral
    const { data: referrer } = await supabase
      .from("users")
      .select("id, referral_code")
      .eq("referral_code", code)
      .single();

    if (!referrer) {
      return { success: false, message: "", error: "Invalid referral code" };
    }

    if (referrer.id === user.id) {
      return { success: false, message: "", error: "You cannot use your own referral code" };
    }

    // Check if this referral already exists
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", referrer.id)
      .eq("referred_user_id", user.id)
      .single();

    if (existingReferral) {
      return { success: false, message: "", error: "Referral already applied" };
    }

    // Create referral record
    const { error } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrer.id,
        referred_user_id: user.id,
        is_paid: false,
        reward_given: false
      });

    if (error) {
      console.error("Error creating referral:", error);
      return { success: false, message: "", error: error.message };
    }

    // Give both users 3 days free pro
    await addProDays(user.id, 3, "Referral bonus - new user");
    await addProDays(referrer.id, 3, "Referral bonus - referred friend");

    return { 
      success: true, 
      message: "🎉 Referral applied! You and your friend got 3 days of Pro FREE!",
      error: null 
    };
  } catch (error: any) {
    console.error("Error in applyReferralCode:", error);
    return { success: false, message: "", error: error.message || "Failed to apply referral code" };
  }
}

// Skip referral (mark as seen)
export async function skipReferral(): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Mark user as having seen referral prompt
    const { error } = await supabase
      .from("users")
      .update({ referral_prompt_shown: true })
      .eq("id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Check if user has seen referral prompt
export async function hasSeenReferralPrompt(): Promise<{ shown: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { shown: true, error: "Not authenticated" };
    }

    const { data } = await supabase
      .from("users")
      .select("referral_prompt_shown")
      .eq("id", user.id)
      .single();

    return { shown: data?.referral_prompt_shown || false, error: null };
  } catch (error: any) {
    return { shown: true, error: error.message };
  }
}

// Helper: Add pro days to user
async function addProDays(userId: string, days: number, reason: string) {
  try {
    const supabase = createServiceClient();
    
    // Get current pro days
    const { data: user } = await supabase
      .from("users")
      .select("pro_days_left")
      .eq("id", userId)
      .single();

    const currentDays = user?.pro_days_left || 0;
    const newDays = currentDays + days;

    // Update user
    await supabase
      .from("users")
      .update({ pro_days_left: newDays })
      .eq("id", userId);

    // Log to manual_credits for tracking
    await supabase
      .from("manual_credits")
      .insert({
        user_id: userId,
        days_added: days,
        reason: reason,
        added_by_admin: false
      });

  } catch (error) {
    console.error("Error adding pro days:", error);
  }
}

// Get referral link
export async function getReferralLink(): Promise<{ link: string | null; error: string | null }> {
  try {
    const { code, error } = await getOrCreateReferralCode();
    
    if (error || !code) {
      return { link: null, error: error || "No referral code" };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://igone.pages.dev';
    const link = `${siteUrl}/?ref=${code}`;

    return { link, error: null };
  } catch (error: any) {
    return { link: null, error: error.message };
  }
}
