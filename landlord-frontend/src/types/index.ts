export interface Property {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  type: 'apartment' | 'house' | 'condo';
  totalUnits: number;
  description: string;
  photos: string[];
  amenities: string[];
  contactInfo: {
    phone: string;
    email: string;
  };
  virtualTourUrl?: string;
  videoTourUrl?: string;
  createdAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  securityDeposit: number;
  description: string;
  photos: string[];
  amenities: string[];
  status: 'vacant' | 'occupied' | 'vacating';
  availabilityDate: string;
  qrCode: string;
  createdAt: string;
}

export interface Application {
  id: string;
  unitId: string;
  propertyId: string;
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    currentAddress: string;
  };
  employment: {
    employer: string;
    position: string;
    income: number;
    yearsEmployed: number;
  };
  rentalHistory: {
    previousAddress: string;
    landlordName: string;
    landlordPhone: string;
    yearsRented: number;
  }[];
  documents: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  coverLetter: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  notes: string[];
}

export type YesNo = 'yes' | 'no';

export interface LeaseAgreementData {
  propertyType?: string;
  leaseType?: 'fixed' | 'month-to-month';
  startDate?: string;
  endDate?: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyAddress?: string;
  landlord?: string;
  tenant?: string;
  noticesToTenant?: string;
  occupants?: string;
  furnishings?: string;
  appliances?: string;
  monthlyRent?: string;
  paymentMethods?: string;
  securityDeposit?: string;
  earlyMoveIn?: YesNo;
  prepaidRent?: YesNo;
  lateFee?: YesNo;
  nsfFee?: YesNo;
  parking?: YesNo;
  utilitiesServices?: YesNo;
  pets?: YesNo;
  moveInInspection?: YesNo;
  smokingPolicy?: YesNo;
  rentersInsurance?: YesNo;
  subletting?: YesNo;
  authorizedPersons?: string;
  leadBasedPaintDisclosure?: YesNo;
  cosigner?: YesNo;
  additionalTerms?: string;
}

export interface Lease {
  id: string;
  unitId: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  leaseType?: 'fixed' | 'month-to-month';
  terms: string;
  status: 'active' | 'expired' | 'terminated' | 'pending';
  signedAt: string | null;
  signatureStatus: 'pending' | 'signed';
  documentUrl: string;
  agreementData?: LeaseAgreementData;
  createdAt: string;
}

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentUnitId: string | null;
  currentLeaseId: string | null;
  moveInDate: string | null;
  moveOutDate: string | null;
  status: 'current' | 'past';
  createdAt: string;
}

export interface QRScan {
  id: string;
  unitId: string;
  scannedBy: {
    name: string;
    email: string;
  };
  scannedAt: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Notification {
  id: string;
  type: 'application' | 'qr_scan' | 'lease_signed' | 'move_out' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
}
