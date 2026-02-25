/**
 * WardrobePage - Displays all clothing items in a photo grid
 *
 * Fetches items from the backend and uses Supabase Storage signed URLs
 * to display images (bucket is private).
 * Supports delete and edit for each item.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const ITEM_TYPES = ['shirt', 'pants', 'jacket', 'dress', 'skirt', 'shoes', 'accessory', 'other'];

export default function WardrobePage() {
  const { session } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchItems() {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clothing', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to load clothing items');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, [session?.access_token]);

  async function handleDelete(id) {
    if (!session?.access_token || !confirm('Delete this item?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/clothing/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete');
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEdit(id, updates) {
    if (!session?.access_token) return;
    setError(null);
    try {
      const res = await fetch(`/api/clothing/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update');
      }
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

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
        <ClothingGrid
          items={items}
          onDelete={handleDelete}
          onEdit={handleEdit}
          ITEM_TYPES={ITEM_TYPES}
        />
      )}
    </div>
  );
}

/**
 * Grid of clothing items with photos and metadata.
 * Fetches signed URLs from Supabase for each image.
 * Includes delete and edit buttons.
 */
function ClothingGrid({ items, onDelete, onEdit, ITEM_TYPES }) {
  const [imageUrls, setImageUrls] = useState({});
  const [editingId, setEditingId] = useState(null);

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
          <div className="wardrobe-card-actions">
            <button
              type="button"
              className="wardrobe-card-btn wardrobe-card-btn-edit"
              onClick={() => setEditingId(editingId === item.id ? null : item.id)}
              title="Edit"
            >
              Edit
            </button>
            <button
              type="button"
              className="wardrobe-card-btn wardrobe-card-btn-delete"
              onClick={() => onDelete(item.id)}
              title="Delete"
            >
              Delete
            </button>
          </div>
          {editingId === item.id && (
            <ClothingEditForm
              item={item}
              ITEM_TYPES={ITEM_TYPES}
              onSave={async (updates) => {
                await onEdit(item.id, updates);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ClothingEditForm({ item, ITEM_TYPES, onSave, onCancel }) {
  const [itemType, setItemType] = useState(item.item_type);
  const [color, setColor] = useState(item.color || '');
  const [styleTags, setStyleTags] = useState(
    Array.isArray(item.style_tags) ? item.style_tags.join(', ') : (item.style_tags || '')
  );
  const [season, setSeason] = useState(item.season || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        item_type: itemType,
        color: color.trim() || undefined,
        style_tags: styleTags.trim() || undefined,
        season: season.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="wardrobe-edit-form" onSubmit={handleSubmit}>
      <label>Item type</label>
      <select value={itemType} onChange={(e) => setItemType(e.target.value)} required>
        {ITEM_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
      <label>Color</label>
      <input
        type="text"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        placeholder="e.g. navy, white"
      />
      <label>Style tags</label>
      <input
        type="text"
        value={styleTags}
        onChange={(e) => setStyleTags(e.target.value)}
        placeholder="e.g. casual, striped"
      />
      <label>Season</label>
      <input
        type="text"
        value={season}
        onChange={(e) => setSeason(e.target.value)}
        placeholder="e.g. summer, all-season"
      />
      <div className="wardrobe-edit-actions">
        <button type="button" className="wardrobe-card-btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="wardrobe-card-btn wardrobe-card-btn-save" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
