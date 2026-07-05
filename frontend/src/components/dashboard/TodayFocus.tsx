import React from 'react';

interface TodayFocusProps {
  stats?: {
    todayRenewalsCount: number;
    tomorrowRenewalsCount: number;
  } | null;
}

export const TodayFocus: React.FC<TodayFocusProps> = ({ stats }) => {
  const todayCount = stats?.todayRenewalsCount ?? 0;
  const tomorrowCount = stats?.tomorrowRenewalsCount ?? 0;

  const getFocusItems = () => {
    const items: React.ReactNode[] = [];

    if (todayCount > 0) {
      items.push(
        <div key="today" className="flex items-center space-x-2.5 text-sm text-slate-300 font-medium">
          <span className="text-base">🎯</span>
          <span>Today you have <strong className="text-white font-extrabold">{todayCount}</strong> renewal{todayCount > 1 ? 's' : ''}.</span>
        </div>
      );
      items.push(
        <div key="contact" className="flex items-center space-x-2.5 text-sm text-slate-300 font-medium">
          <span className="text-base">📞</span>
          <span>Contact <strong className="text-white font-extrabold">{todayCount}</strong> customer{todayCount > 1 ? 's' : ''} to secure payments.</span>
        </div>
      );
    } else {
      items.push(
        <div key="no-renewals" className="flex items-center space-x-2.5 text-sm text-slate-300 font-medium">
          <span className="text-base">✅</span>
          <span>No renewals today. Great job!</span>
        </div>
      );
    }

    if (tomorrowCount > 0) {
      items.push(
        <div key="tomorrow" className="flex items-center space-x-2.5 text-sm text-slate-300 font-medium">
          <span className="text-base">🚗</span>
          <span><strong className="text-white font-extrabold">{tomorrowCount}</strong> polic{tomorrowCount > 1 ? 'ies' : 'y'} expire{tomorrowCount > 1 ? 's' : ''} tomorrow.</span>
        </div>
      );
    }

    return items;
  };

  return (
    <div className="space-y-2 mt-2 bg-slate-900/60 dark:bg-slate-950/30 border border-slate-800/40 rounded-2xl p-4.5 max-w-xl transition-colors duration-200">
      <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-1.5">Today's Focus</h3>
      <div className="space-y-2.5">
        {getFocusItems()}
      </div>
    </div>
  );
};

export default React.memo(TodayFocus);
