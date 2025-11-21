import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
let requestCount = 0;

// Security middleware
app.use(helmet());

// CORS configuration
// Allow localhost and ngrok URLs for testing
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  /^https?:\/\/.*\.ngrok-free\.app$/,
  /^https?:\/\/.*\.ngrok\.io$/,
  /^https?:\/\/.*\.ngrok-app\.com$/
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
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
      callback(null, true);
    } else {
      // In development, allow all origins (for testing)
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
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

// 404 handler
app.use('*', (req, res) => {
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
