/**
 * User profile API routes
 *
 * GET /api/user/profile - Fetch the logged-in user's profile (style prefs, sizes, budget)
 * PUT /api/user/profile - Create or update the user's profile
 *
 * All routes require authentication.
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const STYLE_OPTIONS = ['casual', 'streetwear', 'business casual', 'smart casual'];
const GENDER_OPTIONS = ['male', 'female', 'non-binary', 'prefer not to say'];
const BUDGET_OPTIONS = ['$', '$$', '$$$', '$$$$'];

/**
 * GET /api/user/profile
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { supabase, user } = req;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('GET /api/user/profile error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json(data || null);
  } catch (err) {
    console.error('GET /api/user/profile error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * PUT /api/user/profile
 * Body: { style_preference, body_type, size_top, size_bottom, size_shoes, budget_range }
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { supabase, user } = req;
    const { style_preference, gender, body_type, size_top, size_bottom, size_shoes, budget_range } = req.body;

    // Fetch existing profile to merge partial updates
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const merged = {
      user_id: user.id,
      style_preference: existing?.style_preference ?? null,
      gender: existing?.gender ?? null,
      body_type: existing?.body_type ?? null,
      size_top: existing?.size_top ?? null,
      size_bottom: existing?.size_bottom ?? null,
      size_shoes: existing?.size_shoes ?? null,
      budget_range: existing?.budget_range ?? null,
      updated_at: new Date().toISOString(),
    };

    if (style_preference !== undefined) {
      merged.style_preference = STYLE_OPTIONS.includes(style_preference) ? style_preference : null;
    }
    if (gender !== undefined) {
      merged.gender = GENDER_OPTIONS.includes(gender) ? gender : null;
    }
    if (body_type !== undefined) merged.body_type = body_type?.trim() || null;
    if (size_top !== undefined) merged.size_top = size_top?.trim() || null;
    if (size_bottom !== undefined) merged.size_bottom = size_bottom?.trim() || null;
    if (size_shoes !== undefined) merged.size_shoes = size_shoes?.trim() || null;
    if (budget_range !== undefined) {
      merged.budget_range = BUDGET_OPTIONS.includes(budget_range) ? budget_range : null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(merged, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('PUT /api/user/profile error:', error);
      return res.status(500).json({ error: 'Failed to save profile' });
    }

    res.json(data);
  } catch (err) {
    console.error('PUT /api/user/profile error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
