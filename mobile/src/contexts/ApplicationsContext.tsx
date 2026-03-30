import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../config/api';
import { ApplicantInfo, TenantApplication, ApplicationStatus, PropertyListing } from '../types';

interface ApplicationsContextValue {
  applications: TenantApplication[];
  submitApplication: (property: PropertyListing, applicant: ApplicantInfo, message?: string) => void;
  withdrawApplication: (id: string) => void;
  getApplicationById: (id: string) => TenantApplication | undefined;
  updateStatus: (id: string, status: ApplicationStatus) => void;
}

const ApplicationsContext = createContext<ApplicationsContextValue | undefined>(undefined);

export const ApplicationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [applications, setApplications] = useState<TenantApplication[]>([]);

  const loadApplications = async () => {
    try {
      const response = await api.get('/applications/me');
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  useEffect(() => {
    loadApplications().catch(() => undefined);
  }, []);

  const submitApplication = (property: PropertyListing, applicant: ApplicantInfo, message?: string) => {
    void (async () => {
      try {
        await api.post('/applications/me', {
          unitId: property.id,
          applicant,
          message,
        });
        await loadApplications();
      } catch (error) {
        console.error('Error submitting application:', error);
      }
    })();
  };

  const withdrawApplication = (id: string) => {
    void (async () => {
      try {
        await api.patch(`/applications/me/${id}/withdraw`);
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: 'withdrawn' } : app))
        );
      } catch (error) {
        console.error('Error withdrawing application:', error);
      }
    })();
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
