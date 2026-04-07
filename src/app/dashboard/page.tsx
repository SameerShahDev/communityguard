"use client";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getDashboardStats, getAtRiskMembers, connectDiscord, sendRecoveryEmails, createStripeCheckout } from './actions';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [serverSelected, setServerSelected] = useState(false);
  const [stats, setStats] = useState<{
    highRisk: number;
    silent: number;
    active: number;
    proDays: number;
    isPro: boolean;
    hasServer: boolean;
    userEmail: string | undefined;
    totalMembers: number;
    serverName: string | null;
  }>({
    highRisk: 0,
    silent: 0,
    active: 0,
    proDays: 0,
    isPro: false,
    hasServer: false,
    userEmail: undefined,
    totalMembers: 0,
    serverName: null
  });
  const [members, setMembers] = useState<{member_id: string; risk_level: string; score: number}[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{sent: number, recovered: number} | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for URL params from Discord callback and payment
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const payment = searchParams.get('payment');
    
    if (success === 'server_connected') {
      setConnectSuccess('Discord server connected successfully!');
      window.history.replaceState({}, '', '/dashboard');
    } else if (error) {
      setConnectError(`Connection failed: ${error}`);
      window.history.replaceState({}, '', '/dashboard');
    }
    
    // Handle payment status
    if (payment === 'success') {
      setPaymentStatus('success');
      setConnectSuccess('🎉 Payment successful! You are now Pro!');
      window.history.replaceState({}, '', '/dashboard');
      // Refresh data to get updated pro status
      setTimeout(() => window.location.reload(), 2000);
    } else if (payment === 'cancelled') {
      setPaymentStatus('cancelled');
      setConnectError('Payment was cancelled. You can try again anytime.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/login';
        return;
      }
      
      // Store user ID for Discord OAuth
      setUserId(session.user.id);

      const [statsRes, membersRes] = await Promise.all([
        getDashboardStats(),
        getAtRiskMembers()
      ]);
      setStats(statsRes);
      setMembers(membersRes.data);
      if (statsRes.hasServer) setServerSelected(true);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleConnectDiscord = async () => {
    setConnectError(null);
    try {
      if (!userId) {
        setConnectError("User not authenticated. Please login again.");
        return;
      }
      const url = await connectDiscord(userId);
      if (url) {
        window.location.href = url;
      } else {
        setConnectError("Failed to generate Discord connection URL");
      }
    } catch (error) {
      console.error("Discord connect error:", error);
      setConnectError("Failed to connect to Discord. Please try again.");
    }
  };

  const handleUpgradeToPro = async () => {
    setIsUpgrading(true);
    setConnectError(null);
    try {
      const result = await createStripeCheckout();
      if (result.url) {
        window.location.href = result.url;
      } else {
        setConnectError(result.error || "Failed to start checkout");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setConnectError("Failed to start payment. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSendEmails = async () => {
    setIsSending(true);
    setSendResult(null);
    const res = await sendRecoveryEmails();
    if (res.sent !== undefined) {
      setSendResult({ sent: res.sent, recovered: res.recovered });
    } else {
      alert(res.error || "Failed to send emails");
    }
    setIsSending(false);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-slate-400">
            Welcome back, <span className="text-[#5865F2] font-semibold">{stats.userEmail?.split('@')[0] || 'User'}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {!serverSelected ? (
            <button 
              onClick={handleConnectDiscord}
              className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(88,101,242,0.4)] hover:shadow-[0_4px_30px_rgba(88,101,242,0.6)] flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Connect Discord Server
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold text-sm">Discord Connected</span>
            </div>
          )}
        </div>
      </div>

      {connectError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {connectError}
        </div>
      )}

      {connectSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
          <span className="text-xl">✅</span>
          {connectSuccess}
        </div>
      )}

      {!serverSelected ? (
        /* No Server Connected State */
        <div className="grid gap-6">
          <div className="border border-dashed border-white/20 bg-[#111318]/50 rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-[#5865F2]/20 rounded-2xl flex items-center justify-center text-4xl mb-6 mx-auto">
              🔌
            </div>
            <h2 className="text-2xl font-bold mb-3">Connect Your Discord Server</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Link your Discord server to start tracking member activity, prevent churn, and send recovery emails automatically.
            </p>
            <button 
              onClick={handleConnectDiscord}
              className="px-8 py-4 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-xl transition-all flex items-center gap-3 mx-auto hover:-translate-y-1 shadow-[0_4px_20px_rgba(88,101,242,0.4)]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Connect Discord Server
            </button>
          </div>

          {/* Subscription Status Card */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#111318] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Subscription Status</h3>
                {stats.isPro ? (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-full">
                    PRO Active
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-semibold rounded-full">
                    Free Plan
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Plan</span>
                  <span className="font-semibold">{stats.isPro ? 'CommunityGuard Pro' : 'Free Tier'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Days Remaining</span>
                  <span className="font-semibold text-[#5865F2]">{stats.proDays} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email</span>
                  <span className="font-medium text-sm text-slate-300">{stats.userEmail}</span>
                </div>
              </div>
              {!stats.isPro && (
                <Link href="/pricing" className="mt-4 block w-full py-3 bg-gradient-to-r from-[#5865F2] to-[#4752c4] text-white text-center font-semibold rounded-xl hover:shadow-[0_4px_20px_rgba(88,101,242,0.4)] transition-all">
                  Upgrade to Pro
                </Link>
              )}
            </div>

            <div className="bg-[#111318] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/dashboard/referrals" className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-lg">🎁</span>
                  <div>
                    <p className="font-semibold">Referrals</p>
                    <p className="text-sm text-slate-400">Invite friends, earn credits</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Server Connected - Full Dashboard */
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-blue-400 text-sm font-semibold">Total Members</span>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{stats.totalMembers}</p>
              <p className="text-xs text-slate-400 mt-1">{stats.serverName || 'Server'}</p>
            </div>

            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-red-400 text-sm font-semibold">High Risk</span>
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{stats.highRisk}</p>
              <p className="text-xs text-slate-400 mt-1">Members need attention</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-amber-400 text-sm font-semibold">Silent</span>
                <span className="text-2xl">😴</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{stats.silent}</p>
              <p className="text-xs text-slate-400 mt-1">Becoming inactive</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-emerald-400 text-sm font-semibold">Active</span>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{stats.active}</p>
              <p className="text-xs text-slate-400 mt-1">Engaged members</p>
            </div>

            <div className="bg-gradient-to-br from-[#5865F2]/10 to-[#4752c4]/5 border border-[#5865F2]/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#5865F2] text-sm font-semibold">Pro Days</span>
                <span className="text-2xl">📅</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{stats.proDays}</p>
              <p className="text-xs text-slate-400 mt-1">Remaining</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleSendEmails}
              disabled={isSending}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-[#5865F2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#5865F2] text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_4px_20px_rgba(88,101,242,0.4)] hover:shadow-[0_4px_30px_rgba(88,101,242,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending Recovery Emails...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Recovery Emails
                </>
              )}
            </button>

            <Link 
              href="/admin"
              className="flex-1 py-4 px-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Settings
            </Link>
          </div>

          {sendResult && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚀</span>
                <p className="font-semibold">
                  Sent <span className="text-white">{sendResult.sent}</span> recovery emails. 
                  Estimated recovered: <span className="text-white">{sendResult.recovered}</span> members!
                </p>
              </div>
              <button 
                onClick={() => setSendResult(null)} 
                className="p-1 hover:bg-emerald-500/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* At-Risk Members Table */}
          <div className="bg-[#111318] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">At-Risk Member Profiles</h2>
                <p className="text-sm text-slate-400">Members showing signs of churn</p>
              </div>
              {members.length > 0 && (
                <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-semibold rounded-full">
                  {members.length} at risk
                </span>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0c0e12]/50 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Discord ID</th>
                    <th className="px-6 py-4 font-semibold">Risk Level</th>
                    <th className="px-6 py-4 font-semibold">Score</th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {members.length > 0 ? members.map((member, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">
                            👤
                          </div>
                          <span className="font-medium">{member.member_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          member.risk_level === 'HIGH_RISK' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            member.risk_level === 'HIGH_RISK' ? 'bg-red-400' : 'bg-amber-400'
                          }`} />
                          {member.risk_level === 'HIGH_RISK' ? 'Critical' : 'Silent'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                member.risk_level === 'HIGH_RISK' ? 'bg-red-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${Math.min(member.score, 100)}%` }}
                            />
                          </div>
                          <span className="text-slate-400 text-sm">{member.score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-4 py-2 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] text-sm font-semibold rounded-lg transition-colors">
                          Message
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-4xl">🎉</span>
                          <p className="text-slate-400">No members at risk detected!</p>
                          <p className="text-sm text-slate-500">Your community is healthy and engaged.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
