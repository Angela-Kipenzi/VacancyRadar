export interface User {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Property {
  id: string;
  landlord_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: 'apartment' | 'house' | 'condo' | 'townhouse' | 'other';
  year_built?: number;
  total_units: number;
  description?: string;
  amenities?: string[];
  photo_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number;
  rent_amount: number;
  deposit_amount: number;
  status: 'vacant' | 'occupied' | 'maintenance' | 'pending';
  available_date?: Date;
  floor_plan?: string;
  photos?: string[];
  amenities?: string[];
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Application {
  id: string;
  unit_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  current_address?: string;
  employment_status?: string;
  employer_name?: string;
  annual_income?: number;
  move_in_date?: Date;
  num_occupants?: number;
  has_pets?: boolean;
  pet_details?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  notes?: string;
  documents?: string[];
  submitted_at: Date;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Lease {
  id: string;
  unit_id: string;
  tenant_id: string;
  start_date: Date;
  end_date: Date;
  rent_amount: number;
  deposit_amount: number;
  payment_due_day: number;
  lease_type: 'fixed' | 'month-to-month';
  status: 'active' | 'expired' | 'terminated' | 'pending';
  document_url?: string;
  signed_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Tenant {
  id: string;
  landlord_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  move_in_date?: Date;
  move_out_date?: Date;
  status: 'active' | 'inactive' | 'past';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface QRCode {
  id: string;
  unit_id: string;
  code_url: string;
  landing_page_url: string;
  scan_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface QRScan {
  id: string;
  qr_code_id: string;
  scanned_at: Date;
  ip_address?: string;
  user_agent?: string;
  location?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'application' | 'lease' | 'maintenance' | 'payment' | 'general';
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: Date;
}
