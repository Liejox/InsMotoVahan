import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { FileBarChart2, TrendingUp, Shield, Car, Loader2 } from 'lucide-react';
import api from '../services/api';

export const Reports: React.FC = () => {
  // 1. Fetch Company Distributions
  const { data: companies, isLoading: loadingCompanies } = useQuery<any[]>({
    queryKey: ['reportCompanies'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/reports/companies');
      return res.data;
    },
  });

  // 2. Fetch Vehicle Type Stats
  const { data: vehicles, isLoading: loadingVehicles } = useQuery<any[]>({
    queryKey: ['reportVehicles'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/reports/vehicles');
      return res.data;
    },
  });

  // 3. Fetch Monthly Renewal Volume
  const { data: renewals, isLoading: loadingRenewals } = useQuery<any>({
    queryKey: ['reportRenewals'],
    queryFn: async () => {
      const res = await api.get<{ data: { monthlyRenewals: any[] } }>('/reports/renewals');
      return res.data;
    },
  });

  // 4. Fetch Financial Performance
  const { data: financials, isLoading: loadingFinancials } = useQuery<any[]>({
    queryKey: ['reportFinancials'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/reports/financials');
      return res.data;
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const COLORS = ['#406ab8', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

  const isLoading = loadingCompanies || loadingVehicles || loadingRenewals || loadingFinancials;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Business Intelligence Reports</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Data-driven performance analysis across premiums and policies</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
          <span className="text-sm text-slate-500">Compiling report analytics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Chart 1: Revenue Trends */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center space-x-2.5 mb-6">
              <TrendingUp size={20} className="text-brand-600 dark:text-brand-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Revenue & Commission Growth</h3>
            </div>
            <div className="h-72">
              {financials && financials.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financials} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(Number(value))]}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                    <Bar dataKey="revenue" name="Premium volume" fill="#406ab8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="commission" name="Commission volume" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">No data found</div>
              )}
            </div>
          </div>

          {/* Chart 2: Company Distribution */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center space-x-2.5 mb-6">
              <Shield size={20} className="text-brand-600 dark:text-brand-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Insurance Providers Distribution</h3>
            </div>
            <div className="h-72">
              {companies && companies.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={companies} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis dataKey="companyName" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={100} />
                    <Tooltip 
                      formatter={(value: any, name: any) => [name === 'totalPremium' ? formatCurrency(Number(value)) : value, name === 'totalPremium' ? 'Total Premium' : 'Policies issued']}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} 
                    />
                    <Bar dataKey="policyCount" name="Policies count" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">No policies registered</div>
              )}
            </div>
          </div>

          {/* Chart 3: Monthly Renewals Projection */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center space-x-2.5 mb-6">
              <FileBarChart2 size={20} className="text-brand-600 dark:text-brand-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Renewal Pipeline (Calendar Year)</h3>
            </div>
            <div className="h-72">
              {renewals?.monthlyRenewals && renewals.monthlyRenewals.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={renewals.monthlyRenewals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      formatter={(value: any, name: any) => [name === 'volume' ? formatCurrency(Number(value)) : value, name === 'volume' ? 'Expiring volume' : 'Policies expiring']}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                    <Bar dataKey="count" name="Expiring Policies" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="volume" name="Premium Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">No renewals found</div>
              )}
            </div>
          </div>

          {/* Chart 4: Vehicle Type statistics */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center space-x-2.5 mb-6">
              <Car size={20} className="text-brand-600 dark:text-brand-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Vehicle Category Statistics</h3>
            </div>
            <div className="h-72 flex items-center justify-center">
              {vehicles && vehicles.length > 0 ? (
                <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-6">
                  {/* Pie chart */}
                  <div className="w-full md:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vehicles}
                          dataKey="count"
                          nameKey="vehicleType"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {vehicles.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Stats list */}
                  <div className="w-full md:w-1/2 space-y-2">
                    {vehicles.map((v, i) => (
                      <div key={v.vehicleType} className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                          <span className="font-semibold text-slate-700 dark:text-slate-350 capitalize">{v.vehicleType.toLowerCase()}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{v.count} {v.count === 1 ? 'vehicle' : 'vehicles'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-sm">No vehicles registered in database</div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
export default Reports;
