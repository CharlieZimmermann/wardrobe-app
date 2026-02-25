/**
 * ProfileForm - Reusable form for style preferences, body type, sizes, and budget
 * Used by both OnboardingPage and SettingsPage.
 */

import { useState, useEffect } from 'react';

const STYLE_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'streetwear', label: 'Streetwear' },
  { value: 'business casual', label: 'Business Casual' },
  { value: 'smart casual', label: 'Smart Casual' },
];

const BUDGET_OPTIONS = [
  { value: '$', label: '$ - Budget friendly' },
  { value: '$$', label: '$$ - Moderate' },
  { value: '$$$', label: '$$$ - Premium' },
  { value: '$$$$', label: '$$$$ - Luxury' },
];

const BODY_TYPE_OPTIONS = [
  'athletic', 'slim', 'regular', 'muscular', 'plus size', 'petite', 'tall', 'other',
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer not to say', label: 'Prefer not to say' },
];

export default function ProfileForm({ profile, onSubmit, loading, submitLabel }) {
  const [stylePreference, setStylePreference] = useState(profile?.style_preference || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [bodyType, setBodyType] = useState(profile?.body_type || '');
  const [sizeTop, setSizeTop] = useState(profile?.size_top || '');
  const [sizeBottom, setSizeBottom] = useState(profile?.size_bottom || '');
  const [sizeShoes, setSizeShoes] = useState(profile?.size_shoes || '');
  const [budgetRange, setBudgetRange] = useState(profile?.budget_range || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setStylePreference(profile.style_preference || '');
      setGender(profile.gender || '');
      setBodyType(profile.body_type || '');
      setSizeTop(profile.size_top || '');
      setSizeBottom(profile.size_bottom || '');
      setSizeShoes(profile.size_shoes || '');
      setBudgetRange(profile.budget_range || '');
    }
  }, [profile]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!stylePreference) {
      setError('Please select a style preference');
      return;
    }

    try {
      await onSubmit({
        style_preference: stylePreference,
        gender: gender || undefined,
        body_type: bodyType.trim() || undefined,
        size_top: sizeTop.trim() || undefined,
        size_bottom: sizeBottom.trim() || undefined,
        size_shoes: sizeShoes.trim() || undefined,
        budget_range: budgetRange || undefined,
      });
    } catch (err) {
      setError(err.message || 'Failed to save');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      {error && <div className="form-error">{error}</div>}

      <div className="profile-form-section">
        <label htmlFor="style_preference">Style Preference *</label>
        <select
          id="style_preference"
          value={stylePreference}
          onChange={(e) => setStylePreference(e.target.value)}
          required
        >
          <option value="">Select your preferred style</option>
          {STYLE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="profile-form-section">
        <label htmlFor="gender">Gender</label>
        <select
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">Select gender</option>
          {GENDER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="profile-form-section">
        <label htmlFor="body_type">Body Type</label>
        <select
          id="body_type"
          value={bodyType}
          onChange={(e) => setBodyType(e.target.value)}
        >
          <option value="">Select body type</option>
          {BODY_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="profile-form-row profile-form-row-sizes">
        <div className="profile-form-section">
          <label htmlFor="size_top">Top Size</label>
          <input
            id="size_top"
            type="text"
            value={sizeTop}
            onChange={(e) => setSizeTop(e.target.value)}
            placeholder="e.g. M, 10, 38"
          />
        </div>
        <div className="profile-form-section">
          <label htmlFor="size_bottom">Bottom Size</label>
          <input
            id="size_bottom"
            type="text"
            value={sizeBottom}
            onChange={(e) => setSizeBottom(e.target.value)}
            placeholder="e.g. 32, M, 12"
          />
        </div>
      </div>
      <div className="profile-form-section">
        <label htmlFor="size_shoes">Shoe Size</label>
        <input
          id="size_shoes"
          type="text"
          value={sizeShoes}
          onChange={(e) => setSizeShoes(e.target.value)}
          placeholder="e.g. 10, 42, 9 UK"
        />
      </div>

      <div className="profile-form-section">
        <label htmlFor="budget_range">Budget Range for Shopping</label>
        <select
          id="budget_range"
          value={budgetRange}
          onChange={(e) => setBudgetRange(e.target.value)}
        >
          <option value="">Select budget</option>
          {BUDGET_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={loading} className="submit-button">
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
