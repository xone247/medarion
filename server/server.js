import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { testConnection } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import companiesRoutes from './routes/companies.js';
import dealsRoutes from './routes/deals.js';
import grantsRoutes from './routes/grants.js';
import clinicalTrialsRoutes from './routes/clinical-trials.js';
import blogRoutes from './routes/blog.js';
import dbRoutes from './routes/db.js';
import aiRoutes from './routes/ai.js';
import aiDataGenRoutes from './routes/ai-data-generation.js';
import aiDataUpdateRoutes from './routes/ai-data-updates.js';
import investorsRoutes from './routes/investors.js';
import notificationsRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import countriesRoutes from './routes/countries.js';
import uploadRoutes from './routes/upload.js';
import newsletterRoutes from './routes/newsletter.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
let requestCount = 0;

// Trust proxy for correct host/protocol detection (important for Apache reverse proxy)
// Set to 1 to trust only the first proxy (Apache) - prevents rate limiter error
app.set('trust proxy', 1);

// Security middleware - configure helmet to not interfere with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
// Allow localhost and ngrok URLs for testing
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5174',
  'https://medarion.africa',
  'http://medarion.africa',
  'https://api.medarion.africa',
  'http://api.medarion.africa',
  process.env.CORS_ORIGIN,
  /^https?:\/\/.*\.ngrok-free\.app$/,
  /^https?:\/\/.*\.ngrok\.io$/,
  /^https?:\/\/.*\.ngrok-app\.com$/
].filter(Boolean); // Remove undefined values

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// CORS middleware - handle OPTIONS requests explicitly
app.use((req, res, next) => {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    console.log('[CORS] OPTIONS preflight request from origin:', origin);
    
    // Check if origin is allowed
    let isAllowed = false;
    if (!origin) {
      isAllowed = true;
    } else if (origin.includes('medarion.africa')) {
      isAllowed = true;
    } else if (isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      isAllowed = true;
    } else {
      isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') return origin === allowed;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });
    }
    
    if (isAllowed) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      console.log('[CORS] OPTIONS preflight allowed for origin:', origin);
      return res.status(200).end();
    } else {
      console.error('[CORS] OPTIONS preflight rejected for origin:', origin);
      return res.status(403).end();
    }
  }
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      console.log('[CORS] Request with no origin - allowing');
      return callback(null, true);
    }
    
    console.log('[CORS] Checking origin:', origin);
    
    // In development, allow all localhost origins
    if (isDevelopment) {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log('[CORS] Development mode - allowing localhost origin');
        return callback(null, true);
      }
    }
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('[CORS] Origin allowed:', origin);
      callback(null, true);
    } else {
      // In production, still allow medarion.africa domains for safety
      if (origin.includes('medarion.africa')) {
        console.log('[CORS] Allowing medarion.africa domain:', origin);
        callback(null, true);
      } else if (isDevelopment) {
        console.log('[CORS] Development mode - allowing origin:', origin);
        callback(null, true);
      } else {
        console.error('[CORS] Origin not allowed:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Rate limiting - more lenient in development
// Note: trustProxy is set to 1 (first proxy) to work with Apache reverse proxy
// This prevents the rate limiter from throwing an error about permissive trust proxy
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Higher limit in development (1000 vs 100)
  trustProxy: 1, // Trust only the first proxy (Apache) - prevents rate limiter error
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/metrics';
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => { requestCount += 1; next(); });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Basic metrics endpoint
app.get('/metrics', (req, res) => {
  res.type('text/plain').send(`requests_total ${requestCount}`);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/investors', investorsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/grants', grantsRoutes);
app.use('/api/clinical-trials', clinicalTrialsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai/generate', aiDataGenRoutes);
app.use('/api/ai/update', aiDataUpdateRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Serve uploaded files statically - MUST be before 404 handler
// This middleware should be registered early to catch /uploads requests
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Uploads directory is at /home/medasnnc/api.medarion.africa/uploads
// server.js is at /home/medasnnc/api.medarion.africa/server.js
// So __dirname = /home/medasnnc/api.medarion.africa
// And uploads is at /home/medasnnc/api.medarion.africa/uploads
// Use absolute path to be sure
const uploadsPath = '/home/medasnnc/api.medarion.africa/uploads';
console.log('[Server] Static uploads path:', uploadsPath);
console.log('[Server] __dirname:', __dirname);

// Add middleware to log uploads requests for debugging
app.use('/uploads', (req, res, next) => {
  console.log('[Static] Serving uploads request:', req.path, 'from', uploadsPath);
  next();
});

app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, path) => {
    // Set proper headers for images
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
  },
  // Don't serve index files
  index: false
}));

// Debug: Log registered routes
if (isDevelopment) {
  console.log('[Server] Registered admin routes:', adminRoutes.stack?.map((r) => r.route?.path || r.regexp?.source).filter(Boolean).join(', ') || 'No routes found');
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Medarion Healthcare Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      companies: '/api/companies',
      investors: '/api/investors',
      deals: '/api/deals',
      grants: '/api/grants',
      clinicalTrials: '/api/clinical-trials',
      blog: '/api/blog',
      db: '/api/db/health',
      ai: '/api/ai',
      aiDataGeneration: '/api/ai/generate',
      aiDataUpdates: '/api/ai/update',
      notifications: '/api/notifications',
      admin: '/api/admin',
      health: '/health'
    }
  });
});

// 404 handler - must be last
app.use('*', (req, res) => {
  // Don't log 404s for static file requests (they're expected if file doesn't exist)
  if (!req.path.startsWith('/uploads')) {
    console.log('[404] Request not matched:', {
      method: req.method,
      originalUrl: req.originalUrl,
      url: req.url,
      path: req.path,
      baseUrl: req.baseUrl,
      route: req.route?.path
    });
  }
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your MySQL connection.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
