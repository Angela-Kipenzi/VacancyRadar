import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AppProvider, useApp } from '../context/AppContext';
import { Toaster } from './components/ui/sonner';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';

// Dashboard Layout
import DashboardLayout from './layouts/DashboardLayout';

// Dashboard Pages
import DashboardHome from './pages/DashboardHome';
import PropertiesPage from './pages/PropertiesPage';
import PropertyFormPage from './pages/PropertyFormPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import UnitsPage from './pages/UnitsPage';
import UnitFormPage from './pages/UnitFormPage';
import UnitDetailPage from './pages/UnitDetailPage';
import QRCodesPage from './pages/QRCodesPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import LeasesPage from './pages/LeasesPage';
import TenantsPage from './pages/TenantsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          
          {/* Properties */}
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/new" element={<PropertyFormPage />} />
          <Route path="properties/:id" element={<PropertyDetailPage />} />
          <Route path="properties/:id/edit" element={<PropertyFormPage />} />
          
          {/* Units */}
          <Route path="units" element={<UnitsPage />} />
          <Route path="units/new" element={<UnitFormPage />} />
          <Route path="units/:id" element={<UnitDetailPage />} />
          <Route path="units/:id/edit" element={<UnitFormPage />} />
          
          {/* QR Codes */}
          <Route path="qr-codes" element={<QRCodesPage />} />
          
          {/* Applications */}
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
          
          {/* Leases */}
          <Route path="leases" element={<LeasesPage />} />
          
          {/* Tenants */}
          <Route path="tenants" element={<TenantsPage />} />
          
          {/* Analytics */}
          <Route path="analytics" element={<AnalyticsPage />} />
          
          {/* Notifications */}
          <Route path="notifications" element={<NotificationsPage />} />
          
          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
