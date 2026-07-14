import React, { useEffect, useState } from 'react';
import { Menu, Bell, LogOut, ChevronDown, User as UserIcon, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';

const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleNotificationClick = async (notif) => {
    setNotifOpen(false);
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    
    const typePaths = {
      complaint: '/complaints',
      announcement: '/announcements',
      forum: '/forum',
      event: '/events',
    };
    
    const targetPath = typePaths[notif.type] || '/';
    navigate(targetPath);
  };

  return (
    <nav className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-slate-200/50 bg-white/70 px-6 py-3 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/70">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuToggle}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl font-black tracking-tight gradient-text">VIIT</span>
          <span className="hidden font-sans text-sm font-semibold text-slate-500 dark:text-slate-400 sm:inline-block">
            Smart Campus Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <DarkModeToggle />

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={`relative rounded-xl p-2 transition-all ${
              notifOpen
                ? 'bg-primary-500/10 text-primary-500'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-primary-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-slate-950 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div
                onClick={() => setNotifOpen(false)}
                className="fixed inset-0 z-10"
              />
              <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-slate-200/50 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-slate-800/50 dark:bg-slate-900 z-20 animate-fadeIn flex flex-col max-h-[400px]">
                <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-850 dark:text-slate-205">Campus Alerts</p>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 py-1 max-h-[300px]">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 text-left transition-all ${
                          !notif.isRead
                            ? 'bg-primary-500/5 font-medium'
                            : 'opacity-70'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-850 dark:text-slate-205 truncate">{notif.title}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-450 line-clamp-2 mt-0.5 leading-normal">{notif.message}</p>
                          <p className="text-[8px] text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                        </div>
                        {!notif.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary-500 self-center shrink-0" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-[10px] text-slate-400">
                      No notifications yet
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <img
              src={user?.avatar}
              alt={user?.name}
              className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
            />
            <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-300 md:inline-block">
              {user?.name}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 md:inline-block" />
          </button>

          {dropdownOpen && (
            <>
              <div
                onClick={() => setDropdownOpen(false)}
                className="fixed inset-0 z-10"
              />
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-200/50 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-slate-800/50 dark:bg-slate-900 z-20 animate-fadeIn">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed In As</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-500/5 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
