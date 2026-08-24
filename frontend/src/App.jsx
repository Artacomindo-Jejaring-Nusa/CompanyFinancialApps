import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Layout & Pages
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PaymentMonitoringPage from './pages/PaymentMonitoringPage';
import VendorInvoicesPage from './pages/VendorInvoicesPage';
import ServicesPage from './pages/ServicesPage';
import MasterDataPage from './pages/MasterDataPage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogsPage from './pages/AuditLogsPage';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, hasRole } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="invoices" element={<VendorInvoicesPage />} />
          <Route path="payments" element={<PaymentMonitoringPage />} />
          
          {/* Services Category Routes */}
          <Route path="services" element={<ServicesPage defaultCategory="ALL" />} />
          <Route path="services/internet" element={<ServicesPage defaultCategory="INTERNET" />} />
          <Route path="services/hosting" element={<ServicesPage defaultCategory="HOSTING" />} />
          <Route path="services/software" element={<ServicesPage defaultCategory="SOFTWARE" />} />

          <Route path="master-data" element={<MasterDataPage />} />
          <Route path="reports" element={<ReportsPage />} />

          <Route
            path="users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="audit-logs"
            element={
              <ProtectedRoute roles={['admin', 'finance_supervisor', 'finance_manager', 'auditor']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
