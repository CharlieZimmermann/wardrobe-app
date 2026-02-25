/**
 * Outfit API routes
 *
 * Generate outfit suggestions using wardrobe data, weather, and Claude API.
 * All routes require authentication.
 */

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * POST /api/outfits/generate
 * Fetches user's clothing items, current weather, and calls Claude to suggest
 * a complete outfit. Returns item IDs and explanation.
 *
 * Query: ?city=London (optional, defaults to London)
 */
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { supabase } = req;
    const city = (req.query.city || 'London').trim();

    // 1. Fetch user's clothing items (include photo_url for frontend display)
    const { data: items, error: itemsError } = await supabase
      .from('clothing_items')
      .select('id, item_type, color, style_tags, season, photo_url')
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Outfit generate: fetch items error', itemsError);
      return res.status(500).json({ error: 'Failed to fetch clothing items' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        error: 'Your wardrobe is empty. Add some clothing items first.',
      });
    }

    // 2. Fetch user profile for style preference and gender
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('style_preference, gender, body_type')
      .eq('user_id', req.user.id)
      .single();

    // 3. Fetch weather
    const apiKey = process.env.OPENWEATHER_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API not configured' });
    }

    const params = new URLSearchParams({
      q: city,
      appid: apiKey,
      units: 'metric',
    });
    const weatherRes = await fetch(`${OPENWEATHER_URL}?${params}`);
    if (!weatherRes.ok) {
      const errData = await weatherRes.json().catch(() => ({}));
      if (weatherRes.status === 404) {
        return res.status(400).json({ error: `City "${city}" not found` });
      }
      return res.status(502).json({
        error: errData.message || 'Failed to fetch weather',
      });
    }

    const weatherData = await weatherRes.json();
    const tempC = weatherData.main?.temp ?? 15;
    const isUS = weatherData.sys?.country === 'US';
    const temp = isUS ? Math.round((tempC * 9) / 5 + 32) : Math.round(tempC);
    const unit = isUS ? 'F' : 'C';
    const condition = weatherData.weather?.[0]?.main || 'Unknown';
    const description = weatherData.weather?.[0]?.description || 'No description';

    // 4. Call Claude API
    const anthropicKey = (process.env.ANTHROPIC_KEY || '').trim();
    if (!anthropicKey) {
      return res.status(500).json({ error: 'Claude API not configured. Add ANTHROPIC_KEY to .env' });
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const wardrobeDescription = items
      .map((i) => `- id: ${i.id}, type: ${i.item_type}, color: ${i.color || 'unknown'}, style_tags: ${JSON.stringify(i.style_tags || [])}, season: ${i.season || 'all'}`)
      .join('\n');

    const styleContext = profile?.style_preference
      ? `\nUSER STYLE PREFERENCE: ${profile.style_preference}. Prioritize pieces that match this aesthetic.`
      : '';
    const genderContext = profile?.gender
      ? `\nUSER GENDER: ${profile.gender}. Men's and women's fashion differ significantly—choose pieces and styling appropriate for this context.`
      : '';
    const bodyContext = profile?.body_type
      ? `\nUSER BODY TYPE: ${profile.body_type}. Consider proportion and fit for this body type.`
      : '';

    const prompt = `You are a fashion stylist. Suggest a complete outfit from the user's wardrobe below.
${styleContext}${genderContext}${bodyContext}

WARDROBE (each item has an id - use these exact IDs in your response):
${wardrobeDescription}

CURRENT WEATHER:
- City: ${weatherData.name || city}
- Temperature: ${temp}°${unit}
- Condition: ${condition}
- Description: ${description}

RULES:
1. Use color theory: complementary, analogous, or monochromatic schemes.
2. Apply layering principles for the temperature (add layers if cold, lighter if warm).
3. Respect proportion rules: balance fitted and loose pieces.
4. Ensure the outfit is complete (e.g. top + bottom + optional outerwear/accessories).
5. Consider the weather when selecting items (e.g. coat for cold, shorts for heat).

Respond with ONLY a valid JSON object, no other text:
{
  "item_ids": ["uuid1", "uuid2", ...],
  "explanation": "2-3 sentences explaining why this outfit works (color harmony, layering, proportion, weather appropriateness)"
}

Pick only IDs that exist in the wardrobe list. Return valid JSON only.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content?.[0]?.type === 'text'
      ? message.content[0].text
      : '';
    if (!text) {
      return res.status(500).json({ error: 'Claude returned no content' });
    }

    // Parse JSON from response (may be wrapped in markdown code blocks)
    let parsed;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Claude JSON parse error', e);
        return res.status(500).json({ error: 'Invalid response from outfit generator' });
      }
    } else {
      return res.status(500).json({ error: 'Invalid response from outfit generator' });
    }

    const itemIds = Array.isArray(parsed.item_ids) ? parsed.item_ids : [];
    const explanation =
      typeof parsed.explanation === 'string' ? parsed.explanation : 'No explanation provided.';

    // Validate that all returned IDs exist in the wardrobe and build full item list (preserve Claude's order)
    const validIds = new Set(items.map((i) => i.id));
    const validItemIds = itemIds.filter((id) => validIds.has(id));
    const itemMap = new Map(items.map((i) => [i.id, i]));
    const suggestedItems = validItemIds.map((id) => itemMap.get(id)).filter(Boolean);

    res.json({
      item_ids: validItemIds,
      items: suggestedItems,
      explanation: explanation || 'This outfit complements the current weather and your style.',
      weather: { city: weatherData.name || city, temperature: temp, unit, condition },
    });
  } catch (err) {
    console.error('POST /api/outfits/generate error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/outfits/gap-finder
 * Placeholder: Analyze wardrobe for missing essentials and suggest items.
 *
 * Will integrate wardrobe analysis and RapidAPI shopping later.
 */
router.post('/gap-finder', requireAuth, async (req, res) => {
  try {
    // TODO: Implement gap finder analysis
    res.json({
      message: 'Gap finder not yet implemented',
      placeholder: true,
    });
  } catch (err) {
    console.error('POST /api/outfits/gap-finder error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
