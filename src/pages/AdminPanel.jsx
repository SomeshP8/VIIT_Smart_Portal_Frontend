import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Users,
  BookOpen,
  Megaphone,
  MessageSquare,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Loader2,
  ShieldCheck,
  GraduationCap,
  TrendingUp,
  Building2,
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, bg, sub }) => (
  <div className={`group relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${bg}`}>
    <div className="flex items-center justify-between">
      <div className={`p-2.5 rounded-xl ${color} bg-white/10`}>
        <Icon className="h-5 w-5" />
      </div>
      {sub !== undefined && (
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">{sub}</span>
      )}
    </div>
    <div>
      <p className="text-3xl font-extrabold tracking-tight text-white">
        {value !== undefined ? value.toLocaleString() : '—'}
      </p>
      <p className="text-xs font-semibold text-white/70 mt-0.5">{label}</p>
    </div>
  </div>
);

const DEPT_COLORS = {
  CS:    'from-blue-500 to-cyan-500',
  IT:    'from-indigo-500 to-purple-500',
  EC:    'from-emerald-500 to-teal-500',
  EE:    'from-amber-500 to-orange-500',
  ME:    'from-red-500 to-pink-500',
  CE:    'from-stone-500 to-zinc-500',
  Other: 'from-slate-500 to-slate-600',
};

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/admin/stats');
        setStats(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          Loading administrative statistics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-red-500">
        <AlertCircle className="h-10 w-10" />
        <p className="text-sm font-semibold">{error}</p>
      </div>
    );
  }

  const { counts, departmentBreakdown, recentUsers } = stats;
  const maxDeptCount = Math.max(...(departmentBreakdown?.map((d) => d.count) || [1]), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary-500" />
          <span className="font-serif">Admin Panel</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Real-time platform overview and administrative statistics.
        </p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={counts.totalUsers}
          color="text-white"
          bg="bg-gradient-to-br from-primary-600 to-indigo-600 border-primary-500/20"
        />
        <StatCard
          icon={GraduationCap}
          label="Students"
          value={counts.totalStudents}
          color="text-white"
          bg="bg-gradient-to-br from-sky-600 to-blue-600 border-sky-500/20"
        />
        <StatCard
          icon={BookOpen}
          label="Study Materials"
          value={counts.totalNotes}
          color="text-white"
          bg="bg-gradient-to-br from-emerald-600 to-teal-600 border-emerald-500/20"
        />
        <StatCard
          icon={Megaphone}
          label="Announcements"
          value={counts.totalAnnouncements}
          color="text-white"
          bg="bg-gradient-to-br from-violet-600 to-purple-600 border-violet-500/20"
        />
        <StatCard
          icon={MessageSquare}
          label="Forum Posts"
          value={counts.totalPosts}
          color="text-white"
          bg="bg-gradient-to-br from-pink-600 to-rose-600 border-pink-500/20"
        />
        <StatCard
          icon={Calendar}
          label="Campus Events"
          value={counts.totalEvents}
          color="text-white"
          bg="bg-gradient-to-br from-amber-600 to-orange-600 border-amber-500/20"
        />
        <StatCard
          icon={Clock}
          label="Open Complaints"
          value={counts.openComplaints}
          color="text-white"
          bg="bg-gradient-to-br from-red-600 to-orange-600 border-red-500/20"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved Complaints"
          value={counts.resolvedComplaints}
          color="text-white"
          bg="bg-gradient-to-br from-green-600 to-emerald-600 border-green-500/20"
        />
      </div>

      {/* Department Breakdown + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="glass-premium rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-500" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Students by Department
            </h2>
          </div>
          {departmentBreakdown && departmentBreakdown.length > 0 ? (
            <div className="space-y-3">
              {departmentBreakdown.map((dept) => {
                const pct = Math.round((dept.count / maxDeptCount) * 100);
                const gradient = DEPT_COLORS[dept.department] || DEPT_COLORS.Other;
                return (
                  <div key={dept.department} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{dept.department}</span>
                      <span className="text-slate-500 dark:text-slate-400">{dept.count} students</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No department data yet.</p>
          )}
        </div>

        {/* Recently Joined Users */}
        <div className="glass-premium rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-500" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Recently Joined Users
            </h2>
          </div>
          {recentUsers && recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        u.role === 'admin'
                          ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                          : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      }`}
                    >
                      {u.role}
                    </span>
                    {u.department && (
                      <p className="text-[9px] text-slate-400 mt-0.5">{u.department} • Year {u.year}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No users yet.</p>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      <div className="glass-premium rounded-2xl p-5 flex flex-wrap gap-6 items-center justify-around text-center">
        <div>
          <p className="text-2xl font-extrabold text-primary-500">{counts.totalAdmins}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Admins</p>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
        <div>
          <p className="text-2xl font-extrabold text-sky-500">
            {counts.totalComplaints > 0
              ? `${Math.round((counts.resolvedComplaints / counts.totalComplaints) * 100)}%`
              : '—'}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Complaint Resolution</p>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
        <div>
          <p className="text-2xl font-extrabold text-emerald-500">{counts.totalNotes}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Study Files Uploaded</p>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
        <div>
          <p className="text-2xl font-extrabold text-violet-500">{counts.totalPosts}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Forum Discussions</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
