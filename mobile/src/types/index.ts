import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Maintenance: undefined;
  CreateRequest: undefined;
  RequestDetail: { request: MaintenanceRequest };
  Profile: undefined;
  Payments: undefined;
  Settings: undefined;
  SearchMap: undefined;
  PropertyList: undefined;
  SearchFilters: { savedSearchId?: string } | undefined;
  SavedSearches: undefined;
  SearchHistory: undefined;
  PropertyDetails: { propertyId: string };
  TenancyHome: undefined;
  MoveInPrep: undefined;
  LeasePreview: undefined;
  CheckIn: undefined;
  CheckOut: undefined;
  DepositTracking: undefined;
  ApplicationsDashboard: undefined;
  ApplicationDetail: { applicationId: string };
  ApplicationForm: { propertyId: string };
  ReviewsDashboard: undefined;
  ReviewDetail: { reviewId: string };
  ReviewForm: { propertyId: string };
  PropertyReviews: { propertyId: string };
  PaymentsHome: undefined;
  PaymentMethods: undefined;
  AddPaymentMethod: undefined;
  PaymentHistory: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export interface ScreenProps {
  navigation: NavigationProp;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  moveInDate?: string;
  status: 'active' | 'inactive' | 'past';
}

export interface Unit {
  id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  rentAmount: number;
  depositAmount: number;
  status: string;
  amenities?: string[];
  photos?: string[];
  property: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface Lease {
  id: string;
  unitId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  paymentDueDay: number;
  leaseType: 'fixed' | 'month-to-month';
  status: 'active' | 'expired' | 'terminated' | 'pending';
  documentUrl?: string;
  unit?: Unit;
}

export interface Payment {
  id: string;
  leaseId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'late' | 'partial';
  paymentMethod?: string;
  transactionId?: string;
}

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  photos?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Notification {
  id: string;
  type: 'payment' | 'maintenance' | 'lease' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  type: 'lease' | 'receipt' | 'notice' | 'other';
  title: string;
  description?: string;
  fileUrl: string;
  uploadedAt: string;
}

export type PropertyStatus = 'available' | 'occupied' | 'pending';
export type PropertyType = 'apartment' | 'house' | 'condo' | 'studio';
export type SqftUnit = 'sqft' | 'm2';

export type Amenity =
  | 'parking_street'
  | 'parking_garage'
  | 'parking_dedicated'
  | 'laundry_in_unit'
  | 'laundry_building'
  | 'laundry_none'
  | 'air_conditioning'
  | 'heating'
  | 'pet_cats'
  | 'pet_dogs'
  | 'pet_both'
  | 'pet_none'
  | 'furnished'
  | 'unfurnished'
  | 'balcony'
  | 'gym'
  | 'pool'
  | 'elevator'
  | 'wheelchair'
  | 'security'
  | 'storage';

export interface PropertyListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  depositAmount: number;
  minLeaseMonths: number;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  type: PropertyType;
  sqft: number;
  sqftUnit: SqftUnit;
  floor: number;
  yearBuilt: number;
  status: PropertyStatus;
  city: string;
  neighborhood: string;
  address: string;
  daysOnPlatform: number;
  availableDate: string;
  amenities: Amenity[];
  images: string[];
  description: string;
  virtualTourAvailable: boolean;
  videoTourUrl?: string;
  floorPlanUrl?: string;
  location: {
    lat: number;
    lng: number;
    mapX: number;
    mapY: number;
  };
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PhotoNote {
  id: string;
  room: string;
  uri?: string;
  location?: GeoPoint;
  timestamp: string;
  note?: string;
}

export interface CheckInStatus {
  qrScanned: boolean;
  qrData?: string;
  locationVerified: boolean;
  locationCoords?: GeoPoint;
  checkInTimestamp?: string;
  keyCollected: boolean;
  photos: PhotoNote[];
  damageNotes: string;
  welcomeSent: boolean;
  unitStatus: 'pending' | 'occupied';
}

export interface CheckOutStatus {
  initiated: boolean;
  checkOutTimestamp?: string;
  inspectionCompleted: boolean;
  photos: PhotoNote[];
  keyReturned: boolean;
  meterReading: string;
  forwardingAddress: string;
  unitStatus: 'occupied' | 'available';
}

export interface DepositDeduction {
  id: string;
  label: string;
  amount: number;
  evidence?: string;
}

export interface DepositTracking {
  amount: number;
  currency: string;
  status: 'held' | 'processing' | 'returned' | 'disputed';
  timelineDays: number;
  deductions: DepositDeduction[];
  returnDate?: string;
  disputeFiled: boolean;
}

export interface LeaseInfo {
  endDate: string;
  renewalReminderDays: number[];
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface ApplicantInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentAddress?: string;
}

export interface TenantApplication {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  unitNumber: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  applicant: ApplicantInfo;
  message?: string;
  status: ApplicationStatus;
  appliedOn: string;
}

export type PaymentMethodType = 'card' | 'mobile_money';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  brand?: string;
  last4?: string;
  expiry?: string;
  provider?: string;
  phone?: string;
  isDefault: boolean;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  methodId?: string;
  description: string;
  createdAt: string;
}

export type ReviewStatus = 'pending' | 'published' | 'hidden';

export interface ReviewCategoryRatings {
  overall: number;
  landlordResponsiveness: number;
  maintenanceQuality: number;
  buildingCleanliness: number;
  noiseLevel: number;
  safetySecurity: number;
  valueForMoney: number;
}

export interface ReviewPhoto {
  id: string;
  uri: string;
}

export interface LandlordResponse {
  message: string;
  respondedAt: string;
}

export interface Review {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  ratings: ReviewCategoryRatings;
  pros: string[];
  cons: string[];
  details?: string;
  photos: ReviewPhoto[];
  anonymous: boolean;
  authorId: string;
  authorName: string;
  status: ReviewStatus;
  verified: boolean;
  createdAt: string;
  updatedAt?: string;
  landlordResponse?: LandlordResponse;
  flagged: boolean;
}

export interface SearchFilters {
  city: string;
  neighborhood: string;
  radiusKm: number | null;
  priceMin: string;
  priceMax: string;
  currency: string;
  bedrooms: Array<'studio' | '1' | '2' | '3' | '4+'>;
  bathrooms: Array<'1' | '1.5' | '2' | '2.5' | '3+'>;
  propertyTypes: PropertyType[];
  sqftMin: string;
  sqftMax: string;
  sqftUnit: SqftUnit;
  availableNow: boolean;
  availableWithinDays: number | null;
  flexibleDates: boolean;
  amenities: Amenity[];
  drawAreaEnabled: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  alerts: {
    push: boolean;
    emailFrequency: 'off' | 'daily' | 'weekly';
    priceDrop: boolean;
    newInArea: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SearchHistoryItem {
  id: string;
  label: string;
  filters: SearchFilters;
  createdAt: string;
}

export interface ViewedPropertyItem {
  id: string;
  propertyId: string;
  title: string;
  createdAt: string;
}
