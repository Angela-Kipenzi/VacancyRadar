import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Property, Unit, Application, Lease, Tenant, Notification, User } from '../types';
import {
  mockApplications,
  mockLeases,
  mockTenants,
  mockNotifications,
} from '../data/mockData';
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from '../lib/api';

interface AppContextType {
  user: User | null;
  properties: Property[];
  units: Unit[];
  applications: Application[];
  leases: Lease[];
  tenants: Tenant[];
  notifications: Notification[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  addUnit: (unit: Omit<Unit, 'id' | 'createdAt'>) => void;
  updateUnit: (id: string, unit: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;
  updateApplication: (id: string, application: Partial<Application>) => void;
  addLease: (lease: Omit<Lease, 'id' | 'createdAt'>) => void;
  updateLease: (id: string, lease: Partial<Lease>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type ApiUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
};

type ApiProperty = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  totalUnits: number;
  description?: string | null;
  amenities?: string[] | null;
  photoUrl?: string | null;
  createdAt: string;
};

type ApiUnit = {
  id: string;
  propertyId: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number | null;
  rentAmount: number;
  depositAmount: number;
  description?: string | null;
  photos?: string[] | null;
  amenities?: string[] | null;
  status: string;
  availableDate?: string | null;
  createdAt: string;
};

const defaultPropertyPhoto = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800';
const defaultUnitPhoto = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800';

const mapPropertyType = (value: string): 'apartment' | 'house' | 'condo' => {
  if (value === 'house' || value === 'condo') return value;
  return 'apartment';
};

const mapUnitStatusFromApi = (value: string): 'vacant' | 'occupied' | 'vacating' => {
  if (value === 'vacant' || value === 'occupied') return value;
  return 'vacating';
};

const mapUnitStatusToApi = (value: 'vacant' | 'occupied' | 'vacating'): 'vacant' | 'occupied' | 'pending' => {
  if (value === 'vacant' || value === 'occupied') return value;
  return 'pending';
};

const toFrontendUser = (user: ApiUser): User => ({
  id: user.id,
  email: user.email,
  name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
  phone: user.phone || '',
  createdAt: user.createdAt || new Date().toISOString(),
});

const toFrontendProperty = (property: ApiProperty): Property => ({
  id: property.id,
  name: property.name,
  address: {
    street: property.address,
    city: property.city,
    state: property.state,
    zipCode: property.zipCode,
  },
  type: mapPropertyType(property.propertyType),
  totalUnits: Number(property.totalUnits) || 0,
  description: property.description || '',
  photos: property.photoUrl ? [property.photoUrl] : [defaultPropertyPhoto],
  amenities: property.amenities || [],
  contactInfo: {
    phone: '',
    email: '',
  },
  createdAt: property.createdAt,
});

const toFrontendUnit = (unit: ApiUnit): Unit => ({
  id: unit.id,
  propertyId: unit.propertyId,
  unitNumber: unit.unitNumber,
  bedrooms: Number(unit.bedrooms) || 0,
  bathrooms: Number(unit.bathrooms) || 0,
  squareFeet: Number(unit.squareFeet) || 0,
  monthlyRent: Number(unit.rentAmount) || 0,
  securityDeposit: Number(unit.depositAmount) || 0,
  description: unit.description || '',
  photos: unit.photos && unit.photos.length > 0 ? unit.photos : [defaultUnitPhoto],
  amenities: unit.amenities || [],
  status: mapUnitStatusFromApi(unit.status),
  availabilityDate: unit.availableDate || '',
  qrCode: `QR-${unit.unitNumber}`,
  createdAt: unit.createdAt,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [leases, setLeases] = useState<Lease[]>(mockLeases);
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const loadDashboardData = async () => {
    const [apiProperties, apiUnits] = await Promise.all([
      apiRequest<ApiProperty[]>('/api/properties'),
      apiRequest<ApiUnit[]>('/api/units'),
    ]);
    setProperties(apiProperties.map(toFrontendProperty));
    setUnits(apiUnits.map(toFrontendUnit));
  };

  useEffect(() => {
    const initializeSession = async () => {
      const token = getAuthToken();
      if (!token) {
        return;
      }

      try {
        const currentUser = await apiRequest<ApiUser>('/api/auth/me');
        setUser(toFrontendUser(currentUser));
        await loadDashboardData();
      } catch (_error) {
        clearAuthToken();
        setUser(null);
        setProperties([]);
        setUnits([]);
      }
    };

    void initializeSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ token: string; user: ApiUser }>(
        '/api/auth/login',
        'POST',
        { email, password },
        null
      );
      setAuthToken(response.token);
      setUser(toFrontendUser(response.user));
      await loadDashboardData();
      return true;
    } catch (_error) {
      return false;
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setProperties([]);
    setUnits([]);
    setApplications(mockApplications);
    setLeases(mockLeases);
    setTenants(mockTenants);
    setNotifications(mockNotifications);
  };

  const addProperty = (property: Omit<Property, 'id' | 'createdAt'>) => {
    void (async () => {
      try {
        const response = await apiRequest<{ property: ApiProperty }>('/api/properties', 'POST', {
          name: property.name,
          address: property.address.street,
          city: property.address.city,
          state: property.address.state,
          zipCode: property.address.zipCode,
          propertyType: property.type,
          totalUnits: property.totalUnits,
          description: property.description,
          amenities: property.amenities,
          photoUrl: property.photos?.[0] || null,
        });
        setProperties((prev) => [toFrontendProperty(response.property), ...prev]);
      } catch (_error) {
        setProperties((prev) => [...prev, {
          ...property,
          id: `prop-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }]);
      }
    })();
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

    void (async () => {
      try {
        await apiRequest<{ property: ApiProperty }>(`/api/properties/${id}`, 'PUT', {
          name: updates.name,
          address: updates.address?.street,
          city: updates.address?.city,
          state: updates.address?.state,
          zipCode: updates.address?.zipCode,
          propertyType: updates.type,
          totalUnits: updates.totalUnits,
          description: updates.description,
          amenities: updates.amenities,
          photoUrl: updates.photos?.[0],
        });
      } catch (_error) {
        await loadDashboardData();
      }
    })();
  };

  const deleteProperty = (id: string) => {
    const previousProperties = properties;
    const previousUnits = units;

    setProperties((prev) => prev.filter((p) => p.id !== id));
    setUnits((prev) => prev.filter((u) => u.propertyId !== id));

    void (async () => {
      try {
        await apiRequest(`/api/properties/${id}`, 'DELETE');
      } catch (_error) {
        setProperties(previousProperties);
        setUnits(previousUnits);
      }
    })();
  };

  const addUnit = (unit: Omit<Unit, 'id' | 'createdAt'>) => {
    void (async () => {
      try {
        const response = await apiRequest<{ unit: ApiUnit }>('/api/units', 'POST', {
          propertyId: unit.propertyId,
          unitNumber: unit.unitNumber,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          squareFeet: unit.squareFeet,
          rentAmount: unit.monthlyRent,
          depositAmount: unit.securityDeposit,
          status: mapUnitStatusToApi(unit.status),
          availableDate: unit.availabilityDate || null,
          photos: unit.photos,
          amenities: unit.amenities,
          description: unit.description,
        });
        setUnits((prev) => [toFrontendUnit(response.unit), ...prev]);
      } catch (_error) {
        const fallback: Unit = {
          ...unit,
          id: `unit-${Date.now()}`,
          qrCode: `QR-${unit.unitNumber}-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        setUnits((prev) => [fallback, ...prev]);
      }
    })();
  };

  const updateUnit = (id: string, updates: Partial<Unit>) => {
    setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));

    void (async () => {
      try {
        await apiRequest(`/api/units/${id}`, 'PUT', {
          unitNumber: updates.unitNumber,
          bedrooms: updates.bedrooms,
          bathrooms: updates.bathrooms,
          squareFeet: updates.squareFeet,
          rentAmount: updates.monthlyRent,
          depositAmount: updates.securityDeposit,
          status: updates.status ? mapUnitStatusToApi(updates.status) : undefined,
          availableDate: updates.availabilityDate,
          photos: updates.photos,
          amenities: updates.amenities,
          description: updates.description,
        });
      } catch (_error) {
        await loadDashboardData();
      }
    })();
  };

  const deleteUnit = (id: string) => {
    const previousUnits = units;
    setUnits((prev) => prev.filter((u) => u.id !== id));

    void (async () => {
      try {
        await apiRequest(`/api/units/${id}`, 'DELETE');
      } catch (_error) {
        setUnits(previousUnits);
      }
    })();
  };

  const updateApplication = (id: string, updates: Partial<Application>) => {
    setApplications(applications.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  const addLease = (lease: Omit<Lease, 'id' | 'createdAt'>) => {
    const newLease: Lease = {
      ...lease,
      id: `lease-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLeases([...leases, newLease]);
  };

  const updateLease = (id: string, updates: Partial<Lease>) => {
    setLeases(leases.map(l => (l.id === id ? { ...l, ...updates } : l)));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(notifications.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const value: AppContextType = {
    user,
    properties,
    units,
    applications,
    leases,
    tenants,
    notifications,
    login,
    logout,
    addProperty,
    updateProperty,
    deleteProperty,
    addUnit,
    updateUnit,
    deleteUnit,
    updateApplication,
    addLease,
    updateLease,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
