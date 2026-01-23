// Point d'entrée Vercel Serverless (CommonJS)
const mongoose = require('mongoose');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'temp-secret';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

// Connexion MongoDB (réutilisée)
let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Handler principal
module.exports = async (req, res) => {
  // CORS
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Route racine
  if (req.url === '/api/v1' || req.url === '/api/v1/') {
    return res.status(200).json({
      success: true,
      message: 'FinSmart API is running',
      version: '1.0.0',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        goals: '/api/v1/goals',
        analytics: '/api/v1/analytics'
      }
    });
  }

  // Health check
  if (req.url === '/api/v1/health') {
    try {
      await connectDB();
      const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

      return res.status(200).json({
        success: true,
        status: 'healthy',
        database: dbState,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: error.message
      });
    }
  }

  // 404 pour les autres routes (temporaire)
  return res.status(404).json({
    success: false,
    message: 'Route not found',
    note: 'Full API routes coming soon. Use /api/v1 or /api/v1/health for now.'
  });
};
