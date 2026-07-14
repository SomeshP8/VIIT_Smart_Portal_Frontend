import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  AlertTriangle,
  Search,
  BookOpen,
  MessageSquare,
  Calendar,
  ShieldAlert,
  GraduationCap,
  Megaphone
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/complaints', label: 'Complaints', icon: AlertTriangle },
    { to: '/lost-found', label: 'Lost & Found', icon: Search },
    { to: '/notes', label: 'Study Materials', icon: BookOpen },
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/forum', label: 'Discussion Forum', icon: MessageSquare },
    { to: '/events', label: 'Events & Clubs', icon: Calendar },
  ];

  if (user?.role === 'admin') {
    links.push({ to: '/admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  const baseLinkClass =
    'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 border border-transparent';
  const activeLinkClass =
    'bg-primary-500/10 border-primary-500/10 text-primary-600 dark:text-primary-400';
  const inactiveLinkClass =
    'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50';

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Navigation drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/50 bg-white p-5 dark:border-slate-800/50 dark:bg-slate-950 transition-transform duration-300 md:sticky md:top-[65px] md:h-[calc(100vh-65px)] md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card info inside sidebar bottom */}
        {user?.role === 'student' && (
          <div className="mt-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-2 mb-2 text-primary-600 dark:text-primary-400">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Student Profile</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">Dept: {user.department}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Year: {user.year} (Sem {user.semester})</p>
            <p className="text-xs text-slate-400 font-mono mt-1 select-all">{user.rollNumber}</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
