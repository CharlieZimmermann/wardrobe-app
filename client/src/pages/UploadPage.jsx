/**
 * UploadPage - Form to upload a new clothing item
 *
 * Sends photo and metadata to the backend API.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ITEM_TYPES = ['shirt', 'pants', 'jacket', 'dress', 'skirt', 'shoes', 'accessory', 'other'];

export default function UploadPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [file, setFile] = useState(null);
  const [itemType, setItemType] = useState('shirt');
  const [color, setColor] = useState('');
  const [styleTags, setStyleTags] = useState('');
  const [season, setSeason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a photo');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('item_type', itemType);
      if (color.trim()) formData.append('color', color.trim());
      if (styleTags.trim()) formData.append('style_tags', styleTags.trim());
      if (season.trim()) formData.append('season', season.trim());

      const res = await fetch('/api/clothing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      navigate('/wardrobe');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Add Clothing</h1>
      <p className="page-intro">
        Upload a photo and tag your item so we can suggest outfits.
      </p>

      <form onSubmit={handleSubmit} className="upload-form">
        {error && <div className="form-error">{error}</div>}

        <label htmlFor="photo">Photo *</label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />

        <label htmlFor="item_type">Item Type *</label>
        <select
          id="item_type"
          value={itemType}
          onChange={(e) => setItemType(e.target.value)}
          required
        >
          {ITEM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>

        <label htmlFor="color">Color</label>
        <input
          id="color"
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="e.g. navy, white"
        />

        <label htmlFor="style_tags">Style Tags</label>
        <input
          id="style_tags"
          type="text"
          value={styleTags}
          onChange={(e) => setStyleTags(e.target.value)}
          placeholder="e.g. casual, striped, formal"
        />

        <label htmlFor="season">Season</label>
        <input
          id="season"
          type="text"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          placeholder="e.g. summer, all-season"
        />

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Uploading...' : 'Add to Wardrobe'}
        </button>
      </form>
    </div>
  );
}
