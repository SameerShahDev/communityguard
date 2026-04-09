"use client";

import { useState, useEffect } from 'react';
import { 
  getSubscriptionDashboard, 
  searchUserSubscriptions,
  cancelSubscriptionAdvanced,
  reactivateSubscription,
  changePlan,
  getSubscriptionHistory,
  SUBSCRIPTION_PLANS,
  type PlanId 
} from '@/app/dashboard/subscription-actions';
import { PaymentButton } from './PaymentButton';
import Link from 'next/link';

interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  billing_cycle: string;
  price_inr: number;
  days_remaining: number;
  in_grace_period: boolean;
  ends_at: string;
  created_at: string;
}

interface SubscriptionManagerProps {
  userId: string;
}

export function SubscriptionManager({ userId }: SubscriptionManagerProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    setLoading(true);
    const [subResult, summaryResult] = await Promise.all([
      searchUserSubscriptions(userId, { status: statusFilter as any }),
      getSubscriptionDashboard(userId)
    ]);
    
    if (subResult.error) setError(subResult.error);
    else setSubscriptions(subResult.subscriptions);
    
    if (summaryResult.summary) setSummary(summaryResult.summary);
    setLoading(false);
  }

  async function handleSearch() {
    const result = await searchUserSubscriptions(userId, {
      query: searchQuery,
      status: statusFilter as any
    });
    if (!result.error) setSubscriptions(result.subscriptions);
  }

  async function handleCancel(subscriptionId: string, immediate: boolean = false) {
    if (!confirm(immediate 
      ? 'Cancel immediately? You will lose access now.' 
      : 'Cancel at period end? You keep access until subscription expires.'
    )) return;

    const result = await cancelSubscriptionAdvanced(userId, {
      immediate,
      reason: 'User requested cancellation'
    });

    if (result.success) {
      alert(result.message);
      loadData();
    } else {
      alert('Error: ' + result.error);
    }
  }

  async function handleReactivate(subscriptionId: string) {
    if (!confirm('Reactivate this subscription?')) return;

    const result = await reactivateSubscription(subscriptionId);
    if (result.success) {
      alert('Subscription reactivated!');
      loadData();
    } else {
      alert('Error: ' + result.error);
    }
  }

  async function handleViewHistory() {
    if (!showHistory) {
      const result = await getSubscriptionHistory(userId);
      if (!result.error) setEvents(result.events);
    }
    setShowHistory(!showHistory);
  }

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-500 py-4">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl">
            <p className="text-slate-400 text-sm">Active Subs</p>
            <p className="text-2xl font-bold text-white">{summary.total_active}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl">
            <p className="text-slate-400 text-sm">Current Plan</p>
            <p className="text-lg font-bold text-white">{summary.current_plan || 'Free'}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl">
            <p className="text-slate-400 text-sm">Days Left</p>
            <p className={`text-2xl font-bold ${summary.days_remaining < 7 ? 'text-red-400' : 'text-emerald-400'}`}>
              {summary.days_remaining}
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl">
            <p className="text-slate-400 text-sm">Total Spent</p>
            <p className="text-lg font-bold text-white">₹{summary.total_spent_inr}</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); handleSearch(); }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
          Search
        </button>
        <button
          onClick={handleViewHistory}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
        >
          {showHistory ? 'Hide' : 'View'} History
        </button>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-3">
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No subscriptions found</p>
            <Link href="/pricing" className="text-blue-400 hover:underline">
              View Plans
            </Link>
          </div>
        ) : (
          subscriptions.map((sub) => (
            <div
              key={sub.id}
              className={`p-4 rounded-xl border ${
                sub.status === 'active' 
                  ? 'bg-emerald-900/20 border-emerald-800' 
                  : sub.status === 'cancelled'
                  ? 'bg-red-900/20 border-red-800'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{sub.plan_name}</h3>
                  <p className="text-sm text-slate-400">
                    {sub.billing_cycle} • ₹{sub.price_inr / 100}
                  </p>
                  {sub.in_grace_period && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                      In Grace Period
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    sub.status === 'active' 
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : sub.status === 'cancelled'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {sub.status}
                  </span>
                  {sub.status === 'active' && (
                    <p className="text-xs text-slate-400 mt-1">
                      {sub.days_remaining} days left
                    </p>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 mt-3">
                {sub.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleCancel(sub.id, false)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white"
                    >
                      Cancel at End
                    </button>
                    <button
                      onClick={() => handleCancel(sub.id, true)}
                      className="px-3 py-1.5 bg-red-600/50 hover:bg-red-600 rounded text-sm text-white"
                    >
                      Cancel Now
                    </button>
                  </>
                )}
                {(sub.status === 'cancelled' || sub.status === 'expired') && (
                  <button
                    onClick={() => handleReactivate(sub.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded text-sm text-white"
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* History */}
      {showHistory && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="font-semibold text-white mb-3">Subscription History</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-slate-400 text-sm">No history available</p>
            ) : (
              events.map((event, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-slate-700/50 rounded">
                  <span className={`w-2 h-2 rounded-full ${
                    event.event_type === 'created' ? 'bg-emerald-400' :
                    event.event_type === 'cancelled' ? 'bg-red-400' :
                    event.event_type === 'upgraded' ? 'bg-blue-400' :
                    'bg-slate-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-white capitalize">{event.event_type.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-400">{event.description}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(event.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Upgrade Section */}
      {summary?.can_upgrade && (
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-4 border border-blue-800">
          <h3 className="font-semibold text-white mb-2">Ready to Upgrade?</h3>
          <p className="text-sm text-slate-400 mb-3">
            Get more features and higher limits with our premium plans.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
          >
            View Upgrade Options
          </Link>
        </div>
      )}
    </div>
  );
}

// Quick Subscription Card for Dashboard
export function SubscriptionQuickCard({ userId }: { userId: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscriptionDashboard(userId).then(result => {
      if (result.summary) setSummary(result.summary);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div className="animate-pulse bg-slate-800 h-32 rounded-xl" />;

  if (!summary || summary.total_active === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Free Plan</h3>
            <p className="text-sm text-slate-400">Upgrade to unlock all features</p>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-sm"
          >
            Upgrade
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 rounded-xl p-4 border border-emerald-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">{summary.current_plan}</h3>
          <p className="text-sm text-emerald-400">
            {summary.days_remaining} days remaining
          </p>
          {summary.has_grace_period && (
            <p className="text-xs text-amber-400 mt-1">
              ⚠️ In grace period - Reactivate now!
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}
