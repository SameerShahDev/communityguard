"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getAdminStats, 
  getAdminSettings, 
  updateAdminSettings, 
  generateGiftCode, 
  addManualCredits 
} from './actions';

export default function AdminPanel() {
  const [stats, setStats] = useState({ mrr: 0, proUsers: 0, trialUsers: 0 });
  const [settings, setSettings] = useState({ referral_active: true, maintenance_mode: false, pro_price: 3500 });
  const [isLoading, setIsLoading] = useState(true);
  const [manualInput, setManualInput] = useState({ id: '', days: 30, reason: 'GPay payment' });
  const [giftInput, setGiftInput] = useState({ code: '', uses: 50 });

  useEffect(() => {
    async function loadData() {
      const [statsRes, settingsRes] = await Promise.all([
        getAdminStats(),
        getAdminSettings()
      ]);
      
      if (statsRes) setStats({ mrr: statsRes.mrr, proUsers: statsRes.proUsers, trialUsers: statsRes.trialUsers });
      if (settingsRes.data) setSettings(settingsRes.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleToggleReferral = async () => {
    const newVal = !settings.referral_active;
    setSettings(s => ({ ...s, referral_active: newVal }));
    await updateAdminSettings({ referral_active: newVal });
  };

  const handleToggleMaintenance = async () => {
    const newVal = !settings.maintenance_mode;
    setSettings(s => ({ ...s, maintenance_mode: newVal }));
    await updateAdminSettings({ maintenance_mode: newVal });
  };

  const handleUpdatePrice = async (price: number) => {
    setSettings(s => ({ ...s, pro_price: price }));
    await updateAdminSettings({ pro_price: price });
  };

  const handleAddCredits = async () => {
    const res = await addManualCredits(manualInput.id, manualInput.days, manualInput.reason);
    if (res.success) alert("Credits added successfully!");
    else alert(res.error || "Failed to add credits");
  };

  const handleGiftCode = async () => {
    const res = await generateGiftCode(giftInput.code, giftInput.uses);
    if (res.data) alert("Code generated!");
    else alert("Error generating code");
  };
  
  if (isLoading) return <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center text-white">Loading Admin...</div>;

  return (
    <div className="min-h-screen bg-[#0c0e12] text-[#f6f6fc] font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#111318] border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-col z-20 sticky top-0 md:h-screen">
        <div className="flex items-center justify-between md:justify-start gap-3 mb-8">
          <Link href="/" className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center shadow-[0_0_15px_rgba(88,101,242,0.4)]">
            <span className="text-white font-bold">C</span>
          </Link>
          <span className="font-bold tracking-tight hidden md:block">CommunityGuard</span>
        </div>

        <nav className="hidden md:flex flex-col gap-2 flex-1">
          <Link href="/dashboard" className="px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium transition-colors">
            📊 Overview
          </Link>
          <Link href="/admin" className="px-4 py-2.5 rounded-lg bg-[#5865F2]/10 text-[#a2a9fa] font-medium border border-[#5865F2]/20">
            ⚙️ Admin Panel
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">Super Admin Control</h1>
          <p className="text-slate-400">Manage platform revenue, limits, and user configurations.</p>
        </div>

        {/* 📊 REVENUE METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111318] border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full group-hover:bg-emerald-500/10 transition-colors" />
             <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total MRR</p>
             <h2 className="text-3xl md:text-4xl font-extrabold text-white">₹{(stats.mrr / 1000).toFixed(1)}k</h2>
          </div>
          <div className="bg-[#111318] border border-[#5865F2]/20 rounded-2xl p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#5865F2]/5 blur-[40px] rounded-full group-hover:bg-[#5865F2]/10 transition-colors" />
             <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Pro Users</p>
             <h2 className="text-3xl md:text-4xl font-extrabold text-white">{stats.proUsers}</h2>
          </div>
          <div className="bg-[#111318] border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] rounded-full group-hover:bg-amber-500/10 transition-colors" />
             <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Trial Users</p>
             <h2 className="text-3xl md:text-4xl font-extrabold text-white">{stats.trialUsers}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* ⚙️ SYSTEM TOGGLES & PRICING */}
          <div className="bg-[#111318] border border-white/5 rounded-3xl p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">⚙️ System Controls</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <h3 className="font-semibold text-white">Referral Program Active</h3>
                  <p className="text-xs text-slate-400 mt-1">Users can invite others for free trials.</p>
                </div>
                <button 
                  onClick={handleToggleReferral}
                  className={`w-12 h-6 rounded-full relative transition-colors ${settings.referral_active ? 'bg-[#5865F2]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.referral_active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <h3 className="font-semibold text-white">Maintenance Mode</h3>
                  <p className="text-xs text-slate-400 mt-1">Blocks all non-admin logins.</p>
                </div>
                <button 
                  onClick={handleToggleMaintenance}
                  className={`w-12 h-6 rounded-full relative transition-colors ${settings.maintenance_mode ? 'bg-red-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.maintenance_mode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <label className="block font-semibold text-white mb-1">Pricing Configuration</label>
                <div className="flex gap-2 items-center mt-3">
                  <span className="text-slate-400">Pro Price: ₹</span>
                  <input 
                    type="number" 
                    value={settings.pro_price} 
                    onChange={(e) => handleUpdatePrice(Number(e.target.value))}
                    className="bg-[#0c0e12] border border-white/10 rounded-lg px-3 py-1.5 w-24 text-white focus:outline-none focus:border-[#5865F2]" 
                  />
                  <button className="px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-sm font-semibold rounded-lg ml-auto transition-colors">Save</button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8">
            {/* 🎁 GIFT CODES */}
            <div className="bg-[#111318] border border-white/5 rounded-3xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">🎁 Gift Codes</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. JEE100" 
                  value={giftInput.code}
                  onChange={(e) => setGiftInput(prev => ({ ...prev, code: e.target.value }))}
                  className="flex-1 bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#5865F2]" 
                />
                <input 
                  type="number" 
                  placeholder="50" 
                  value={giftInput.uses}
                  onChange={(e) => setGiftInput(prev => ({ ...prev, uses: Number(e.target.value) }))}
                  className="w-24 bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#5865F2]" 
                />
                <button onClick={handleGiftCode} className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 font-semibold rounded-xl transition-colors">Generate</button>
              </div>
            </div>

            {/* 👤 MANUAL ACTION */}
            <div className="bg-[#111318] border border-white/5 rounded-3xl p-6 md:p-8">
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2">👤 Manual Credits</h2>
               <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="User Email or ID" 
                    value={manualInput.id}
                    onChange={(e) => setManualInput(prev => ({ ...prev, id: e.target.value }))}
                    className="col-span-2 bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#5865F2]" 
                  />
                  <input 
                    type="text" 
                    placeholder="Reason (payment etc)" 
                    value={manualInput.reason}
                    onChange={(e) => setManualInput(prev => ({ ...prev, reason: e.target.value }))}
                    className="col-span-2 bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#5865F2]" 
                  />
                  <div className="col-span-2 flex gap-2">
                    <button 
                      onClick={() => handleAddCredits()} 
                      className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-semibold rounded-xl text-sm transition-colors text-white"
                    >
                      +30 Days Pro
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
