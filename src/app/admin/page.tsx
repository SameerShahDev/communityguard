"use client";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  getAdminStats, 
  getAdminSettings, 
  updateAdminSettings, 
  generateGiftCode, 
  addManualCredits,
  getAllUsers,
  getSubscriptionLimits
} from './actions';
import { UserManagement, SubscriptionConfig } from './components';

export default function AdminPanel() {
  const [stats, setStats] = useState({ 
    mrr: 0, 
    proUsers: 0, 
    trialUsers: 0, 
    totalUsers: 0,
    settings: null 
  });
  const [settings, setSettings] = useState({ referral_active: true, maintenance_mode: false, pro_price: 3500 });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [manualInput, setManualInput] = useState({ id: '', days: 30, reason: 'GPay payment' });
  const [giftInput, setGiftInput] = useState({ code: '', uses: 50 });
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscriptions'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptionLimits, setSubscriptionLimits] = useState({
    free: { max_servers: 1, max_emails_per_day: 10, max_members_tracked: 100 },
    pro: { max_servers: 10, max_emails_per_day: 100, max_members_tracked: 10000 }
  });

  useEffect(() => {
    async function checkAdminAndLoad() {
      try {
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/login';
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.is_admin) {
          console.log('User is not admin, redirecting...');
          window.location.href = '/dashboard';
          return;
        }

        setIsAdmin(true);

        const [statsRes, settingsRes, usersRes, limitsRes] = await Promise.all([
          getAdminStats(),
          getAdminSettings(),
          getAllUsers(),
          getSubscriptionLimits()
        ]);
        
        if (statsRes) setStats({ 
          mrr: statsRes.mrr, 
          proUsers: statsRes.proUsers, 
          trialUsers: statsRes.trialUsers,
          totalUsers: statsRes.totalUsers || 0,
          settings: statsRes.settings
        });
        if (settingsRes.data) setSettings(settingsRes.data);
        if (usersRes.users) setUsers(usersRes.users);
        if (limitsRes) setSubscriptionLimits(limitsRes);
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkAdminAndLoad();
  }, []);

  const handleToggleReferral = async () => {
    try {
      const newVal = !settings.referral_active;
      setSettings(s => ({ ...s, referral_active: newVal }));
      await updateAdminSettings({ referral_active: newVal });
    } catch (error) {
      console.error("Failed to update referral setting:", error);
      alert("Failed to update setting");
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      const newVal = !settings.maintenance_mode;
      setSettings(s => ({ ...s, maintenance_mode: newVal }));
      await updateAdminSettings({ maintenance_mode: newVal });
    } catch (error) {
      console.error("Failed to update maintenance setting:", error);
      alert("Failed to update setting");
    }
  };

  const handleUpdatePrice = async (price: number) => {
    try {
      setSettings(s => ({ ...s, pro_price: price }));
      await updateAdminSettings({ pro_price: price });
    } catch (error) {
      console.error("Failed to update price:", error);
      alert("Failed to update price");
    }
  };

  const handleAddCredits = async () => {
    try {
      const res = await addManualCredits(manualInput.id, manualInput.days, manualInput.reason);
      if (res.success) alert("Credits added successfully!");
      else alert(res.error || "Failed to add credits");
    } catch (error) {
      console.error("Failed to add credits:", error);
      alert("Failed to add credits");
    }
  };

  const handleGiftCode = async () => {
    try {
      const res = await generateGiftCode(giftInput.code, giftInput.uses);
      if (res.data) alert("Code generated!");
      else alert("Error generating code");
    } catch (error) {
      console.error("Failed to generate gift code:", error);
      alert("Failed to generate code");
    }
  };
  
  if (isLoading) return <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center text-white">Loading Admin...</div>;

  if (!isAdmin) return (
    <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-slate-400 mb-6">You do not have permission to access this page.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-xl">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#0c0e12] text-[#f6f6fc] font-sans flex flex-col md:flex-row overflow-hidden">
      <aside className="w-full md:w-64 bg-[#111318] border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-col shrink-0">
        <div className="flex items-center justify-between md:justify-start gap-3 mb-6">
          <Link href="/" className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center shadow-[0_0_15px_rgba(88,101,242,0.4)]">
            <span className="text-white font-bold">C</span>
          </Link>
          <span className="font-bold tracking-tight hidden md:block">CommunityGuard</span>
        </div>

        <nav className="hidden md:flex flex-col gap-2 flex-1">
          <Link href="/dashboard" className="px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium transition-colors">
            Overview
          </Link>
          <Link href="/dashboard/referrals" className="px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium transition-colors">
            Referrals
          </Link>
          <div className="mt-4 pt-4 border-t border-white/10">
            <Link href="/admin" className="px-4 py-2.5 rounded-lg bg-[#5865F2]/10 text-[#a2a9fa] font-medium border border-[#5865F2]/20">
              Admin Panel
            </Link>
          </div>
        </nav>

        <div className="mt-auto pt-4">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        <div className="h-full w-full overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">Super Admin Control</h1>
            <p className="text-slate-400">Manage platform revenue, limits, and user configurations.</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'overview' ? 'bg-[#5865F2] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>Overview</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'users' ? 'bg-[#5865F2] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>Users ({stats.totalUsers})</button>
            <button onClick={() => setActiveTab('subscriptions')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'subscriptions' ? 'bg-[#5865F2] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>Subscriptions</button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111318] border border-emerald-500/20 rounded-2xl p-6"><p className="text-slate-400 text-sm font-semibold uppercase mb-2">Total MRR</p><h2 className="text-3xl font-extrabold text-white">₹{(stats.mrr / 1000).toFixed(1)}k</h2></div>
                <div className="bg-[#111318] border border-[#5865F2]/20 rounded-2xl p-6"><p className="text-slate-400 text-sm font-semibold uppercase mb-2">Pro Users</p><h2 className="text-3xl font-extrabold text-white">{stats.proUsers}</h2></div>
                <div className="bg-[#111318] border border-amber-500/20 rounded-2xl p-6"><p className="text-slate-400 text-sm font-semibold uppercase mb-2">Trial Users</p><h2 className="text-3xl font-extrabold text-white">{stats.trialUsers}</h2></div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-[#111318] border border-white/5 rounded-3xl p-6">
                  <h2 className="text-xl font-bold mb-6">System Controls</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div><h3 className="font-semibold text-white">Referral Program</h3><p className="text-xs text-slate-400">Users can invite others</p></div>
                      <button onClick={handleToggleReferral} className={`w-12 h-6 rounded-full relative ${settings.referral_active ? 'bg-[#5865F2]' : 'bg-slate-700'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.referral_active ? 'left-7' : 'left-1'}`} /></button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div><h3 className="font-semibold text-white">Maintenance Mode</h3><p className="text-xs text-slate-400">Blocks non-admin logins</p></div>
                      <button onClick={handleToggleMaintenance} className={`w-12 h-6 rounded-full relative ${settings.maintenance_mode ? 'bg-red-500' : 'bg-slate-700'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.maintenance_mode ? 'left-7' : 'left-1'}`} /></button>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <label className="block font-semibold text-white mb-2">Pro Price (₹)</label>
                      <div className="flex gap-2">
                        <input type="number" value={settings.pro_price} onChange={(e) => handleUpdatePrice(Number(e.target.value))} className="bg-[#0c0e12] border border-white/10 rounded-lg px-3 py-2 w-32 text-white" />
                        <button className="px-4 py-2 bg-[#5865F2] rounded-lg text-sm font-semibold">Save</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#111318] border border-white/5 rounded-3xl p-6">
                    <h2 className="text-xl font-bold mb-4">Gift Codes</h2>
                    <div className="flex gap-2">
                      <input type="text" placeholder="e.g. JEE100" value={giftInput.code} onChange={(e) => setGiftInput(prev => ({ ...prev, code: e.target.value }))} className="flex-1 bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-2 text-white" />
                      <input type="number" placeholder="Uses" value={giftInput.uses} onChange={(e) => setGiftInput(prev => ({ ...prev, uses: Number(e.target.value) }))} className="w-20 bg-[#0c0e12] border border-white/10 rounded-xl px-3 py-2 text-white" />
                      <button onClick={handleGiftCode} className="px-4 py-2 bg-indigo-500 rounded-xl font-semibold">Generate</button>
                    </div>
                  </div>

                  <div className="bg-[#111318] border border-white/5 rounded-3xl p-6">
                    <h2 className="text-xl font-bold mb-4">Manual Credits</h2>
                    <div className="space-y-3">
                      <input type="text" placeholder="User Email or ID" value={manualInput.id} onChange={(e) => setManualInput(prev => ({ ...prev, id: e.target.value }))} className="w-full bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-2 text-white" />
                      <input type="text" placeholder="Reason" value={manualInput.reason} onChange={(e) => setManualInput(prev => ({ ...prev, reason: e.target.value }))} className="w-full bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-2 text-white" />
                      <button onClick={handleAddCredits} className="w-full px-4 py-2 bg-emerald-500 rounded-xl font-semibold">+30 Days Pro</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-[#0c0e12] rounded-2xl p-4">
              <UserManagement users={users} onRefresh={async () => { const res = await getAllUsers(); if (res.users) setUsers(res.users); }} />
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="bg-[#0c0e12] rounded-2xl p-4">
              <SubscriptionConfig limits={subscriptionLimits} onRefresh={async () => { const res = await getSubscriptionLimits(); if (res) setSubscriptionLimits(res); }} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
