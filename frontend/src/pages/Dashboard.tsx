import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Users, 
  Car, 
  Shield, 
  Clock, 
  AlertTriangle,
  MessageCircle,
  Plus,
  Loader2
} from 'lucide-react';

import api from '../services/api';
import HeroWelcome from '../components/dashboard/HeroWelcome';

interface DashboardStats {
  todayRenewalsCount: number;
  tomorrowRenewalsCount: number;
  next7DaysRenewalsCount: number;
  next15DaysRenewalsCount: number;
  next30DaysRenewalsCount: number;
  expiredPoliciesCount: number;
  totalCustomers: number;
  totalVehicles: number;
  activePolicies: number;
  monthlyRevenue: number;
  monthlyCommission: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState<'today' | 'tomorrow' | '7days' | '15days' | '30days' | 'expired'>('30days');

  // 1. Fetch Dynamic Dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardStats }>('/policies/dashboard');
      return res.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // 2. Fetch Expiring/Expired policies list
  const { data: policiesData, isLoading: listLoading } = useQuery<{ policies: any[] }>({
    queryKey: ['upcomingPolicies', selectedRange],
    queryFn: async () => {
      const res = await api.get<{ data: { policies: any[] } }>(`/policies/upcoming?range=${selectedRange}`);
      return res.data;
    },
  });





  const getWhatsAppLink = (policy: any) => {
    const customer = policy.vehicle.customer;
    const vehicle = policy.vehicle;
    const company = policy.company;
    const expiry = new Date(policy.expiryDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const message = `Hi ${customer.fullName}, your ${vehicle.brand} ${vehicle.model} (${vehicle.vehicleNumber}) insurance with ${company.name} is expiring on ${expiry}. Let me know if you would like to renew. Thanks!`;
    const phone = customer.whatsappNumber || customer.mobileNumber;
    
    return `https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(message)}`;
  };

  const dashboardCards = [
    { 
      title: "Total Customers", 
      value: stats?.totalCustomers ?? 0, 
      icon: Users, 
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
      onClick: () => navigate('/customers')
    },
    { 
      title: "Total Vehicles", 
      value: stats?.totalVehicles ?? 0, 
      icon: Car, 
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400",
      onClick: () => navigate('/customers')
    },
    { 
      title: "Active Policies", 
      value: stats?.activePolicies ?? 0, 
      icon: Shield, 
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400" 
    },
    { 
      title: "Today's Renewals", 
      value: stats?.todayRenewalsCount ?? 0, 
      icon: Calendar, 
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400",
      onClick: () => setSelectedRange('today')
    },
    { 
      title: "Tomorrow's Renewals", 
      value: stats?.tomorrowRenewalsCount ?? 0, 
      icon: Clock, 
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400",
      onClick: () => setSelectedRange('tomorrow')
    },
    { 
      title: "Expired Policies", 
      value: stats?.expiredPoliciesCount ?? 0, 
      icon: AlertTriangle, 
      color: "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
      onClick: () => setSelectedRange('expired')
    },
  ];

  const ranges = [
    { key: 'today', label: `Today (${stats?.todayRenewalsCount ?? 0})` },
    { key: 'tomorrow', label: `Tomorrow (${stats?.tomorrowRenewalsCount ?? 0})` },
    { key: '7days', label: `7 Days (${stats?.next7DaysRenewalsCount ?? 0})` },
    { key: '15days', label: `15 Days (${stats?.next15DaysRenewalsCount ?? 0})` },
    { key: '30days', label: `30 Days (${stats?.next30DaysRenewalsCount ?? 0})` },
    { key: 'expired', label: `Expired (${stats?.expiredPoliciesCount ?? 0})` },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Section */}
      <HeroWelcome stats={stats} />

      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real-time business stats and renewal center</p>
        </div>
        <button
          onClick={() => navigate('/customers?create=true')}
          className="flex items-center justify-center px-4.5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/10 hover:shadow-brand-600/20 transition-all cursor-pointer"
        >
          <Plus size={18} className="mr-2" />
          New Policy Booking
        </button>
      </div>

      {/* Grid of 6 Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              onClick={card.onClick}
              className={`p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${card.onClick ? 'cursor-pointer hover:border-brand-500/30 dark:hover:border-brand-500/30' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-4">
                {statsLoading ? (
                  <span className="h-6 w-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded block"></span>
                ) : (
                  card.value
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lower Dashboard Section: Full Width */}
      <div className="w-full">
        
        {/* Active Renewal Monitor */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col">
          <div className="mb-5">
            <h3 className="font-bold text-slate-900 dark:text-white">Active Renewal Monitor</h3>
            <p className="text-xs text-slate-500 mt-0.5">Send instant WhatsApp alerts for expiring policies</p>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-x-auto scrollbar-none mb-4.5">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setSelectedRange(r.key as any)}
                className={`
                  flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer
                  ${selectedRange === r.key 
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'}
                `}
              >
                {r.label.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* List panel */}
          <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3">
            {listLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="animate-spin text-brand-600" size={24} />
              </div>
            ) : !policiesData || policiesData.policies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-600">
                <Clock size={32} className="mb-2" />
                <span className="text-xs">No policies expiring in this range</span>
              </div>
            ) : (
              policiesData.policies.map((p) => {
                const customer = p.vehicle.customer;
                const vehicle = p.vehicle;
                const daysRemaining = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={p.id} className="p-3 border border-slate-100 dark:border-slate-800/80 rounded-xl hover:border-slate-200 dark:hover:border-slate-700/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors">{customer.fullName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{vehicle.vehicleNumber} • {vehicle.brand} {vehicle.model}</p>
                      </div>
                      
                      {/* Alert badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        daysRemaining < 0 
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                          : daysRemaining <= 1
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {daysRemaining < 0 ? 'Expired' : daysRemaining === 0 ? 'Today' : daysRemaining === 1 ? '1 Day' : `${daysRemaining} Days`}
                      </span>
                    </div>

                    <div className="flex items-center justify-end mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/40">
                      <div className="flex space-x-1.5">
                        {/* WhatsApp trigger */}
                        {daysRemaining <= 3 && (
                          <a
                            href={getWhatsAppLink(p)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                        
                        {/* Renew policy route */}
                        <button
                          onClick={() => navigate(`/customers/${customer.id}?renew=${p.id}`)}
                          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Renew
                        </button>
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
export default Dashboard;
