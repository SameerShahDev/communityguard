import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ReferralModal from '@/app/components/ReferralModal';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  const { data: user } = await supabase
    .from('users')
    .select('pro_days_left, is_admin')
    .eq('id', authUser?.id)
    .single();

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden">
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 md:p-6 flex flex-col gap-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-1">
            CommunityGuard<span className="text-blue-500">.ai</span>
          </h1>
          <p className="text-xs text-slate-400">Pro Plan</p>
        </div>
        
        <nav className="flex flex-col gap-2">
          <Link href="/dashboard" className="px-4 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
             Overview
          </Link>
          <Link href="/dashboard/referrals" className="px-4 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex justify-between items-center">
             Refer & Earn <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">HOT</span>
          </Link>
          {user?.is_admin && (
            <Link href="/admin" className="px-4 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors mt-4 border-t border-slate-700 pt-4">
               ⚙️ Admin Panel
            </Link>
          )}
        </nav>
        
        <div className="mt-auto bg-slate-800 p-4 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Pro Days Left</p>
            <div className="text-2xl font-bold text-emerald-400">{user?.pro_days_left || 0} Days</div>
            <Link href="/dashboard/referrals" className="text-xs text-blue-400 hover:underline mt-2 inline-block">Get More Days →</Link>
        </div>
      </aside>
      
      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        <div className="h-full w-full overflow-y-auto">
          {children}
        </div>
      </main>
      
      {/* Referral Code Modal - shows once after login */}
      <ReferralModal />
    </div>
  );
}
