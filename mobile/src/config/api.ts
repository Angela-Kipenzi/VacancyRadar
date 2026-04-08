import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Declare __DEV__ global variable
declare const __DEV__: boolean;

const getDevBaseUrl = () => {
  const expoConfig = (Constants.expoConfig ?? (Constants as any).manifest) as {
    hostUri?: string;
  } | null;
  const hostUri = expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : null;
  if (host) {
    return `http://${host}:5000/api`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

// Configure your API base URL
export const API_BASE_URL = __DEV__
  ? (process.env.EXPO_PUBLIC_API_URL ?? getDevBaseUrl())
  : 'https://production-api.com/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  profile: '/auth/me',

  //listings
  listings: '/listings',           // Get all available listings
  propertyDetails: (id: string) => `/listings/${id}`,
  vacantUnits: '/units/vacant',    // Get vacant units only
  searchListings: '/listings/search',
  
  // Tenant
  myLease: '/tenants/me/lease',
  signLease: '/tenants/me/lease/sign',
  tenantLeaseAgreement: '/tenants/me/lease/agreement',
  myUnit: '/tenants/me/unit',
  
  // Payments
  payments: '/payments',
  makePayment: '/payments',
  
  // Maintenance
  maintenanceRequests: '/maintenance',
  createRequest: '/maintenance',
  
  // Notifications
  notifications: '/notifications',
  tenantNotifications: '/tenant-notifications',
  markRead: (id: string) => `/notifications/${id}/read`,
  
  // Documents
  documents: '/documents',

  // Tenancy (adjust these to match your backend)
  tenancyOverview: '/tenancy/overview',
  checkIn: '/tenancy/check-in',
  checkOut: '/tenancy/check-out',
  tenancyPhotoUpload: '/tenancy/photos',
  tenancyWelcome: '/tenancy/check-in/welcome',
  tenancyDepositStatus: '/tenancy/deposit/status',
  tenancyDepositDispute: '/tenancy/deposit/dispute',
};
