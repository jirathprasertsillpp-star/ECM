import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

import Layout from './components/Layout/Layout';
import SplashScreen from './components/common/SplashScreen';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyClaims from './pages/MyClaims';
import NewClaim from './pages/NewClaim';
import ClaimDetail from './pages/ClaimDetail';
import FuelFormPage from './pages/FuelFormPage';
import ApprovalQueue from './pages/ApprovalQueue';
import Reports from './pages/Reports';
import EmailScanner from './pages/EmailScanner';
import Settings from './pages/Settings';
import LineLink from './pages/LineLink';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: 'none',
            borderRadius: '24px',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            boxShadow: '0 40px 100px -20px rgba(15, 23, 42, 0.15)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            padding: '20px 32px',
          },
          success: { 
            iconTheme: { primary: '#10b981', secondary: 'white' },
          },
          error: { 
            iconTheme: { primary: '#ef4444', secondary: 'white' },
          }
        }}
      />
      <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="claims/my" element={<MyClaims />} />
          <Route path="claims/new" element={<NewClaim />} />
          <Route path="claims/:id/edit" element={<NewClaim />} />
          <Route path="claims/:id" element={<ClaimDetail />} />
          <Route path="fuel" element={<FuelFormPage />} />
          <Route path="fuel/:itemId" element={<FuelFormPage />} />
          <Route path="approval" element={<ApprovalQueue />} />
          <Route path="reports" element={<Reports />} />
          <Route path="email-scanner" element={<EmailScanner />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="line-link" element={<LineLink />} />
        </Route>
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
