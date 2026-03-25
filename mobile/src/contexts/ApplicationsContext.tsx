import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApplicantInfo, TenantApplication, ApplicationStatus, PropertyListing } from '../types';
import { mockProperties } from '../data/mockProperties';

const STORAGE_KEY = 'tenant_applications';

const sampleApplications: TenantApplication[] = [
  {
    id: 'app-1001',
    propertyId: mockProperties[0]?.id ?? 'prop-1001',
    propertyName: mockProperties[0]?.title ?? '123 Main St',
    propertyAddress: `${mockProperties[0]?.address ?? '123 Main St'}, ${
      mockProperties[0]?.city ?? 'Brookside'
    }`,
    unitNumber: mockProperties[0]?.unitNumber ?? '2B',
    monthlyRent: mockProperties[0]?.price ?? 1200,
    bedrooms: mockProperties[0]?.bedrooms ?? 1,
    bathrooms: mockProperties[0]?.bathrooms ?? 1,
    applicant: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@email.com',
      phone: '(555) 123-4567',
      currentAddress: '789 Pine St, City, State',
    },
    message:
      "Hi, I'm very interested in this unit. I work nearby and would love to schedule a viewing.",
    status: 'pending',
    appliedOn: '2026-03-15',
  },
  {
    id: 'app-1002',
    propertyId: mockProperties[1]?.id ?? 'prop-1002',
    propertyName: mockProperties[1]?.title ?? '456 Oak Ave',
    propertyAddress: `${mockProperties[1]?.address ?? '456 Oak Ave'}, ${
      mockProperties[1]?.city ?? 'Brookside'
    }`,
    unitNumber: mockProperties[1]?.unitNumber ?? '1A',
    monthlyRent: mockProperties[1]?.price ?? 1100,
    bedrooms: mockProperties[1]?.bedrooms ?? 1,
    bathrooms: mockProperties[1]?.bathrooms ?? 1,
    applicant: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@email.com',
      phone: '(555) 123-4567',
      currentAddress: '789 Pine St, City, State',
    },
    status: 'approved',
    appliedOn: '2026-03-10',
  },
  {
    id: 'app-1003',
    propertyId: mockProperties[2]?.id ?? 'prop-1003',
    propertyName: mockProperties[2]?.title ?? '789 Pine Rd',
    propertyAddress: `${mockProperties[2]?.address ?? '789 Pine Rd'}, ${
      mockProperties[2]?.city ?? 'Brookside'
    }`,
    unitNumber: mockProperties[2]?.unitNumber ?? '3C',
    monthlyRent: mockProperties[2]?.price ?? 1400,
    bedrooms: mockProperties[2]?.bedrooms ?? 2,
    bathrooms: mockProperties[2]?.bathrooms ?? 2,
    applicant: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@email.com',
      phone: '(555) 123-4567',
      currentAddress: '789 Pine St, City, State',
    },
    status: 'rejected',
    appliedOn: '2026-03-05',
  },
];

interface ApplicationsContextValue {
  applications: TenantApplication[];
  submitApplication: (property: PropertyListing, applicant: ApplicantInfo, message?: string) => void;
  withdrawApplication: (id: string) => void;
  getApplicationById: (id: string) => TenantApplication | undefined;
  updateStatus: (id: string, status: ApplicationStatus) => void;
}

const ApplicationsContext = createContext<ApplicationsContextValue | undefined>(undefined);

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const ApplicationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [applications, setApplications] = useState<TenantApplication[]>(sampleApplications);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        const stored = safeParse<TenantApplication[]>(value, sampleApplications);
        setApplications(stored);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(applications)).catch(() => undefined);
  }, [applications]);

  const submitApplication = (property: PropertyListing, applicant: ApplicantInfo, message?: string) => {
    const appliedOn = new Date().toISOString().slice(0, 10);
    const newApplication: TenantApplication = {
      id: `app-${Date.now()}`,
      propertyId: property.id,
      propertyName: property.title,
      propertyAddress: `${property.address}, ${property.city}`,
      unitNumber: property.unitNumber,
      monthlyRent: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      applicant,
      message,
      status: 'pending',
      appliedOn,
    };
    setApplications((prev) => [newApplication, ...prev]);
  };

  const withdrawApplication = (id: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: 'withdrawn' } : app))
    );
  };

  const updateStatus = (id: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app))
    );
  };

  const getApplicationById = (id: string) => applications.find((app) => app.id === id);

  const value = useMemo(
    () => ({ applications, submitApplication, withdrawApplication, getApplicationById, updateStatus }),
    [applications]
  );

  return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
};

export const useApplications = () => {
  const context = useContext(ApplicationsContext);
  if (!context) {
    throw new Error('useApplications must be used within ApplicationsProvider');
  }
  return context;
};
