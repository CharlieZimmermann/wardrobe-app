/**
 * DashboardPage - Main landing page for logged-in users
 *
 * Welcomes the user by name and provides an overview.
 */

import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  // Use name from metadata, or the part before @ in email, or fallback
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'there';

  return (
    <div className="page">
      <h1>Welcome, {displayName}</h1>
      <p className="page-intro">
        Manage your wardrobe and get outfit suggestions tailored to your style.
      </p>
    </div>
  );
}
