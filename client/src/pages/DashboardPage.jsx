/**
 * DashboardPage - Main landing page for logged-in users
 *
 * Will eventually display wardrobe items and outfit suggestions.
 * For now, shows a welcome message and logout button.
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, supabase } = useAuth();

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>StyleAi</h1>
        <div className="dashboard-header-right">
          <span className="dashboard-email">{user?.email}</span>
          <button onClick={handleLogout} className="logout-button">
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <h2>Welcome back</h2>
        <p className="dashboard-intro">
          Your wardrobe and outfit suggestions will appear here.
        </p>
      </main>
    </div>
  );
}
