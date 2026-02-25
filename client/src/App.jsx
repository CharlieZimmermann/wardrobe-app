/**
 * StyleAi - Main App
 *
 * Routes:
 * - /login, /signup: Auth pages (redirect to dashboard if already logged in)
 * - /onboarding: New user setup (required before main app)
 * - /dashboard, /outfit-of-the-day, /wardrobe, /upload, /settings: Protected - wrapped with Navbar
 * - /: Redirects based on auth state
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useProfile } from './contexts/ProfileContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import WardrobePage from './pages/WardrobePage';
import UploadPage from './pages/UploadPage';
import OutfitOfTheDayPage from './pages/OutfitOfTheDayPage';
import SettingsPage from './pages/SettingsPage';

function AppRoutes() {
  const { user, loading } = useAuth();
  const { needsOnboarding, loading: profileLoading } = useProfile();

  if (loading || (user && profileLoading)) {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Redirect root: logged out -> login; logged in + needs onboarding -> onboarding; else -> dashboard */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : needsOnboarding && !profileLoading ? (
            <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* Auth pages - redirect to dashboard (or onboarding) if already logged in */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={needsOnboarding && !profileLoading ? '/onboarding' : '/dashboard'} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/signup"
        element={
          user ? (
            <Navigate to={needsOnboarding && !profileLoading ? '/onboarding' : '/dashboard'} replace />
          ) : (
            <SignupPage />
          )
        }
      />

      {/* Onboarding - new users must complete before accessing app */}
      <Route
        path="/onboarding"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : needsOnboarding || profileLoading ? (
            <OnboardingPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* Protected routes - layout with Navbar; redirect to onboarding if new user */}
      <Route
        element={
          <ProtectedRoute>
            {needsOnboarding && !profileLoading ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <AppLayout />
            )}
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="wardrobe" element={<WardrobePage />} />
        <Route path="outfit-of-the-day" element={<OutfitOfTheDayPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

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
