import express, { Express, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler, notFound } from './middleware/error.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import propertyRoutes from './routes/property.routes.js';
import unitRoutes from './routes/unit.routes.js';
import applicationRoutes from './routes/application.routes.js';
import leaseRoutes from './routes/lease.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import qrcodeRoutes from './routes/qrcode.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import tenantNotificationRoutes from './routes/tenant-notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import tenancyRoutes from './routes/tenancy.routes.js';
import documentRoutes from './routes/document.routes.js';
import listingRoutes from './routes/listing.routes.js';
import reviewRoutes from './routes/review.routes.js';
import paymentMethodRoutes from './routes/payment-method.routes.js';
import paymentTransactionRoutes from './routes/payment-transaction.routes.js';
import uploadRoutes from './routes/upload.routes.js';

const app: Express = express();

// Allowed origins for CORS
const allowedOrigins = [
  'https://vacancy-radar.vercel.app',
  'https://vacancy-radar.vercel.app/',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  ...config.corsOrigins
];

// CORS Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS allowed: ${origin}`);
      callback(null, true);
    } else {
      console.log(`CORS blocked: ${origin}`);
      console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error(`CORS policy blocked request from ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
}));

// Handle preflight requests explicitly
app.options('*', (req: Request, res: Response) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
  }
  res.status(204).send();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.resolve(config.upload.directory)));

// Request logging with origin
app.use((req: Request, _res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'no origin'}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/qrcodes', qrcodeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tenant-notifications', tenantNotificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/tenancy', tenancyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/payment-transactions', paymentTransactionRoutes);
app.use('/api/upload', uploadRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'VacancyRadar API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      properties: '/api/properties',
      units: '/api/units',
      applications: '/api/applications',
      leases: '/api/leases',
      tenants: '/api/tenants',
      qrcodes: '/api/qrcodes',
      notifications: '/api/notifications',
      tenantNotifications: '/api/tenant-notifications',
      analytics: '/api/analytics',
      payments: '/api/payments',
      maintenance: '/api/maintenance',
      tenancy: '/api/tenancy',
      documents: '/api/documents',
      listings: '/api/listings',
      reviews: '/api/reviews',
      paymentMethods: '/api/payment-methods',
      paymentTransactions: '/api/payment-transactions',
    },
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;