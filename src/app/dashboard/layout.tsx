import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import ReferralModal from '@/app/components/ReferralModal';
import { LogoutButton } from '@/app/components/LogoutButton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  const { data: user } = await supabase
    .from('users')
    .select('pro_days_left, is_admin, referral_code, discord_username, email')
    .eq('id', authUser?.id)
    .single();

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <Image src="/icon.jpeg" alt="IGone Logo" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Igone</h1>
              <p className="text-[10px] text-slate-400">Discord Analytics</p>
            </div>
          </Link>
        </div>
        
        {/* User Profile Mini */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.discord_username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.discord_username || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          
          {/* Pro Status */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Pro Days:</span>
              <span className="text-sm font-semibold text-emerald-400">{user?.pro_days_left || 0}</span>
            </div>
            {user?.pro_days_left > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full font-medium">
                PRO
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">Main</p>
          
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all group"
          >
            <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-sm font-medium">Overview</span>
          </Link>
          
          <Link 
            href="/dashboard/referrals" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all group"
          >
            <svg className="w-5 h-5 text-slate-400 group-hover:text-pink-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Refer & Earn</span>
            <span className="ml-auto px-2 py-0.5 bg-pink-500/20 text-pink-400 text-[10px] rounded-full font-medium">
              FREE
            </span>
          </Link>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-3">Settings</p>
          
          <Link 
            href="/dashboard/profile" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all group"
          >
            <svg className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium">Profile</span>
          </Link>

          {user?.is_admin && (
            <>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-3">Admin</p>
              <Link 
                href="/admin" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all group"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">Admin Panel</span>
              </Link>
            </>
          )}
        </nav>
        
        {/* Referral Code Display */}
        {user?.referral_code && (
          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Your Referral Code</p>
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono text-blue-400">{user.referral_code}</code>
                <Link 
                  href="/dashboard/referrals" 
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Copy Link →
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <LogoutButton 
            variant="ghost" 
            size="sm" 
            fullWidth={true}
            showIcon={true}
            className="text-slate-400 hover:text-white hover:bg-slate-800 justify-start"
          />
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-slate-950">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </main>
      
      {/* Referral Code Modal - shows once after login */}
      <ReferralModal />
    </div>
  );
}
