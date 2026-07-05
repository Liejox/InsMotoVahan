import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuthStore } from '../../store/authStore';

export const Layout: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth gate: redirect to login if no access token exists
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar Panel */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Container */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default Layout;
