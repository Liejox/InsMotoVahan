import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Bell, 
  LogOut, 
  ShieldAlert,
  X 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { clearAuth, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      clearAuth();
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

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
          <Link to="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
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
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 font-bold rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                {user?.fullName || 'User'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user?.role?.toLowerCase() || 'agent'}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 group
                  ${active 
                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}
                `}
              >
                <Icon size={20} className={`
                  mr-3 transition-colors
                  ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'}
                `} />
                {item.name}
              </Link>
            );
          })}
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
