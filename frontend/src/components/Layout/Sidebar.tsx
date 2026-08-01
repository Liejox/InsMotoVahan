import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  ShieldAlert,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserAvatar } from '../ui/UserAvatar';
import api from '../../services/api';
import LineSidebar from '../ui/LineSidebar';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearAuth, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Customers', path: '/customers' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Profile Settings', path: '/profile' },
  ];

  // Compute which nav item index is currently active based on the route
  const activeNavIndex = navItems.findIndex(item => {
    if (item.path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(item.path);
  });

  return (
    <>
      {/* Mobile Sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white">
              <ShieldAlert size={20} />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              My Ins <span className="text-brand-600 dark:text-brand-400">Monitor</span>
            </span>
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* User profile brief */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center space-x-3 group"
          >
            <UserAvatar size="md" />
            <div className="overflow-hidden flex-1">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {user?.fullName || 'User'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user?.role?.toLowerCase() || 'agent'}
              </p>
            </div>
          </Link>
        </div>

        {/* Sidebar Navigation — LineSidebar with proximity effect */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <LineSidebar
            items={navItems.map(item => item.name)}
            accentColor="#638acc"
            textColor="#64748b"
            markerColor="#334155"
            showIndex={false}
            showMarker={true}
            proximityRadius={90}
            maxShift={14}
            falloff="smooth"
            markerLength={28}
            markerGap={8}
            tickScale={0.5}
            scaleTick={true}
            itemGap={4}
            fontSize={0.875}
            smoothing={120}
            defaultActive={activeNavIndex >= 0 ? activeNavIndex : null as any}
            onItemClick={(_index: number, label: string) => {
              const item = navItems.find(n => n.name === label);
              if (item) {
                navigate(item.path);
                setIsOpen(false);
              }
            }}
            className="sidebar-line-nav"
          />
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
          >
            <LogOut size={20} className="mr-3 text-red-500 dark:text-red-400" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
