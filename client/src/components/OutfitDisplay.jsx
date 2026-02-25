/**
 * OutfitDisplay - Displays suggested outfit with photos and explanation
 *
 * Fetches signed URLs from Supabase for each clothing item image.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function OutfitDisplay({ outfit }) {
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    if (!supabase || !outfit?.items?.length) return;

    async function getSignedUrls() {
      const urls = {};
      for (const item of outfit.items) {
        const { data } = await supabase.storage
          .from('clothing-photos')
          .createSignedUrl(item.photo_url, 3600);
        urls[item.id] = data?.signedUrl || null;
      }
      setImageUrls(urls);
    }

    getSignedUrls();
  }, [outfit?.items]);

  if (!outfit?.items?.length) {
    return null;
  }

  return (
    <div className="outfit-display">
      {outfit.weather && (
        <div className="outfit-weather">
          <span className="outfit-weather-city">{outfit.weather.city}</span>
          <span className="outfit-weather-temp">
            {outfit.weather.temperature}°{outfit.weather.unit}
          </span>
          <span className="outfit-weather-condition">{outfit.weather.condition}</span>
        </div>
      )}

      <div className="outfit-items">
        {outfit.items.map((item) => (
          <div key={item.id} className="outfit-item-card">
            <div className="outfit-item-image">
              {imageUrls[item.id] ? (
                <img src={imageUrls[item.id]} alt={item.item_type} />
              ) : (
                <div className="outfit-item-placeholder">Loading...</div>
              )}
            </div>
            <div className="outfit-item-info">
              <span className="outfit-item-type">{item.item_type}</span>
              {item.color && (
                <span className="outfit-item-color">{item.color}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {outfit.explanation && (
        <div className="outfit-explanation">
          <h2>Why this works</h2>
          <p>{outfit.explanation}</p>
        </div>
      )}
    </div>
  );
}
