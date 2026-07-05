import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { CustomerList } from './pages/CustomerList';
import { CustomerProfile } from './pages/CustomerProfile';
import { Reports } from './pages/Reports';
import { Notifications } from './pages/Notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Gate */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Secure Admin/Agent Portal */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerProfile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
export default App;
