import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { ShieldAlert, Key, Mail, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, accessToken } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Gate check: If already logged in, skip login page
  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post<{
        data: {
          accessToken: string;
          refreshToken: string;
          user: { id: string; email: string; fullName: string; role: string };
        };
      }>('/auth/login', { email, password });

      const { user, accessToken: access, refreshToken: refresh } = res.data;
      setAuth(user, access, refresh);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-brand-900 via-slate-900 to-brand-950 p-4">
      {/* Background radial effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-800/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo Banner */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/25 mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            SecureShield CRM
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Production Insurance Agent Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-6">
            Agent Sign In
          </h3>

          {error && (
            <div className="p-3 mb-5 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="agent@crm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 text-sm bg-slate-950 text-white border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 text-sm bg-slate-950 text-white border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full h-11 mt-6 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800/50 rounded-xl shadow-lg shadow-brand-600/15 hover:shadow-brand-600/25 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : null}
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-500">
              New agent?{' '}
              <Link to="/register" className="text-brand-400 hover:underline font-semibold">
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
