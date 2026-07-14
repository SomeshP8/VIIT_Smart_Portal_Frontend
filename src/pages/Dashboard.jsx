import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  AlertTriangle,
  Search,
  BookOpen,
  MessageSquare,
  Calendar,
  Megaphone,
  PlusCircle,
  FileText,
  UserCheck,
  TrendingUp,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    complaintsCount: 0,
    lostItemsCount: 0,
    announcements: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Fetch complaints list (first page)
        const complaintsRes = await api.get('/complaints?limit=5');
        
        // Fetch lost-found items (first page)
        const lostFoundRes = await api.get('/lost-found?limit=5');

        // Fetch announcements (first page)
        // Note: Announcement endpoints are created in Phase 4, so fallback gracefully
        let announcements = [];
        try {
          const annRes = await api.get('/announcements?limit=3');
          announcements = annRes.data.data.announcements || [];
        } catch (err) {
          console.warn('Announcements API not ready yet - falling back');
        }

        setStats({
          complaintsCount: complaintsRes.data.data.pagination?.total || complaintsRes.data.data.complaints?.length || 0,
          lostItemsCount: lostFoundRes.data.data.pagination?.total || lostFoundRes.data.data.items?.length || 0,
          announcements,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const actionCards = [
    {
      title: 'File a Complaint',
      desc: 'Report campus issues like hostel repairs or classroom maintenance.',
      to: '/complaints',
      color: 'from-amber-500 to-orange-600',
      icon: AlertTriangle,
    },
    {
      title: 'Lost & Found Hub',
      desc: 'Browse or report lost belongings and claim items reported found.',
      to: '/lost-found',
      color: 'from-sky-500 to-indigo-600',
      icon: Search,
    },
    {
      title: 'Study Materials',
      desc: 'Access or upload department notes and lecture PDFs.',
      to: '/notes',
      color: 'from-emerald-500 to-teal-600',
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-indigo-700 p-8 text-white shadow-xl shadow-primary-500/10">
        <div className="absolute top-[-20%] right-[-5%] w-[40%] h-[150%] rounded-full bg-white/5 rotate-12 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            VIIT Smart Campus
          </span>
          <h1 className="mt-4 text-3xl font-extrabold md:text-4xl tracking-tight leading-tight">
            Welcome Back, <span className="font-serif italic font-medium">{user?.name}</span>!
          </h1>
          <p className="mt-2 text-primary-100 text-sm md:text-base leading-relaxed">
            {user?.role === 'admin'
              ? 'Administrator workspace. Monitor campus issues, broadcast global announcements, and moderate student boards.'
              : `Your student portal is ready. Check department notices, submit complaints, and coordinate lost items claims.`}
          </p>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Complaints stats */}
        <div className="glass-premium rounded-2xl p-6 flex items-center justify-between card-hover-effect">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {user?.role === 'admin' ? 'Total Complaints filed' : 'My Active Complaints'}
            </p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {isLoading ? (
                <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md"></div>
              ) : (
                stats.complaintsCount
              )}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Updated in real-time
            </p>
          </div>
          <div className="rounded-2xl bg-amber-500/10 p-4 text-amber-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
        </div>

        {/* Lost & Found stats */}
        <div className="glass-premium rounded-2xl p-6 flex items-center justify-between card-hover-effect">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Lost & Found Listings
            </p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {isLoading ? (
                <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md"></div>
              ) : (
                stats.lostItemsCount
              )}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Active claims open
            </p>
          </div>
          <div className="rounded-2xl bg-primary-500/10 p-4 text-primary-500">
            <Search className="h-8 w-8" />
          </div>
        </div>

        {/* User profile role info card */}
        <div className="glass-premium rounded-2xl p-6 flex items-center justify-between card-hover-effect sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Profile Verification
            </p>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 capitalize">
              Verified {user?.role}
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">
              {user?.role === 'student' ? `${user?.department} Department` : 'System Administrator'}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-500">
            <UserCheck className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Action Shortcut Panels */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-primary-500" />
          <span>Quick Actions & Workspaces</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.to}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-6 dark:border-slate-800/50 dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`inline-flex rounded-xl bg-gradient-to-br ${card.color} p-3 text-white mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                  {card.title}
                </h4>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {card.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Split Row for Notice Board & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pinned Announcements Board */}
        <div className="lg:col-span-2 glass-premium rounded-3xl p-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-500" />
              <span>Campus Notice Board</span>
            </h2>
            <Link to="/announcements" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {stats.announcements.length > 0 ? (
              stats.announcements.map((ann) => (
                <div
                  key={ann._id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 hover:border-indigo-500/25 transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-500/5 px-2 py-0.5 rounded-md">
                      Notice
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{ann.title}</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {ann.body}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <Megaphone className="h-10 w-10 mx-auto opacity-40 animate-pulse-subtle" />
                <p className="text-sm font-medium">No recent announcements matching your criteria</p>
                <p className="text-xs">Important broadcast notices will appear here once published by admins.</p>
              </div>
            )}
          </div>
        </div>

        {/* Academic Calendar Widget */}
        <div className="glass-premium rounded-3xl p-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <span>Upcoming Events</span>
            </h2>
            <Link to="/events" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              Full List
            </Link>
          </div>

          {/* Simple Static Showcase before Phase 5 */}
          <div className="space-y-4">
            <div className="flex gap-4 items-start p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="bg-emerald-500 text-white rounded-xl p-2 text-center w-12 shrink-0">
                <span className="block text-sm font-bold leading-none">20</span>
                <span className="text-[10px] font-bold uppercase">Jul</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Campus Hackathon 2026</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Venue: Main Audi | Time: 9:00 AM</p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
              <div className="bg-indigo-500 text-white rounded-xl p-2 text-center w-12 shrink-0">
                <span className="block text-sm font-bold leading-none">25</span>
                <span className="text-[10px] font-bold uppercase">Jul</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Alumni Networking Meet</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Venue: Seminar Hall 1 | Time: 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
