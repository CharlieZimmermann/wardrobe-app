/**
 * OutfitOfTheDayPage - Generates and displays AI-suggested outfit of the day
 *
 * Calls the backend to generate an outfit from the user's wardrobe based on
 * color theory, layering, proportion, and current weather.
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import OutfitDisplay from '../components/OutfitDisplay';

export default function OutfitOfTheDayPage() {
  const { session } = useAuth();
  const [city, setCity] = useState('London');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [outfit, setOutfit] = useState(null);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);
    setOutfit(null);

    try {
      const res = await fetch(
        `/api/outfits/generate?city=${encodeURIComponent(city.trim() || 'London')}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(res.ok ? 'Invalid response from server' : text || 'Server error');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate outfit');
      }

      setOutfit(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Outfit of the Day</h1>
      <p className="page-intro">
        Get a complete outfit suggestion from your wardrobe using color theory, layering principles,
        and proportion rules—tailored to the current weather.
      </p>

      <form onSubmit={handleGenerate} className="outfit-form">
        <div className="outfit-form-row">
          <label htmlFor="city">City (for weather)</label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. London, New York"
            disabled={loading}
          />
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Generating...' : 'Generate outfit'}
        </button>
      </form>

      {error && <div className="form-error">{error}</div>}

      {loading && (
        <div className="loading-state">
          <p>Fetching your wardrobe, checking the weather, and styling your outfit...</p>
        </div>
      )}

      {outfit && !loading && (
        <OutfitDisplay outfit={outfit} />
      )}
    </div>
  );
}
