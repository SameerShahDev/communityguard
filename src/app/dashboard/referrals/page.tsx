"use client";

export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getReferralStats, getReferralLink } from "./actions";


export default function ReferralsPage() {
  const [stats, setStats] = useState({
    totalReferrals: 0,
    paidReferrals: 0,
    earnedDays: 0,
    pendingInstalls: 0,
    referralCode: null as string | null,
  });
  const [referralLink, setReferralLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [statsData, linkData] = await Promise.all([
        getReferralStats(),
        getReferralLink()
      ]);

      if (statsData.error) {
        console.error("Failed to load stats:", statsData.error);
      } else {
        setStats({
          totalReferrals: statsData.totalReferrals,
          paidReferrals: statsData.paidReferrals,
          earnedDays: statsData.earnedDays,
          pendingInstalls: statsData.pendingInstalls,
          referralCode: statsData.referralCode,
        });
      }

      if (linkData.link) {
        setReferralLink(linkData.link);
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  const handleCopy = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/3" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-800 rounded-xl" />
            <div className="h-64 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const progressToFreeMonth = Math.min((stats.totalReferrals / 5) * 100, 100);
  const installsNeeded = Math.max(5 - stats.totalReferrals, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Viral Referral Engine</h2>
        <p className="text-slate-400 mt-1">Help us grow and lock in your Pro tier for free.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* PHASE 1: Free Month */}
        <Card className="bg-slate-900 border-blue-900/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🎁</div>
          <CardHeader>
            <CardTitle className="text-blue-400 text-2xl">Phase 1: The Viral Hook</CardTitle>
            <CardDescription className="text-slate-400">
              Invite 5 servers → 1 Month FREE Pro!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Progress</span>
                <span className="text-blue-400">{stats.totalReferrals} / 5 Installs</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressToFreeMonth}%` }}
                />
              </div>
              {installsNeeded > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  {installsNeeded} more {installsNeeded === 1 ? 'install' : 'installs'} needed for 30 days free!
                </p>
              )}
              {installsNeeded === 0 && (
                <p className="text-xs text-emerald-400 mt-2 font-semibold">
                  🎉 Goal reached! You&apos;ve earned 30 days free!
                </p>
              )}
            </div>
            
            <div className="bg-slate-950 p-4 rounded-lg flex items-center justify-between border border-slate-800">
              <code className="text-emerald-400 font-mono text-sm truncate mr-2">
                {referralLink || "Loading..."}
              </code>
              <Button 
                size="sm" 
                onClick={handleCopy}
                className={`transition-all ${isCopied ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'}`}
              >
                {isCopied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PHASE 2: Revenue Share */}
        <Card className="bg-gradient-to-br from-amber-900/20 to-slate-900 border-amber-500/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">💰</div>
          <CardHeader>
            <CardTitle className="text-amber-400 text-2xl">Phase 2: Revenue Share</CardTitle>
            <CardDescription className="text-slate-400">
              Earn 15 days of Pro per PAID referral 🔥
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800">
                  <div className="text-3xl font-bold text-white">{stats.paidReferrals}</div>
                  <div className="text-xs text-slate-400 uppercase mt-1">Paid Signups</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800">
                  <div className="text-3xl font-bold text-amber-400">+{stats.earnedDays}</div>
                  <div className="text-xs text-slate-400 uppercase mt-1">Pro Days Earned</div>
                </div>
             </div>
             
             {stats.pendingInstalls > 0 && (
               <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                 <p className="text-sm text-blue-400 text-center">
                   {stats.pendingInstalls} pending {stats.pendingInstalls === 1 ? 'referral' : 'referrals'} - upgrade to Pro to activate!
                 </p>
               </div>
             )}
             
             <p className="text-sm text-center text-slate-500 mt-4">
               {stats.paidReferrals > 0 
                 ? "Phase 2 is active! Keep sharing your link."
                 : "Invite friends who upgrade to Pro and earn!"}
             </p>
          </CardContent>
        </Card>

      </div>

      {/* How it Works */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-slate-950 rounded-lg">
              <div className="text-2xl mb-2">🔗</div>
              <h4 className="font-semibold text-white mb-1">1. Share Link</h4>
              <p className="text-slate-400">Copy your unique referral link and share with friends.</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg">
              <div className="text-2xl mb-2">🤝</div>
              <h4 className="font-semibold text-white mb-1">2. They Join</h4>
              <p className="text-slate-400">Friends sign up using your code. Both get 3 days free!</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg">
              <div className="text-2xl mb-2">💎</div>
              <h4 className="font-semibold text-white mb-1">3. Earn Rewards</h4>
              <p className="text-slate-400">Get 15 days free when they upgrade to Pro.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
