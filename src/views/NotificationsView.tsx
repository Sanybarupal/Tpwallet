import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCheck, ArrowDownLeft, ArrowUpRight, 
  Send, Lock, UserCheck, ShieldAlert, Clock, RefreshCw, 
  Check
} from 'lucide-react';
import { NotificationItem } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const NotificationsView: React.FC = () => {
  const { refreshUserData, triggerHaptic } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'TX' | 'SECURITY' | 'SYSTEM'>('ALL');

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
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    triggerHaptic();
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshUserData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    triggerHaptic();
    try {
      await api.markNotificationsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      refreshUserData();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="h-4 w-4 text-[#03b875]" />;
      case 'WITHDRAWAL':
        return <ArrowUpRight className="h-4 w-4 text-amber-500" />;
      case 'TRANSFER':
        return <Send className="h-4 w-4 text-[#2980fe]" />;
      case 'KYC':
        return <UserCheck className="h-4 w-4 text-purple-600" />;
      case 'SECURITY':
        return <Lock className="h-4 w-4 text-rose-500" />;
      case 'SYSTEM':
      default:
        return <Bell className="h-4 w-4 text-[#8a93a6]" />;
    }
  };

  const filtered = notifications.filter((item) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'TX') {
      return item.type === 'DEPOSIT' || item.type === 'WITHDRAWAL' || item.type === 'TRANSFER';
    }
    if (activeTab === 'SECURITY') {
      return item.type === 'SECURITY' || item.type === 'KYC';
    }
    if (activeTab === 'SYSTEM') {
      return item.type === 'SYSTEM';
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[#2980fe]">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1e2024]">Notification Alerts</h2>
            <p className="text-[10px] text-[#8a93a6] font-mono">
              {unreadCount > 0 ? `${unreadCount} unread messages` : 'All alerts caught up'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-[#2980fe] hover:text-[#2268d1] p-1.5 px-2 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Read All</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              fetchNotifications();
            }}
            className="p-2 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#1e2024] transition-colors cursor-pointer shadow-xs"
            title="Refresh alerts"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-[#f7f8fa] p-1 rounded-2xl border border-[#e5e7eb]">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'TX', label: 'Transfers' },
          { id: 'SECURITY', label: 'Security' },
          { id: 'SYSTEM', label: 'System' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                triggerHaptic();
                setActiveTab(tab.id as any);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white text-[#2980fe] shadow-xs'
                  : 'text-[#8a93a6] hover:text-[#1e2024]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notification Items List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#e5e7eb] p-10 text-center space-y-2 shadow-xs">
            <Bell className="h-8 w-8 text-[#8a93a6] mx-auto" />
            <p className="text-xs text-[#6b7280] font-medium">No alerts in this category</p>
            <p className="text-[10px] text-[#8a93a6]">Real-time deposit and ledger notifications will appear here</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.read && handleMarkSingleRead(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                !item.read
                  ? 'bg-[#f0f4ff]/60 border-[#2980fe]/30 shadow-xs'
                  : 'bg-white border-[#e5e7eb] hover:border-[#d1d5db]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f8fa] border border-[#e5e7eb] shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-[#1e2024]">{item.title}</h4>
                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-[#2980fe] inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">{item.message}</p>
                    <div className="flex items-center space-x-1 mt-2 text-[10px] text-[#8a93a6] font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!item.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkSingleRead(item.id);
                    }}
                    className="p-1 rounded-lg text-[#8a93a6] hover:text-[#2980fe] cursor-pointer"
                    title="Mark read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
