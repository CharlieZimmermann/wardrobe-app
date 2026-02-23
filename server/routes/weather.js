/**
 * Weather API routes
 *
 * Fetches current weather from OpenWeatherMap for outfit context.
 * Requires OPENWEATHER_KEY in .env.
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * GET /api/weather?city=London
 * Returns current temperature, conditions, and description for a city.
 *
 * Response: { temperature, condition, description, city }
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const city = req.query.city;

    if (!city || typeof city !== 'string' || !city.trim()) {
      return res.status(400).json({ error: 'City name is required (query: ?city=London)' });
    }

    const apiKey = process.env.OPENWEATHER_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API not configured. Add OPENWEATHER_KEY to .env' });
    }

    const params = new URLSearchParams({
      q: city.trim(),
      appid: apiKey,
      units: 'metric',
    });

    const response = await fetch(`${OPENWEATHER_URL}?${params}`);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return res.status(404).json({ error: 'City not found' });
      }
      return res.status(response.status).json({
        error: errData.message || 'Failed to fetch weather data',
      });
    }

    const data = await response.json();

    const isUS = data.sys?.country === 'US';
    const tempCelsius = data.main.temp;
    const temperature = isUS
      ? Math.round((tempCelsius * 9) / 5 + 32)
      : Math.round(tempCelsius);
    const unit = isUS ? 'F' : 'C';

    res.json({
      city: data.name,
      temperature,
      unit,
      condition: data.weather?.[0]?.main || 'Unknown',
      description: data.weather?.[0]?.description || 'No description',
    });
  } catch (err) {
    console.error('GET /api/weather error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch weather' });
  }
});

module.exports = router;
