"use client";

import { useState } from 'react';
import { updateUserSubscription, deleteUser, updateSubscriptionLimits } from './actions';

interface User {
  id: string;
  email: string;
  pro_days_left: number;
  is_admin: boolean;
  discord_id?: string;
  created_at: string;
}

interface SubscriptionLimits {
  free: { max_servers: number; max_emails_per_day: number; max_members_tracked: number };
  pro: { max_servers: number; max_emails_per_day: number; max_members_tracked: number };
}

export function UserManagement({ users, onRefresh }: { users: User[]; onRefresh: () => void }) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [proDays, setProDays] = useState(30);

  const handleUpdate = async () => {
    if (!editingUser) return;
    const res = await updateUserSubscription(editingUser.id, { pro_days_left: proDays });
    if (res.success) {
      alert("User updated!");
      setEditingUser(null);
      onRefresh();
    } else {
      alert("Failed to update user");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await deleteUser(userId);
    if (res.success) {
      alert("User deleted!");
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">User Management ({users.length} users)</h2>
      
      {editingUser && (
        <div className="bg-[#111318] p-4 rounded-xl border border-white/10">
          <h3 className="font-semibold mb-3">Edit: {editingUser.email}</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={proDays}
              onChange={(e) => setProDays(Number(e.target.value))}
              className="bg-[#0c0e12] border border-white/10 rounded-lg px-3 py-2 text-white"
              placeholder="Pro days"
            />
            <button onClick={handleUpdate} className="px-4 py-2 bg-emerald-500 rounded-lg font-semibold">Save</button>
            <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-slate-600 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-[#111318] rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-sm">Email</th>
              <th className="p-3 text-sm">Pro Days</th>
              <th className="p-3 text-sm">Admin</th>
              <th className="p-3 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 20).map((user) => (
              <tr key={user.id} className="border-t border-white/5">
                <td className="p-3 text-sm">{user.email}</td>
                <td className="p-3 text-sm">
                  <span className={user.pro_days_left > 0 ? "text-emerald-400" : "text-slate-400"}>
                    {user.pro_days_left}
                  </span>
                </td>
                <td className="p-3 text-sm">{user.is_admin ? "✅" : "—"}</td>
                <td className="p-3 text-sm flex gap-2">
                  <button 
                    onClick={() => { setEditingUser(user); setProDays(user.pro_days_left || 0); }}
                    className="text-blue-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SubscriptionConfig({ limits, onRefresh }: { limits: SubscriptionLimits; onRefresh: () => void }) {
  const [freeLimits, setFreeLimits] = useState(limits.free);
  const [proLimits, setProLimits] = useState(limits.pro);

  const handleSave = async (plan: 'free' | 'pro') => {
    const limitsToSave = plan === 'free' ? freeLimits : proLimits;
    const res = await updateSubscriptionLimits(plan, limitsToSave);
    if (res.success) {
      alert(`${plan} limits updated!`);
      onRefresh();
    } else {
      alert("Failed to update limits");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Subscription Limits</h2>
      
      {/* Free Plan */}
      <div className="bg-[#111318] p-4 rounded-xl border border-white/10">
        <h3 className="font-semibold mb-3 text-amber-400">🆓 Free Plan Limits</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400">Max Servers</label>
            <input
              type="number"
              value={freeLimits.max_servers}
              onChange={(e) => setFreeLimits({...freeLimits, max_servers: Number(e.target.value)})}
              className="w-full bg-[#0c0e12] border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Emails/Day</label>
            <input
              type="number"
              value={freeLimits.max_emails_per_day}
              onChange={(e) => setFreeLimits({...freeLimits, max_emails_per_day: Number(e.target.value)})}
              className="w-full bg-[#0c0e12] border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Max Members</label>
            <input
              type="number"
              value={freeLimits.max_members_tracked}
              onChange={(e) => setFreeLimits({...freeLimits, max_members_tracked: Number(e.target.value)})}
              className="w-full bg-[#0c0e12] border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>
        <button onClick={() => handleSave('free')} className="px-4 py-2 bg-amber-500 rounded-lg font-semibold">Save Free Limits</button>
      </div>

      {/* Pro Plan */}
      <div className="bg-[#111318] p-4 rounded-xl border border-[#5865F2]/30">
        <h3 className="font-semibold mb-3 text-[#5865F2]">⭐ Pro Plan Limits</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400">Max Servers</label>
            <input
              type="number"
              value={proLimits.max_servers}
              onChange={(e) => setProLimits({...proLimits, max_servers: Number(e.target.value)})}
              className="w-full bg-[#0c0e12] border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Emails/Day</label>
            <input
              type="number"
              value={proLimits.max_emails_per_day}
              onChange={(e) => setProLimits({...proLimits, max_emails_per_day: Number(e.target.value)})}
              className="w-full bg-[#0c0e12] border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Max Members</label>
            <input
              type="number"
              value={proLimits.max_members_tracked}
              onChange={(e) => setProLimits({...proLimits, max_members_tracked: Number(e.target.value)})}
              className="w-full bg-[#0c0e12] border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>
        <button onClick={() => handleSave('pro')} className="px-4 py-2 bg-[#5865F2] rounded-lg font-semibold">Save Pro Limits</button>
      </div>
    </div>
  );
}
