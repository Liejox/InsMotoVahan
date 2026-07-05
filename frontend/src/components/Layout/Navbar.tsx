import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, Bell, Menu, User, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, clearAuth, user } = useAuthStore();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    customers: any[];
    vehicles: any[];
    policies: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive title from location path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/customers/')) return 'Customer Profile';
    if (path.startsWith('/customers')) return 'Customer Database';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/notifications')) return 'System Notifications';
    return 'Insurance Agent CRM';
  };

  // Close search dropdown and profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread notification counts
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await api.get<{ data: { notifications: any[] } }>('/notifications');
        const unread = res.data.notifications.filter((n) => !n.read).length;
        setUnreadNotifications(unread);
      } catch (err) {
        // Fail silently
      }
    };
    fetchNotificationCount();
    // Poll notifications count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Instant global search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const res = await api.get<{
          data: {
            customers: any[];
            vehicles: any[];
            policies: any[];
          };
        }>(`/policies/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
      } catch (error) {
        console.error('Global search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultClick = (customerId: string) => {
    setSearchQuery('');
    setShowDropdown(false);
    navigate(`/customers/${customerId}`);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800">
      {/* Page Title & Hamburger */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white lg:block hidden">
          {getPageTitle()}
        </h1>
      </div>

      {/* Global Instant Search */}
      <div className="relative flex-1 max-w-md mx-6" ref={dropdownRef}>
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer, phone, vehicle plate, policy number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowDropdown(true)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          {isSearching && (
            <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-brand-600" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults && (
          <div className="absolute right-0 left-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-[420px] overflow-y-auto animate-fade-in">
            {/* Empty State */}
            {searchResults.customers.length === 0 &&
              searchResults.vehicles.length === 0 &&
              searchResults.policies.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No records match "{searchQuery}"
                </div>
              )}

            {/* Customers Section */}
            {searchResults.customers.length > 0 && (
              <div className="p-3 border-b border-slate-100 dark:border-slate-800/60">
                <h4 className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Customers</h4>
                <div className="space-y-0.5">
                  {searchResults.customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleResultClick(c.id)}
                      className="flex items-center justify-between w-full px-3 py-2 text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {c.fullName}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                            c.policyStatus === 'Active'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}>
                            {c.policyStatus || 'Expired'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{c.mobileNumber}</div>
                      </div>
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicles Section */}
            {searchResults.vehicles.length > 0 && (
              <div className="p-3 border-b border-slate-100 dark:border-slate-800/60">
                <h4 className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicles</h4>
                <div className="space-y-0.5">
                  {searchResults.vehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleResultClick(v.customerId)}
                      className="flex items-center justify-between w-full px-3 py-2 text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            {v.vehicleNumber}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                            v.policyStatus === 'Active'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}>
                            {v.policyStatus || 'Expired'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {v.brand} {v.model} • Owner: {v.customer.fullName}
                        </div>
                      </div>
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Policies Section */}
            {searchResults.policies.length > 0 && (
              <div className="p-3">
                <h4 className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Policies</h4>
                <div className="space-y-0.5">
                  {searchResults.policies.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleResultClick(p.vehicle.customerId)}
                      className="flex items-center justify-between w-full px-3 py-2 text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            {p.policyNumber}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                            p.policyStatus === 'Active'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}>
                            {p.policyStatus || 'Expired'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {p.company.name} • Insured: {p.vehicle.customer.fullName}
                        </div>
                      </div>
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Navbar actions */}
      <div className="flex items-center space-x-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications toggle */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="View notifications"
        >
          <Bell size={20} />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4.5 h-4.5 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>

        {/* Profile indicator */}
        <div className="relative flex items-center pl-2 border-l border-slate-200 dark:border-slate-800" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="User menu"
          >
            <User size={16} />
          </button>
          
          {showProfileMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Signed in as</p>
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user?.fullName || 'Agent'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-xs font-bold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 text-left transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
