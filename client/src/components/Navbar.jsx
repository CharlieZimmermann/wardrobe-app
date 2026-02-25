/**
 * Navbar - Navigation between main app pages
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/outfit-of-the-day', label: 'Outfit of the Day' },
  { to: '/wardrobe', label: 'Wardrobe' },
  { to: '/upload', label: 'Upload' },
  { to: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, supabase } = useAuth();

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    }
  }

  return (
    <nav className="navbar">
      <NavLink to="/dashboard" className="navbar-brand">
        StyleAi
      </NavLink>
      <ul className="navbar-links">
        {navItems.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) => (isActive ? 'navbar-link active' : 'navbar-link')}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="navbar-user">
        <span className="navbar-email">{user?.email}</span>
        <button onClick={handleLogout} className="navbar-logout">
          Log out
        </button>
      </div>
    </nav>
  );
}
