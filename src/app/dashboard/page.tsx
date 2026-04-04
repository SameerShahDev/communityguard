"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDashboardStats, getAtRiskMembers, connectDiscord, sendRecoveryEmails } from './actions';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [serverSelected, setServerSelected] = useState(false);
  const [stats, setStats] = useState({ highRisk: 0, silent: 0, active: 0 });
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{sent: number, recovered: number} | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/login';
        return;
      }

      const [statsRes, membersRes] = await Promise.all([
        getDashboardStats(),
        getAtRiskMembers()
      ]);
      setStats(statsRes);
      setMembers(membersRes.data);
      if (statsRes.active > 0) setServerSelected(true);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleConnectDiscord = async () => {
    const url = await connectDiscord();
    window.location.href = url;
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

  if (isLoading) return <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center text-white font-sans text-xl">Syncing with Discord...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">Server Health</h1>
          <p className="text-slate-400 text-sm">Monitor activity and prevent silent discord churn.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {!serverSelected ? (
            <button 
              onClick={handleConnectDiscord}
              className="w-full md:w-auto px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(88,101,242,0.3)] hover:shadow-[0_4px_20px_rgba(88,101,242,0.5)]"
            >
              + Connect Discord Server
            </button>
          ) : (
            <button 
              className="w-full md:w-auto px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Discord Integrated
            </button>
          )}
        </div>
      </div>

      {!serverSelected ? (
        <div className="border border-white/10 bg-[#111318] rounded-3xl p-8 md:p-16 text-center max-w-2xl mx-auto mt-12 flex flex-col items-center">
          <div className="w-20 h-20 bg-[#5865F2]/20 text-[#5865F2] rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(88,101,242,0.2)]">🔌</div>
          <h2 className="text-2xl font-bold mb-3">No Server Connected</h2>
          <p className="text-slate-400 mb-8 max-w-md">Connect your Discord server to start tracking member engagement automatically.</p>
          <button 
            onClick={handleConnectDiscord}
            className="px-8 py-4 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-xl transition-all flex items-center gap-3 hover:-translate-y-1 shadow-[0_4px_20px_rgba(88,101,242,0.4)]"
          >
            Connect Discord Server
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#111318] border border-red-500/30 rounded-2xl p-4 md:p-6 relative overflow-hidden">
              <h3 className="text-red-400 text-xs md:text-sm font-semibold mb-2">High Risk</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl md:text-5xl font-extrabold text-white">{stats.highRisk}</span>
                <span className="text-lg mb-1">👆</span>
              </div>
            </div>
            <div className="bg-[#111318] border border-amber-500/30 rounded-2xl p-4 md:p-6 relative overflow-hidden">
              <h3 className="text-amber-400 text-xs md:text-sm font-semibold mb-2">Silent</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl md:text-5xl font-extrabold text-white">{stats.silent}</span>
                <span className="text-lg mb-1">😴</span>
              </div>
            </div>
            <div className="bg-[#111318] border border-emerald-500/30 rounded-2xl p-4 md:p-6 col-span-2 md:col-span-1">
              <h3 className="text-emerald-400 text-xs md:text-sm font-semibold mb-2">Total Members</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl md:text-5xl font-extrabold text-white">{stats.active}</span>
                <span className="text-lg mb-1">👥</span>
              </div>
            </div>
            <button 
              onClick={handleSendEmails}
              disabled={isSending}
              className="bg-gradient-to-br from-[#5865F2] to-[#4752c4] rounded-2xl p-4 md:p-6 flex flex-col justify-center items-center text-center cursor-pointer hover:scale-[1.02] transition-transform shadow-[0_8px_30px_rgba(88,101,242,0.4)] col-span-2 md:col-span-1 border-0 w-full disabled:opacity-50"
            >
              <h3 className="text-white font-bold text-lg">{isSending ? 'Sending...' : 'Send Emails'}</h3>
              <p className="text-white/80 text-xs md:text-sm">{isSending ? 'Please wait' : '1 tap recovery'}</p>
            </button>
          </div>

          {sendResult && (
            <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚀</span>
                <p className="font-semibold">Sent: <span className="text-white">{sendResult.sent}</span> recovery emails. Estimated recovered: <span className="text-white">{sendResult.recovered}</span> members!</p>
              </div>
              <button onClick={() => setSendResult(null)} className="text-emerald-400/50 hover:text-emerald-400">✕</button>
            </div>
          )}

            <div className="bg-[#111318] border border-white/5 rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold">At-Risk Member Profiles</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0c0e12]/50 text-slate-400 font-semibold tracking-wider text-xs uppercase">
                    <tr>
                      <th className="px-6 py-4">Discord ID</th>
                      <th className="px-6 py-4">Risk Level</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {members.length > 0 ? members.map((member, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4 font-medium">{member.member_id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${member.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                            {member.risk_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{member.score}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[#5865F2] font-semibold">Message</button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No members at risk detected yet.</td></tr>
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
