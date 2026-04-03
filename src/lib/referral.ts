import { createClient } from './supabase/server';

// PHASE 1: The Viral Hook (0-5 Referrals)
// Condition: 5 free organic community installs -> 1 month Pro Free
export async function handleNewInstallReferral(referrerId: string, newUserId: string) {
  const supabase = await createClient();

  // 1. Fetch referrer
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', referrerId)
    .single();

  if (!user) return;

  // Insert the referral record
  await supabase.from('referrals').insert({
    referrer_id: referrerId,
    referred_user_id: newUserId,
    is_paid: false,
    reward_given: false
  });

  // Phase 1 Check
  if (user.referral_count < 5) {
    const newCount = user.referral_count + 1;
    
    let rewardTriggered = false;
    let daysToAdd = 0;
    
    if (newCount === 5) {
      daysToAdd = 30; // Grant 30 days Pro
      rewardTriggered = true;
    }

    await supabase
      .from('users')
      .update({
        referral_count: newCount,
        pro_days_left: user.pro_days_left + daysToAdd
      })
      .eq('id', referrerId);

    // If you want, you could trigger sending the "🎉 1 Month Pro FREE unlocked!" email here via Resend.
  }
}

// PHASE 2: The Revenue Hook (After 5 Referrals)
// Condition: User gets 15 Days Pro per paid referral
export async function handlePaidReferral(referredUserId: string) {
  const supabase = await createClient();

  // Find the referral record where this user was referred to the system
  const { data: referral } = await supabase
    .from('referrals')
    .select('id, referrer_id')
    .eq('referred_user_id', referredUserId)
    .single();

  if (!referral) return;

  const { data: referrerUser } = await supabase
    .from('users')
    .select('referral_count, pro_days_left')
    .eq('id', referral.referrer_id)
    .single();

  if (!referrerUser) return;

  // Verify Phase 2 criteria
  if (referrerUser.referral_count >= 5) {
    // Reward 15 days of Pro for a paid referral
    await supabase
      .from('users')
      .update({
        pro_days_left: referrerUser.pro_days_left + 15
      })
      .eq('id', referral.referrer_id);

    // Mark referral as paid
    await supabase
      .from('referrals')
      .update({
        is_paid: true,
        reward_given: true
      })
      .eq('id', referral.id);
  }
}
