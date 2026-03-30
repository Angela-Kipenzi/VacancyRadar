import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Property, Unit, Application, Lease, Tenant, Notification, User } from '../types';
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

type ApiApplication = {
  id: string;
  unitId: string;
  unitNumber?: string;
  propertyName?: string;
  propertyAddress?: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  currentAddress?: string | null;
  employmentStatus?: string | null;
  employerName?: string | null;
  annualIncome?: number | null;
  moveInDate?: string | null;
  numOccupants?: number | null;
  hasPets?: boolean | null;
  petDetails?: string | null;
  status: string;
  notes?: string | null;
  documents?: any;
  submittedAt?: string;
  createdAt?: string;
};

type ApiLease = {
  id: string;
  unitId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  paymentDueDay: number;
  leaseType: string;
  status: string;
  documentUrl?: string | null;
  signedDate?: string | null;
  notes?: string | null;
  tenant?: { id: string };
  createdAt?: string;
};

type ApiTenant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  moveInDate?: string | null;
  moveOutDate?: string | null;
  status: string;
  currentUnit?: {
    unitNumber?: string;
    propertyName?: string;
    leaseId?: string;
  } | null;
  createdAt?: string;
};

type ApiNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
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
  qrCode: '',
  createdAt: unit.createdAt,
});

const mapApplicationStatus = (status: string): Application['status'] => {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'withdrawn') return 'rejected';
  return 'pending';
};

const toFrontendApplication = (
  application: ApiApplication,
  unitsList: Unit[],
  propertiesList: Property[]
): Application => {
  const nameParts = application.applicantName.split(' ').filter(Boolean);
  const firstName = nameParts[0] || 'Applicant';
  const lastName = nameParts.slice(1).join(' ') || '';
  const unit = unitsList.find((item) => item.id === application.unitId);
  const property = unit
    ? propertiesList.find((item) => item.id === unit.propertyId)
    : propertiesList.find((item) => item.name === application.propertyName);
  let docs: any[] = [];
  if (Array.isArray(application.documents)) {
    docs = application.documents;
  } else if (application.documents) {
    try {
      docs = JSON.parse(application.documents);
    } catch {
      docs = [];
    }
  }

  return {
    id: application.id,
    unitId: application.unitId,
    propertyId: property?.id || unit?.propertyId || '',
    applicant: {
      firstName,
      lastName,
      email: application.applicantEmail,
      phone: application.applicantPhone,
      currentAddress: application.currentAddress || '',
    },
    employment: {
      employer: application.employerName || '',
      position: application.employmentStatus || '',
      income: Number(application.annualIncome || 0),
      yearsEmployed: 0,
    },
    rentalHistory: [],
    documents: (docs || []).map((doc: any, index: number) => ({
      id: doc.id || `doc-${application.id}-${index}`,
      name: doc.name || 'Document',
      url: doc.url || '',
      type: doc.type || 'file',
    })),
    coverLetter: application.notes || '',
    status: mapApplicationStatus(application.status),
    submittedAt: application.submittedAt || application.createdAt || new Date().toISOString(),
    notes: application.notes ? [application.notes] : [],
  };
};

const toFrontendLease = (lease: ApiLease, unitsList: Unit[]): Lease => {
  const unit = unitsList.find((item) => item.id === lease.unitId);
  return {
    id: lease.id,
    unitId: lease.unitId,
    propertyId: unit?.propertyId || '',
    tenantId: lease.tenant?.id || '',
    startDate: lease.startDate,
    endDate: lease.endDate,
    monthlyRent: Number(lease.rentAmount || 0),
    securityDeposit: Number(lease.depositAmount || 0),
    terms: lease.notes || lease.leaseType || '',
    status: lease.status as Lease['status'],
    signedAt: lease.signedDate || null,
    signatureStatus: lease.signedDate ? 'signed' : 'pending',
    documentUrl: lease.documentUrl || '',
    createdAt: lease.createdAt || new Date().toISOString(),
  };
};

const mapTenantStatus = (status: string): Tenant['status'] => {
  if (status === 'past') return 'past';
  return 'current';
};

const toFrontendTenant = (
  tenant: ApiTenant,
  unitsList: Unit[],
  propertiesList: Property[]
): Tenant => {
  const currentUnit = tenant.currentUnit;
  const matchingProperty = currentUnit?.propertyName
    ? propertiesList.find((item) => item.name === currentUnit.propertyName)
    : undefined;
  const matchingUnit = matchingProperty
    ? unitsList.find((item) => item.propertyId === matchingProperty.id && item.unitNumber === currentUnit?.unitNumber)
    : undefined;

  return {
    id: tenant.id,
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    email: tenant.email,
    phone: tenant.phone,
    currentUnitId: matchingUnit?.id || null,
    currentLeaseId: currentUnit?.leaseId || null,
    moveInDate: tenant.moveInDate || null,
    moveOutDate: tenant.moveOutDate || null,
    status: mapTenantStatus(tenant.status),
    createdAt: tenant.createdAt || new Date().toISOString(),
  };
};

const mapNotificationType = (value: string): Notification['type'] => {
  if (value === 'application') return 'application';
  if (value === 'lease') return 'lease_signed';
  if (value === 'maintenance') return 'system';
  if (value === 'payment') return 'system';
  return 'system';
};

const toFrontendNotification = (notification: ApiNotification): Notification => ({
  id: notification.id,
  type: mapNotificationType(notification.type),
  title: notification.title,
  message: notification.message,
  read: notification.isRead,
  createdAt: notification.createdAt,
  relatedId: notification.link || undefined,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadDashboardData = async () => {
    const [
      apiProperties,
      apiUnits,
      apiApplications,
      apiLeases,
      apiTenants,
      apiNotifications,
    ] = await Promise.all([
      apiRequest<ApiProperty[]>('/api/properties'),
      apiRequest<ApiUnit[]>('/api/units'),
      apiRequest<ApiApplication[]>('/api/applications'),
      apiRequest<ApiLease[]>('/api/leases'),
      apiRequest<ApiTenant[]>('/api/tenants'),
      apiRequest<ApiNotification[]>('/api/notifications'),
    ]);

    const nextProperties = apiProperties.map(toFrontendProperty);
    const nextUnits = apiUnits.map(toFrontendUnit);
    setProperties(nextProperties);
    setUnits(nextUnits);
    setApplications(apiApplications.map((app) => toFrontendApplication(app, nextUnits, nextProperties)));
    setLeases(apiLeases.map((lease) => toFrontendLease(lease, nextUnits)));
    setTenants(apiTenants.map((tenant) => toFrontendTenant(tenant, nextUnits, nextProperties)));
    setNotifications(apiNotifications.map(toFrontendNotification));
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
        setApplications([]);
        setLeases([]);
        setTenants([]);
        setNotifications([]);
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
    setApplications([]);
    setLeases([]);
    setTenants([]);
    setNotifications([]);
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
          qrCode: '',
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
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));

    void (async () => {
      try {
        if (updates.status) {
          await apiRequest(`/api/applications/${id}/status`, 'PATCH', {
            status: updates.status,
          });
        }
      } catch (_error) {
        await loadDashboardData();
      }
    })();
  };

  const addLease = (lease: Omit<Lease, 'id' | 'createdAt'>) => {
    void (async () => {
      try {
        const response = await apiRequest<{ lease: ApiLease }>('/api/leases', 'POST', {
          unitId: lease.unitId,
          tenantId: lease.tenantId,
          startDate: lease.startDate,
          endDate: lease.endDate,
          rentAmount: lease.monthlyRent,
          depositAmount: lease.securityDeposit,
          paymentDueDay: 1,
          leaseType: lease.terms ? 'fixed' : 'month-to-month',
          documentUrl: lease.documentUrl || null,
          signedDate: lease.signedAt || null,
          notes: lease.terms || null,
        });
        if (response.lease) {
          setLeases((prev) => [toFrontendLease(response.lease, units), ...prev]);
        } else {
          await loadDashboardData();
        }
      } catch (_error) {
        const fallback: Lease = {
          ...lease,
          id: `lease-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        setLeases((prev) => [...prev, fallback]);
      }
    })();
  };

  const updateLease = (id: string, updates: Partial<Lease>) => {
    setLeases((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));

    void (async () => {
      try {
        await apiRequest(`/api/leases/${id}`, 'PUT', {
          startDate: updates.startDate,
          endDate: updates.endDate,
          rentAmount: updates.monthlyRent,
          depositAmount: updates.securityDeposit,
          leaseType: updates.terms ? 'fixed' : undefined,
          status: updates.status,
          documentUrl: updates.documentUrl,
          signedDate: updates.signedAt,
          notes: updates.terms,
        });
      } catch (_error) {
        await loadDashboardData();
      }
    })();
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    void (async () => {
      try {
        await apiRequest(`/api/notifications/${id}/read`, 'PATCH');
      } catch (_error) {
        await loadDashboardData();
      }
    })();
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void (async () => {
      try {
        await apiRequest('/api/notifications/read/all', 'PATCH');
      } catch (_error) {
        await loadDashboardData();
      }
    })();
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
