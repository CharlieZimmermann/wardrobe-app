/**
 * ProtectedRoute - Wraps routes that require authentication
 *
 * If the user is not logged in, redirects to /login.
 * Shows a loading state while we check the session.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login, but remember where they tried to go
    // so we can send them back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
