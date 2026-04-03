import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  const { data: user } = await supabase
    .from('users')
    .select('pro_days_left, is_admin')
    .eq('id', authUser?.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-8">
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
            <Link href="/admin" className="px-4 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors mt-8">
               Admin Panel
            </Link>
          )}
        </nav>
        
        <div className="mt-auto bg-slate-800 p-4 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Pro Days Left</p>
            <div className="text-2xl font-bold text-emerald-400">{user?.pro_days_left || 0} Days</div>
            <Link href="/dashboard/referrals" className="text-xs text-blue-400 hover:underline mt-2 inline-block">Get More Days →</Link>
        </div>
      </aside>
      
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
