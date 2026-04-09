"use client";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  SubscriptionManager,
  SubscriptionQuickCard 
} from '@/app/components/SubscriptionManager';
import { PaymentButton } from '@/app/components/PaymentButton';
import Link from 'next/link';

export default function SubscriptionsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    setUser(userData);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Subscription Management</h1>
            <p className="text-slate-400 mt-1">
              Manage your plans, billing, and subscription history
            </p>
          </div>
          <Link
            href="/pricing"
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 rounded-xl text-white font-semibold transition-all"
          >
            View All Plans
          </Link>
        </div>
      </div>

      {/* Quick Status Card */}
      <div className="max-w-6xl mx-auto mb-8">
        <SubscriptionQuickCard userId={user?.id} />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        <SubscriptionManager userId={user?.id} />
      </div>

      {/* Help Section */}
      <div className="max-w-6xl mx-auto mt-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Need Help?</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">Billing Questions</h4>
              <p className="text-sm text-slate-400">Contact support for any billing issues</p>
              <a href="mailto:sahanapraveen2006@gmail.com" className="text-blue-400 text-sm hover:underline mt-2 block">
                Contact Support
              </a>
            </div>
            
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">Refund Policy</h4>
              <p className="text-sm text-slate-400">7-day money-back guarantee on all plans</p>
              <Link href="/refund-policy" className="text-blue-400 text-sm hover:underline mt-2 block">
                Learn More
              </Link>
            </div>
            
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">FAQ</h4>
              <p className="text-sm text-slate-400">Common questions about subscriptions</p>
              <Link href="/pricing#faq" className="text-blue-400 text-sm hover:underline mt-2 block">
                View FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
