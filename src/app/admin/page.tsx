"use client";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  getAdminStats, 
  getAllUsers,
  updateUserProDays,
  deleteUser,
  toggleUserAdmin,
  exportUsers,
  getSystemLogs
} from './actions';

export default function AdminPanel() {
  const [stats, setStats] = useState({ 
    mrr: 0, 
    proUsers: 0, 
    trialUsers: 0, 
    totalUsers: 0,
    growthRate: 0,
    churnRate: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs'>('overview');

  useEffect(() => {
    async function checkAdminAndLoad() {
      try {
        const supabase = createClient();
        
        const { data: { user } = {} } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/login';
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.is_admin) {
          window.location.href = '/dashboard';
          return;
        }

        setIsAdmin(true);
        await loadData();
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkAdminAndLoad();
  }, []);

  async function loadData() {
    const [statsRes, usersRes, logsRes] = await Promise.all([
      getAdminStats(),
      getAllUsers(),
      getSystemLogs()
    ]);
    
    if (statsRes) {
      setStats({
        mrr: statsRes.mrr || 0,
        proUsers: statsRes.proUsers || 0,
        trialUsers: statsRes.trialUsers || 0,
        totalUsers: statsRes.totalUsers || 0,
        growthRate: statsRes.growthRate || 0,
        churnRate: statsRes.churnRate || 0
      });
    }
    if (usersRes.users) setUsers(usersRes.users);
    if (logsRes.logs) setLogs(logsRes.logs);
  }

  async function handleUpdateProDays(userId: string, days: number) {
    const result = await updateUserProDays(userId, days);
    if (result.success) {
      await loadData();
      alert('User pro days updated!');
    } else {
      alert('Failed to update: ' + result.error);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    const result = await deleteUser(userId);
    if (result.success) {
      await loadData();
      alert('User deleted!');
    } else {
      alert('Failed to delete: ' + result.error);
    }
  }

  async function handleToggleAdmin(userId: string) {
    const result = await toggleUserAdmin(userId);
    if (result.success) {
      await loadData();
      alert('Admin status toggled!');
    } else {
      alert('Failed: ' + result.error);
    }
  }

  async function handleExport() {
    const result = await exportUsers();
    if (result.users) {
      const csv = [
        ['Email', 'Pro Days', 'Admin', 'Created At'].join(','),
        ...result.users.map((u: any) => [u.email, u.pro_days_left, u.is_admin, u.created_at].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      a.click();
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-slate-400">Manage your Igone instance</p>
          </div>
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            Back to Dashboard →
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex space-x-4 mb-8">
          {['overview', 'users', 'logs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg font-medium capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Pro Users</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.proUsers}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Trial Users</p>
                <p className="text-2xl font-bold text-amber-400">{stats.trialUsers}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-sm">MRR</p>
                <p className="text-2xl font-bold text-blue-400">${stats.mrr}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Growth</p>
                <p className="text-2xl font-bold text-green-400">+{stats.growthRate.toFixed(1)}%</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Churn</p>
                <p className="text-2xl font-bold text-red-400">{stats.churnRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  Export Users (CSV)
                </button>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold">All Users ({users.length})</h2>
              <button
                onClick={handleExport}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Pro Days</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Admin</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={user.pro_days_left > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                          {user.pro_days_left}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.is_admin ? (
                          <span className="text-orange-400 font-medium">Admin</span>
                        ) : (
                          <span className="text-slate-500">User</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateProDays(user.id, 30)}
                            className="px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30"
                            title="Add 30 days"
                          >
                            +30d
                          </button>
                          <button
                            onClick={() => handleToggleAdmin(user.id)}
                            className="px-2 py-1 bg-orange-600/20 text-orange-400 rounded hover:bg-orange-600/30"
                            title="Toggle admin"
                          >
                            {user.is_admin ? '↓' : '↑'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                            title="Delete user"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">System Logs</h2>
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    log.level === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                    log.level === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                    'bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warning' ? 'text-amber-400' :
                      'text-blue-400'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
