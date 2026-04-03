import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReferralsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Viral Referral Engine</h2>
        <p className="text-slate-400 mt-1">Help us grow and lock in your Pro tier for free.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* PHASE 1 */}
        <Card className="bg-slate-900 border-blue-900/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🎁</div>
          <CardHeader>
            <CardTitle className="text-blue-400 text-2xl">Phase 1: The Viral Hook</CardTitle>
            <CardDescription className="text-slate-400">Invite 5 servers → 1 Month FREE Pro!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Progress</span>
                <span className="text-blue-400">4 / 5 Installs</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full w-4/5"></div>
              </div>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-lg flex items-center justify-between border border-slate-800">
              <code className="text-emerald-400 font-mono text-sm">communityguard.ai/?ref=USER_123</code>
              <Button size="sm" className="bg-slate-800 hover:bg-slate-700">Copy Link</Button>
            </div>
          </CardContent>
        </Card>

        {/* PHASE 2 */}
        <Card className="bg-gradient-to-br from-amber-900/20 to-slate-900 border-amber-500/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">💰</div>
          <CardHeader>
            <CardTitle className="text-amber-400 text-2xl">Phase 2: Revenue Share</CardTitle>
            <CardDescription className="text-slate-400">Earn 15 days of Pro per PAID referral 🔥</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800">
                  <div className="text-3xl font-bold text-white">6</div>
                  <div className="text-xs text-slate-400 uppercase mt-1">Paid Signups</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800">
                  <div className="text-3xl font-bold text-amber-400">+90</div>
                  <div className="text-xs text-slate-400 uppercase mt-1">Pro Days Earned</div>
                </div>
             </div>
             <p className="text-sm text-center text-slate-500 mt-6">
               Phase 2 is active! Keep sharing your link.
             </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
