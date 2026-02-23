/**
 * Clothing items API routes
 *
 * All routes require authentication (Bearer token in Authorization header).
 * Uses req.supabase (user-scoped client) so RLS limits data to the logged-in user.
 */

const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Multer: handle multipart/form-data for file uploads
// Store files in memory (we upload to Supabase immediately, then discard)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: jpeg, png, webp, gif'));
    }
  },
});

/**
 * POST /api/clothing
 * Upload a clothing item photo to Supabase Storage and save metadata to clothing_items.
 *
 * Body (multipart/form-data):
 *   - photo: image file (required)
 *   - item_type: string (required), e.g. "shirt", "pants"
 *   - color: string (optional)
 *   - style_tags: JSON array or comma-separated string (optional), e.g. ["casual", "striped"]
 *   - season: string (optional), e.g. "summer", "all-season"
 */
router.post('/', requireAuth, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum 5MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { supabase, user } = req;

    if (!req.file) {
      return res.status(400).json({ error: 'Photo file is required' });
    }

    const { item_type, color, style_tags, season } = req.body;

    if (!item_type || typeof item_type !== 'string' || !item_type.trim()) {
      return res.status(400).json({ error: 'item_type is required' });
    }

    // Parse style_tags: accept JSON array or comma-separated string
    let tags = [];
    if (style_tags) {
      try {
        tags = typeof style_tags === 'string' && style_tags.trim().startsWith('[')
          ? JSON.parse(style_tags)
          : style_tags.split(',').map((t) => t.trim()).filter(Boolean);
      } catch {
        tags = [].concat(style_tags).filter(Boolean);
      }
    }

    // Unique filename to avoid collisions
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${crypto.randomUUID()}${ext}`;
    const storagePath = `${user.id}/${filename}`;

    // Upload to Supabase Storage (user-scoped client respects RLS)
    const { error: uploadError } = await supabase.storage
      .from('clothing-photos')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload photo' });
    }

    // Store path as photo_url (frontend can create signed URLs for display)
    const { data: item, error: dbError } = await supabase
      .from('clothing_items')
      .insert({
        user_id: user.id,
        photo_url: storagePath,
        item_type: item_type.trim(),
        color: color?.trim() || null,
        style_tags: tags,
        season: season?.trim() || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      // Try to remove the uploaded file if DB insert failed
      await supabase.storage.from('clothing-photos').remove([storagePath]);
      return res.status(500).json({ error: 'Failed to save clothing item' });
    }

    res.status(201).json(item);
  } catch (err) {
    console.error('POST /api/clothing error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/clothing
 * Retrieve all clothing items for the logged-in user.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { supabase } = req;

    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET /api/clothing error:', error);
      return res.status(500).json({ error: 'Failed to fetch clothing items' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('GET /api/clothing error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * DELETE /api/clothing/:id
 * Remove a clothing item by ID. Only the owner can delete.
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { supabase, user } = req;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    // Fetch the item first (RLS ensures we can only see our own)
    const { data: item, error: fetchError } = await supabase
      .from('clothing_items')
      .select('id, photo_url')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return res.status(404).json({ error: 'Clothing item not found' });
    }

    // Delete from storage
    await supabase.storage.from('clothing-photos').remove([item.photo_url]);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('clothing_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('DELETE /api/clothing error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete clothing item' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/clothing error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
