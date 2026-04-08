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

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.resolve(config.upload.directory)));

// Request logging
app.use((req: Request, _res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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
