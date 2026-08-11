import React from 'react';
import {
  Bell,
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  Check,
} from 'lucide-react';
import { SystemNotification } from '../../types';

interface NotificationCenterViewProps {
  notifications: SystemNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationCenterView: React.FC<NotificationCenterViewProps> = ({
  notifications,
  onMarkAllRead,
  onMarkRead,
}) => {
  const getStyleForNotification = (type: string, isRead: boolean) => {
    switch (type) {
      case 'success':
        return {
          container: isRead
            ? 'bg-emerald-900/90 text-white border-2 border-emerald-950'
            : 'bg-[#014421] text-white border-2 border-emerald-950 shadow-md',
          icon: <CheckCircle2 className="w-5 h-5 text-[#DAA520] shrink-0 mt-0.5" />,
          titleColor: 'text-[#DAA520]',
          bodyColor: 'text-white',
          timeColor: 'text-emerald-200',
        };
      case 'alert':
        return {
          container: isRead
            ? 'bg-rose-950 text-white border-2 border-rose-900'
            : 'bg-rose-800 text-white border-2 border-rose-950 shadow-md',
          icon: <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />,
          titleColor: 'text-amber-300',
          bodyColor: 'text-white',
          timeColor: 'text-rose-200',
        };
      case 'warning':
        return {
          container: isRead
            ? 'bg-amber-300 text-slate-950 border-2 border-amber-500'
            : 'bg-amber-400 text-slate-950 border-2 border-amber-600 shadow-md',
          icon: <AlertTriangle className="w-5 h-5 text-slate-950 shrink-0 mt-0.5" />,
          titleColor: 'text-slate-950 font-black',
          bodyColor: 'text-slate-950 font-extrabold',
          timeColor: 'text-slate-800',
        };
      case 'info':
      default:
        return {
          container: isRead
            ? 'bg-blue-900 text-white border-2 border-blue-950'
            : 'bg-blue-700 text-white border-2 border-blue-950 shadow-md',
          icon: <Info className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />,
          titleColor: 'text-amber-300',
          bodyColor: 'text-white',
          timeColor: 'text-blue-200',
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider mb-2">
            <Bell className="w-3.5 h-3.5" />
            Cooperative Communications
          </div>
          <h1 className="text-2xl font-extrabold">Notifications & Broadcast Center</h1>
          <p className="text-xs text-emerald-200 mt-1">
            Official system alerts, executive meeting reminders, and passbook posting dispatches.
          </p>
        </div>

        <button
          onClick={onMarkAllRead}
          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Check className="w-4 h-4 font-black" />
          Mark All as Read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => {
          const style = getStyleForNotification(n.type, n.isRead);
          return (
            <div
              key={n.id}
              className={`p-4 rounded-xl flex items-start gap-4 transition-all ${style.container}`}
            >
              {style.icon}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`font-black text-sm sm:text-base truncate ${style.titleColor}`}>
                    {n.title}
                  </h3>
                  <span className={`text-xs font-bold shrink-0 ${style.timeColor}`}>{n.createdAt}</span>
                </div>
                <p className={`text-sm sm:text-base font-extrabold mt-1 leading-relaxed ${style.bodyColor}`}>
                  {n.message}
                </p>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => onMarkRead(n.id)}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 shrink-0 cursor-pointer shadow-sm"
                >
                  Mark Read
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
