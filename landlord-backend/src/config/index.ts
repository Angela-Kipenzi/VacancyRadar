import dotenv from 'dotenv';

dotenv.config();

const corsOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'vacancyradar',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    connectionString: process.env.DATABASE_URL,
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '7d',
  },
  
  // CORS
  corsOrigins,
  
  // File Upload
  upload: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  },
  
  // QR Code
  qrCode: {
    baseUrl: process.env.QR_CODE_BASE_URL || 'http://localhost:3000/listing',
  },

  // M-Pesa (Safaricom Daraja)
  mpesa: {
    enabled: process.env.MPESA_ENABLED === 'true',
    environment: process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox',
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    shortCode: process.env.MPESA_SHORTCODE || '',
    passkey: process.env.MPESA_PASSKEY || '',
    callbackUrl: process.env.MPESA_CALLBACK_URL || '',
    transactionType: process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
    accountReference: process.env.MPESA_ACCOUNT_REFERENCE || 'Rent Payment',
  },
};
