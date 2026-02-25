/**
 * StyleAi Backend - Express server
 *
 * This is the main entry point for the Node.js backend.
 * It sets up the Express app, connects to Supabase, and defines API routes.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const clothingRoutes = require('./routes/clothing');
const outfitRoutes = require('./routes/outfits');
const weatherRoutes = require('./routes/weather');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow the React frontend (running on a different port) to make requests
// Without CORS, the browser would block cross-origin requests
app.use(cors());

// Parse JSON request bodies (e.g. when the frontend sends data)
app.use(express.json());

// Initialize Supabase client - we use the same .env file in the project root
// You'll add SUPABASE_URL and SUPABASE_ANON_KEY to .env when you create your project
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Health check endpoint - used to verify the backend is running
 * Frontend calls GET /api/health to confirm the connection works
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'StyleAi backend is running',
    timestamp: new Date().toISOString(),
    supabaseConnected: !!supabase,
  });
});

/**
 * Simple ping endpoint - returns a success message for connection testing
 */
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Protected API routes (require Authorization: Bearer <token>)
app.use('/api/clothing', clothingRoutes);
app.use('/api/outfits', outfitRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/user', userRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`StyleAi backend running at http://localhost:${PORT}`);
  if (!supabase) {
    console.log('Note: Supabase not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env');
  }
});
