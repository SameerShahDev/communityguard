"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STEPS = [
  { id: 1, label: 'Create Account', icon: '✅' },
  { id: 2, label: 'Connect Discord', icon: '🔌' },
  { id: 3, label: 'Start Protecting', icon: '🛡️' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
    }
    checkAuth();
  }, []);

  const handleConnectDiscord = async () => {
    setIsConnecting(true);
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback/discord`);
    const scope = 'identify guilds bot applications.commands';
    const permissions = '8'; // Admin
    const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}`;
    window.location.href = url;
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-[#f6f6fc] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#5865F2] opacity-[0.06] blur-[160px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 hover:scale-105 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center shadow-[0_0_20px_rgba(88,101,242,0.4)]">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold tracking-tight">CommunityGuard</span>
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  step.id === 1
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : step.id === 2
                    ? 'bg-[#5865F2]/20 text-[#a2a9fa] border border-[#5865F2]/40 scale-105'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                <span>{step.icon}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-[2px] rounded-full ${i === 0 ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-[#111318] border border-white/5 rounded-[2rem] p-8 md:p-12 shadow-2xl text-center">
          {/* Icon */}
          <div className="w-24 h-24 rounded-3xl bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center text-5xl mx-auto mb-8 shadow-[0_0_40px_rgba(88,101,242,0.2)] animate-in zoom-in duration-500">
            🔌
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-white">
            Connect Your Discord Server
          </h1>

          {user && (
            <p className="text-slate-400 mb-3 text-sm">
              Logged in as <span className="text-[#a2a9fa] font-medium">{user.email}</span>
            </p>
          )}

          <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Invite the CommunityGuard bot to your server. It will silently track member activity and alert you before people leave.
          </p>

          {/* How it works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
            {[
              { icon: '👁️', title: 'Silent Tracking', desc: 'Bot watches message activity without interrupting your community.' },
              { icon: '📊', title: 'Risk Scoring', desc: 'Members who go silent get a churn risk score automatically.' },
              { icon: '📧', title: 'Auto Recovery', desc: 'We email at-risk members before they press Leave Server.' },
            ].map((item) => (
              <div key={item.title} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-white text-sm mb-1">{item.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleConnectDiscord}
            disabled={isConnecting}
            className="w-full sm:w-auto px-10 py-5 bg-[#5865F2] hover:bg-[#4752c4] text-white font-extrabold rounded-2xl transition-all shadow-[0_8px_30px_rgba(88,101,242,0.4)] hover:shadow-[0_12px_40px_rgba(88,101,242,0.6)] hover:-translate-y-1 transform active:scale-100 disabled:opacity-60 flex items-center justify-center gap-3 mx-auto text-lg"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 127.14 96.36" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.1,46,96,53,91,65.69,84.69,65.69Z"/>
                </svg>
                Add Bot to Discord Server
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            className="block mt-5 text-sm text-slate-500 hover:text-slate-300 transition-colors mx-auto"
          >
            Skip for now — I'll connect later →
          </button>
        </div>
      </div>
    </div>
  );
}
