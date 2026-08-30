import React, { useState, useEffect } from 'react';
import { 
  Bell, X, CheckCheck, ArrowDownLeft, ArrowUpRight, 
  Send, Lock, UserCheck, ShieldAlert, Clock
} from 'lucide-react';
import { NotificationItem } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const NotificationCenter: React.FC = () => {
  const { isNotificationCenterOpen, setIsNotificationCenterOpen, refreshUserData } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isNotificationCenterOpen) {
      fetchNotifications();
    }
  }, [isNotificationCenterOpen]);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshUserData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await api.markNotificationsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      refreshUserData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isNotificationCenterOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Bell className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-white">Notifications</h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleMarkAllRead}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-emerald-400 px-2 py-1 rounded bg-slate-800/80 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark Read</span>
              </button>
              <button
                onClick={() => setIsNotificationCenterOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No notifications yet.</div>
            ) : (
              notifications.map((n) => {
                const getIcon = () => {
                  switch (n.type) {
                    case 'DEPOSIT':
                      return <ArrowDownLeft className="h-4 w-4 text-emerald-400" />;
                    case 'WITHDRAWAL':
                      return <ArrowUpRight className="h-4 w-4 text-amber-400" />;
                    case 'TRANSFER':
                      return <Send className="h-4 w-4 text-blue-400" />;
                    case 'SECURITY':
                      return <Lock className="h-4 w-4 text-purple-400" />;
                    case 'KYC':
                      return <UserCheck className="h-4 w-4 text-cyan-400" />;
                    default:
                      return <ShieldAlert className="h-4 w-4 text-slate-400" />;
                  }
                };

                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkSingleRead(n.id)}
                    className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      n.read
                        ? 'bg-slate-950/60 border-slate-800/60 text-slate-400'
                        : 'bg-slate-950 border-slate-700 text-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                        {getIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-semibold truncate ${n.read ? 'text-slate-300' : 'text-white'}`}>
                            {n.title}
                          </h4>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0"></span>}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono mt-2 block flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(n.createdAt).toLocaleTimeString()} • {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
