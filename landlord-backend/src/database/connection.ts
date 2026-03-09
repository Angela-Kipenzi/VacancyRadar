import pkg from 'pg';
const { Pool } = pkg;
import { config } from '../config/index.js';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: config.database.connectionString,
  host: config.database.connectionString ? undefined : config.database.host,
  port: config.database.connectionString ? undefined : config.database.port,
  database: config.database.connectionString ? undefined : config.database.database,
  user: config.database.connectionString ? undefined : config.database.user,
  password: config.database.connectionString ? undefined : config.database.password,
  ssl: config.database.connectionString ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
