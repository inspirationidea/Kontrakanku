import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import Prisma Instance
import prisma from './src/config/prisma.js';

// Import Routers
import authRoutes from './src/routes/authRoutes.js';
import propertyRoutes from './src/routes/propertyRoutes.js';
import unitRoutes from './src/routes/unitRoutes.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import complaintRoutes from './src/routes/complaintRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';

// Import Error Handler
import errorHandler from './src/middlewares/errorHandler.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// CORS — izinkan frontend dari Vercel dan localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,           // set di Railway: https://kontrakanku.vercel.app
  /\.vercel\.app$/,                   // semua subdomain Vercel
  /\.railway\.app$/,                  // Railway preview
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile app / curl
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    callback(null, allowed);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Expose local file uploads directory as static
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Main entry welcome route
app.get('/', (req, res) => {
  res.json({
    name: "KontrakanKu Central API Gateway",
    version: "1.0.0",
    status: "online",
    message: "Welcome to the KontrakanKu Central API Server"
  });
});

// Detailed health-check route (Verifies DB connection status)
app.get('/api/health', async (req, res) => {
  const healthInfo = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    services: {
      api: { status: 'UP' },
      database: { status: 'UNKNOWN' }
    }
  };

  try {
    // Ping PostgreSQL using Prisma raw query
    await prisma.$queryRaw`SELECT 1`;
    healthInfo.services.database.status = 'UP';
  } catch (error) {
    healthInfo.status = 'DEGRADED';
    healthInfo.services.database.status = 'DOWN';
    healthInfo.services.database.error = error.message;
  }

  res.status(healthInfo.status === 'OK' ? 200 : 503).json(healthInfo);
});

// Register Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/properties/:propertyId/reviews', reviewRoutes);

// Global Error Handler (must be defined last)
app.use(errorHandler);

// Start listening
app.listen(port, () => {
  console.log(`[KontrakanKu Server] Central API listening on http://localhost:${port}`);
});

