/**
 * StyleAi - Main App
 *
 * Routes:
 * - /login, /signup: Auth pages (redirect to dashboard if already logged in)
 * - /dashboard: Protected - shows wardrobe and outfit features
 * - /: Redirects based on auth state
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Redirect root to dashboard if logged in, otherwise to login */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />

      {/* Auth pages - redirect to dashboard if already logged in */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />}
      />

      {/* Protected routes - require login */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all: redirect to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
