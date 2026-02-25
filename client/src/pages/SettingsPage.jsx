/**
 * SettingsPage - Update style preferences at any time
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import ProfileForm from '../components/ProfileForm';

export default function SettingsPage() {
  const { session } = useAuth();
  const { profile, refetchProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(values) {
    if (!session?.access_token) return;

    setLoading(true);
    setSuccess(false);
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
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="page-intro">
        Update your style preferences, sizing, and budget for personalized recommendations.
      </p>

      {success && (
        <div className="settings-success">Your preferences have been saved.</div>
      )}

      <ProfileForm
        profile={profile}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="Save Changes"
      />
    </div>
  );
}
