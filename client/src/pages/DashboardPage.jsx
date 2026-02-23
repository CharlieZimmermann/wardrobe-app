/**
 * DashboardPage - Main landing page for logged-in users
 *
 * Welcomes the user by name and displays current weather
 * (weather will be used as context when generating outfits).
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user, session } = useAuth();
  const [city, setCity] = useState('');
  const [searchCity, setSearchCity] = useState('London');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  // Use name from metadata, or the part before @ in email, or fallback
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'there';

  // Fetch weather when searchCity changes
  useEffect(() => {
    if (!searchCity.trim() || !session?.access_token) return;

    async function fetchWeather() {
      setWeatherLoading(true);
      setWeatherError(null);

      try {
        const res = await fetch(
          `/api/weather?city=${encodeURIComponent(searchCity.trim())}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch weather');
        }

        setWeather(data);
      } catch (err) {
        setWeatherError(err.message);
        setWeather(null);
      } finally {
        setWeatherLoading(false);
      }
    }

    fetchWeather();
  }, [searchCity, session?.access_token]);

  function handleWeatherSubmit(e) {
    e.preventDefault();
    if (city.trim()) setSearchCity(city.trim());
  }

  return (
    <div className="page">
      <h1>Welcome, {displayName}</h1>
      <p className="page-intro">
        Manage your wardrobe and get outfit suggestions tailored to your style.
      </p>

      <section className="weather-section">
        <h2>Current Weather</h2>
        <p className="weather-hint">
          Weather helps us suggest outfits suited to the conditions.
        </p>

        <form onSubmit={handleWeatherSubmit} className="weather-form">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city (e.g. London, New York)"
            className="weather-input"
          />
          <button type="submit" className="weather-button">
            Get Weather
          </button>
        </form>

        {weatherLoading && (
          <p className="weather-loading">Loading weather...</p>
        )}

        {weatherError && (
          <div className="weather-error">{weatherError}</div>
        )}

        {weather && !weatherLoading && (
          <div className="weather-card">
            <div className="weather-city">{weather.city}</div>
            <div className="weather-temp">{weather.temperature}°{weather.unit || 'C'}</div>
            <div className="weather-condition">{weather.condition}</div>
            <div className="weather-description">{weather.description}</div>
          </div>
        )}
      </section>
    </div>
  );
}
