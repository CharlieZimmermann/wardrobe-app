/**
 * Authentication middleware
 *
 * Extracts the JWT from the Authorization header (Bearer token) and
 * verifies it with Supabase. If valid, attaches the user and a
 * user-scoped Supabase client to the request.
 * If invalid or missing, returns 401 Unauthorized.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

/**
 * Verifies the user's JWT and attaches user + user-scoped Supabase client to req.
 * Expects: Authorization: Bearer <access_token>
 *
 * req.user - the authenticated user object
 * req.supabase - Supabase client that acts as this user (for RLS)
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  supabase.auth.getUser(token)
    .then(({ data: { user }, error }) => {
      if (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = user;
      req.accessToken = token;
      // Client that acts as this user (RLS will filter by user_id automatically)
      req.supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      next();
    })
    .catch((err) => {
      console.error('Auth error:', err);
      res.status(500).json({ error: 'Authentication failed' });
    });
}

module.exports = { requireAuth };
