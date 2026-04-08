"use client";

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PaymentButton } from '@/app/components/PaymentButton';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setUser(data);
    }
    setIsLoading(false);
  };

  const copyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-slate-400">Manage your account settings and subscription</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
                {user?.discord_username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white font-semibold text-lg">
                  {user?.discord_username || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-slate-400">{user?.email}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Discord Username</label>
                <p className="text-white font-medium">{user?.discord_username || 'Not connected'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Member Since</label>
                <p className="text-white font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Subscription</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${user?.pro_days_left > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                <div>
                  <p className="text-white font-semibold">
                    {user?.pro_days_left > 0 ? 'CommunityGuard Pro' : 'Free Plan'}
                  </p>
                  <p className="text-sm text-slate-400">
                    {user?.pro_days_left > 0 ? `${user.pro_days_left} days remaining` : 'Basic features only'}
                  </p>
                </div>
              </div>
              {user?.pro_days_left > 0 ? (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-full">
                  Active
                </span>
              ) : (
                <PaymentButton 
                  userId={user?.id} 
                  isPro={false}
                  variant="primary"
                  size="sm"
                />
              )}
            </div>

            {user?.pro_days_left > 0 && (
              <PaymentButton 
                userId={user?.id} 
                isPro={true}
                variant="secondary"
                size="sm"
                className="w-full"
              />
            )}
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Your Referral Code</h2>
          <p className="text-sm text-slate-400 mb-4">Share with friends and earn 3 Pro days for each signup!</p>
          
          {user?.referral_code ? (
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-slate-950/50 px-4 py-3 rounded-xl text-blue-400 font-mono text-lg">
                {user.referral_code}
              </code>
              <button
                onClick={copyReferralCode}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm">Referral code not generated yet. Visit the referrals page.</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{user?.pro_days_left || 0}</p>
            <p className="text-sm text-slate-400">Pro Days</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{user?.referral_count || 0}</p>
            <p className="text-sm text-slate-400">Referrals</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{(user?.referral_count || 0) * 3}</p>
            <p className="text-sm text-slate-400">Days Earned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
