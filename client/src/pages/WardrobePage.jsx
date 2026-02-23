/**
 * WardrobePage - Displays all clothing items in a photo grid
 *
 * Fetches items from the backend and uses Supabase Storage signed URLs
 * to display images (bucket is private).
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function WardrobePage() {
  const { session } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session?.access_token) return;

    async function fetchItems() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/clothing', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) {
          throw new Error('Failed to load clothing items');
        }

        const data = await res.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [session?.access_token]);

  if (loading) {
    return (
      <div className="page">
        <h1>Wardrobe</h1>
        <div className="loading-state">
          <p>Loading your wardrobe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h1>Wardrobe</h1>
        <div className="error-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Wardrobe</h1>
      <p className="page-intro">
        {items.length === 0
          ? 'No clothing items yet. Add some from the Upload page.'
          : `${items.length} item${items.length === 1 ? '' : 's'} in your wardrobe`}
      </p>
      {items.length > 0 && (
        <ClothingGrid items={items} />
      )}
    </div>
  );
}

/**
 * Grid of clothing items with photos and metadata.
 * Fetches signed URLs from Supabase for each image.
 */
function ClothingGrid({ items }) {
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    if (!supabase || items.length === 0) return;

    async function getSignedUrls() {
      const urls = {};
      for (const item of items) {
        const { data } = await supabase.storage
          .from('clothing-photos')
          .createSignedUrl(item.photo_url, 3600); // 1 hour
        urls[item.id] = data?.signedUrl || null;
      }
      setImageUrls(urls);
    }

    getSignedUrls();
  }, [items]);

  return (
    <div className="wardrobe-grid">
      {items.map((item) => (
        <div key={item.id} className="wardrobe-card">
          <div className="wardrobe-card-image">
            {imageUrls[item.id] ? (
              <img src={imageUrls[item.id]} alt={item.item_type} />
            ) : (
              <div className="wardrobe-card-placeholder">Loading...</div>
            )}
          </div>
          <div className="wardrobe-card-info">
            <span className="wardrobe-card-type">{item.item_type}</span>
            {item.color && (
              <span className="wardrobe-card-color">{item.color}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
