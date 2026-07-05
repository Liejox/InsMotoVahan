import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  AlertTriangle, 
  ShieldAlert, 
  PlusCircle, 
  Loader2
} from 'lucide-react';
import api from '../services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string; // NEW_POLICY, UPCOMING_RENEWAL, EXPIRED_POLICY
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export const Notifications: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Fetch Notifications
  const { data: notifsData, isLoading } = useQuery<{ notifications: Notification[] }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get<{ data: { notifications: Notification[] } }>('/notifications');
      return res.data;
    },
  });

  // 2. Mark single as read
  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 3. Mark all as read
  const readAllMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getNotifStyles = (type: string, read: boolean) => {
    let icon = Bell;
    let color = 'text-slate-500 bg-slate-100 dark:bg-slate-800';

    if (type === 'NEW_POLICY') {
      icon = PlusCircle;
      color = read 
        ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
        : 'text-emerald-600 bg-emerald-100/50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/20';
    } else if (type === 'UPCOMING_RENEWAL') {
      icon = AlertTriangle;
      color = read 
        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' 
        : 'text-amber-600 bg-amber-100/50 dark:bg-amber-900/20 ring-2 ring-brand-500/20';
    } else if (type === 'EXPIRED_POLICY') {
      icon = ShieldAlert;
      color = read 
        ? 'text-red-500 bg-red-50 dark:bg-red-950/20' 
        : 'text-red-600 bg-red-100/50 dark:bg-red-900/20 ring-2 ring-red-500/20';
    }

    return { icon, color };
  };

  const hasUnread = notifsData?.notifications.some((n) => !n.read) ?? false;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notification Feed</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Audit log of system processes and renewal milestones</p>
        </div>

        {hasUnread && (
          <button
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            className="flex items-center text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950/25 px-3 py-1.5 rounded-xl hover:shadow-sm disabled:opacity-40 transition-colors"
          >
            {readAllMutation.isPending ? (
              <Loader2 className="animate-spin mr-1.5" size={13} />
            ) : (
              <CheckCheck size={14} className="mr-1.5" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-72">
          <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
          <span className="text-sm text-slate-500">Checking for alerts...</span>
        </div>
      ) : !notifsData || notifsData.notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Bell size={40} className="text-slate-300 dark:text-slate-700 mb-3" />
          <span className="text-sm font-semibold text-slate-500">No notifications yet</span>
          <p className="text-xs text-slate-400 mt-1">Active alerts will populate here as database records expire.</p>
        </div>
      ) : (
        <div className="space-y-3.5 animate-fade-in">
          {notifsData.notifications.map((n) => {
            const { icon: Icon, color } = getNotifStyles(n.type, n.read);
            
            return (
              <div 
                key={n.id} 
                className={`
                  p-4 bg-white dark:bg-slate-900 border rounded-2xl flex items-start justify-between gap-4 transition-all
                  ${n.read 
                    ? 'border-slate-200 dark:border-slate-800 opacity-75' 
                    : 'border-slate-300 dark:border-slate-700 shadow-sm'}
                `}
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${n.read ? 'text-slate-700 dark:text-slate-350' : 'text-slate-950 dark:text-white'}`}>
                      {n.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                      {new Date(n.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => readMutation.mutate(n.id)}
                    disabled={readMutation.isPending}
                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default Notifications;
