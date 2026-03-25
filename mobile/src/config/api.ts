import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

// Declare __DEV__ global variable
declare const __DEV__: boolean;

// Configure your API base URL
export const API_BASE_URL = __DEV__ 
  ? 'http://10.13.1.251:5000/api'  // Development
  : 'https://production-api.com/api';  // Production

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
  
  // Tenant
  myLease: '/tenants/me/lease',
  myUnit: '/tenants/me/unit',
  
  // Payments
  payments: '/payments',
  makePayment: '/payments',
  
  // Maintenance
  maintenanceRequests: '/maintenance',
  createRequest: '/maintenance',
  
  // Notifications
  notifications: '/notifications',
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
