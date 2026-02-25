/**
 * OnboardingPage - Collects style preferences for new users
 *
 * Shown after signup when the user hasn't completed their profile.
 * Required before accessing the main app.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import ProfileForm from '../components/ProfileForm';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { refetchProfile } = useProfile();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values) {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }

      await refetchProfile();
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page onboarding-page">
      <div className="auth-card onboarding-card">
        <h1>Welcome to StyleAi</h1>
        <p className="auth-subtitle">
          Help us personalize your experience. Tell us about your style.
        </p>

        <ProfileForm
          profile={null}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Get Started"
        />
      </div>
    </div>
  );
}
