import React, { useEffect } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { AlertTriangle, Megaphone, MessageSquare, Calendar, X } from 'lucide-react';

const Toast = () => {
  const { toast, setToast } = useNotificationStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000); // Auto-dismiss after 5s
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  if (!toast) return null;

  const typeConfig = {
    complaint: { icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    announcement: { icon: Megaphone, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
    forum: { icon: MessageSquare, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
    event: { icon: Calendar, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  };

  const current = typeConfig[toast.type] || typeConfig.complaint;
  const Icon = current.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl border shadow-xl p-4 animate-slideLeft glass border-slate-200/50 dark:border-slate-800/50 flex gap-3.5 items-start">
      <div className={`p-2.5 rounded-xl border ${current.color} shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      
      <div className="flex-1 space-y-1">
        <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 pr-4 leading-tight">
          {toast.title}
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => setToast(null)}
        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 self-start"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
