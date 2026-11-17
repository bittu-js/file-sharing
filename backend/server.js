require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const folderRoutes = require('./routes/folderRoutes');
const shareRoutes = require('./routes/shareRoutes');
const statsRoutes = require('./routes/statsRoutes');
const activityRoutes = require('./routes/activityRoutes');
const fileRequestRoutes = require('./routes/fileRequestRoutes');

const app = express();

// Trust reverse proxy (Render runs behind Cloudflare / reverse proxy)
app.set('trust proxy', 1);

// Connect to MongoDB Database
connectDB();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://vaultdrop-ef60.onrender.com',
  process.env.CLIENT_URL
]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/+$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    const normalizedOrigin = origin.trim().replace(/\/+$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Request origin '${origin}' not explicitly permitted in allowedOrigins:`, allowedOrigins);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204
};

// CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Root and Health check endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'VaultDrop Backend API',
    uptime: process.uptime()
  });
});

app.get(['/health', '/api/health'], (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/file-requests', fileRequestRoutes);

// 404 Handler for undefined API routes (do not intercept OPTIONS preflight)
app.use('/api/*', (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found.`
  });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`VaultDrop API Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Allowed CORS origins:`, allowedOrigins);
});

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

module.exports = app;
