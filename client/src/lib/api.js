/**
 * API client for backend requests
 *
 * Automatically includes the auth token from the Supabase session
 * so protected endpoints can verify the user.
 */

import { supabase } from './supabase';

/**
 * Get the current access token for API requests
 */
export function getAccessToken() {
  // We need to get the session synchronously - but getSession is async.
  // The caller (e.g. useApi) will need to wait for the session.
  return null;
}

/**
 * Fetch from the API with auth token attached.
 * Use this for protected endpoints.
 *
 * @param {string} url - e.g. '/api/clothing'
 * @param {object} options - fetch options (method, body, headers)
 * @param {string} token - access token from session
 */
export async function apiFetch(url, options = {}, token) {
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  return res;
}

/**
 * Fetch the session and return the access token.
 * Call this before making protected API requests.
 */
export async function getSessionToken() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
