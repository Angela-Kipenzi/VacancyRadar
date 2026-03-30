import { fileURLToPath } from 'url';
import pool from './connection.js';

const schema = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (Landlords) Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('apartment', 'house', 'condo', 'townhouse', 'other')),
  year_built INTEGER,
  total_units INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  amenities JSONB DEFAULT '[]',
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Units Table
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number VARCHAR(50) NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms DECIMAL(3, 1) NOT NULL,
  square_feet INTEGER,
  rent_amount DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('vacant', 'occupied', 'maintenance', 'pending')),
  available_date DATE,
  floor_plan TEXT,
  photos JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(property_id, unit_number)
);

-- Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  move_in_date DATE,
  move_out_date DATE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'past')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure tenant auth columns/constraints exist on existing databases
ALTER TABLE tenants ALTER COLUMN landlord_id DROP NOT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS password VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_email_unique ON tenants(email);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  applicant_name VARCHAR(255) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  applicant_phone VARCHAR(20) NOT NULL,
  current_address TEXT,
  employment_status VARCHAR(100),
  employer_name VARCHAR(255),
  annual_income DECIMAL(12, 2),
  move_in_date DATE,
  num_occupants INTEGER,
  has_pets BOOLEAN DEFAULT FALSE,
  pet_details TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')),
  notes TEXT,
  documents JSONB DEFAULT '[]',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leases Table
CREATE TABLE IF NOT EXISTS leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) NOT NULL,
  payment_due_day INTEGER NOT NULL CHECK (payment_due_day BETWEEN 1 AND 31),
  lease_type VARCHAR(50) NOT NULL CHECK (lease_type IN ('fixed', 'month-to-month')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
  document_url TEXT,
  signed_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn'));

-- Payments Table (Tenant-facing)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  due_date DATE NOT NULL,
  paid_date DATE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'paid', 'late', 'partial')),
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Methods (Tenant-facing)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('card', 'mobile_money')),
  label VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  last4 VARCHAR(10),
  expiry VARCHAR(20),
  provider VARCHAR(100),
  phone VARCHAR(50),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Transactions (Tenant-facing)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL CHECK (status IN ('paid', 'pending', 'failed')),
  method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Requests Table (Tenant-facing)
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('plumbing', 'electrical', 'hvac', 'appliance', 'other')),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Tenant Documents Table
CREATE TABLE IF NOT EXISTS tenant_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('lease', 'receipt', 'notice', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenancy State Table (Tenant-facing)
CREATE TABLE IF NOT EXISTS tenancy_states (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  checklist JSONB DEFAULT '[]',
  reminder_enabled BOOLEAN DEFAULT TRUE,
  lease_previewed BOOLEAN DEFAULT FALSE,
  check_in JSONB DEFAULT '{}'::jsonb,
  check_out JSONB DEFAULT '{}'::jsonb,
  deposit JSONB DEFAULT '{}'::jsonb,
  lease_info JSONB DEFAULT '{}'::jsonb,
  move_in_date DATE,
  property_location JSONB,
  location_radius_meters INTEGER DEFAULT 250,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table (Tenant-facing)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_name VARCHAR(255),
  property_address TEXT,
  ratings JSONB NOT NULL,
  pros JSONB DEFAULT '[]',
  cons JSONB DEFAULT '[]',
  details TEXT,
  photos JSONB DEFAULT '[]',
  anonymous BOOLEAN DEFAULT FALSE,
  author_name VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'published', 'hidden')),
  verified BOOLEAN DEFAULT FALSE,
  landlord_response JSONB,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QR Codes Table
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  code_url TEXT NOT NULL,
  landing_page_url TEXT NOT NULL,
  scan_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(unit_id)
);

-- QR Scans Table
CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  location VARCHAR(255)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('application', 'lease', 'maintenance', 'payment', 'general')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_applications_unit ON applications(unit_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_tenant ON applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_unit ON leases(unit_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);
CREATE INDEX IF NOT EXISTS idx_tenants_landlord ON tenants(landlord_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_lease ON payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant ON payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON payment_transactions(method_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON tenant_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant ON reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_unit ON reviews(unit_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_unit ON qr_codes(unit_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_code ON qr_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_units_updated_at ON units;
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_leases_updated_at ON leases;
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON leases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_maintenance_updated_at ON maintenance_requests;
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_tenancy_states_updated_at ON tenancy_states;
CREATE TRIGGER update_tenancy_states_updated_at BEFORE UPDATE ON tenancy_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON qr_codes;
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

export async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running database migrations...');
    await client.query(schema);
    console.log('✓ Database migrations completed successfully');
  } catch (error) {
    console.error('✗ Error running migrations:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if executed directly – Windows‑compatible check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
