import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChecklistItem,
  CheckInStatus,
  CheckOutStatus,
  DepositTracking,
  LeaseInfo,
  PhotoNote,
  GeoPoint,
} from '../types';
import {
  cancelNotification,
  cancelNotifications,
  scheduleMoveInReminder,
  scheduleRenewalReminders,
} from '../services/notifications';
import { tenancyApi, TenancyOverviewResponse } from '../services/tenancyApi';

const STORAGE_KEY = 'tenancy_state';

const defaultChecklist: ChecklistItem[] = [
  { id: 'item-bring', label: 'Items to bring', completed: false },
  { id: 'utilities', label: 'Utilities to arrange', completed: false },
  { id: 'docs', label: 'Documents needed', completed: false },
  { id: 'contacts', label: 'Contact information', completed: false },
];

const defaultCheckIn: CheckInStatus = {
  qrScanned: false,
  locationVerified: false,
  checkInTimestamp: undefined,
  keyCollected: false,
  photos: [],
  damageNotes: '',
  welcomeSent: false,
  unitStatus: 'pending',
};

const defaultCheckOut: CheckOutStatus = {
  initiated: false,
  checkOutTimestamp: undefined,
  inspectionCompleted: false,
  photos: [],
  keyReturned: false,
  meterReading: '',
  forwardingAddress: '',
  unitStatus: 'occupied',
};

const defaultDeposit: DepositTracking = {
  amount: 1200,
  currency: 'USD',
  status: 'held',
  timelineDays: 30,
  deductions: [],
  returnDate: undefined,
  disputeFiled: false,
};

const defaultLeaseInfo: LeaseInfo = {
  endDate: '2026-12-31',
  renewalReminderDays: [60, 30, 15],
};

interface TenancyState {
  checklist: ChecklistItem[];
  reminderEnabled: boolean;
  leasePreviewed: boolean;
  checkIn: CheckInStatus;
  checkOut: CheckOutStatus;
  deposit: DepositTracking;
  leaseInfo: LeaseInfo;
  moveInDate: string;
  moveInReminderId?: string | null;
  renewalReminderIds: string[];
  propertyLocation?: GeoPoint;
  locationRadiusMeters: number;
}

const defaultState: TenancyState = {
  checklist: defaultChecklist,
  reminderEnabled: true,
  leasePreviewed: false,
  checkIn: defaultCheckIn,
  checkOut: defaultCheckOut,
  deposit: defaultDeposit,
  leaseInfo: defaultLeaseInfo,
  moveInDate: '2026-04-01',
  moveInReminderId: null,
  renewalReminderIds: [],
  propertyLocation: { lat: -1.2921, lng: 36.8219 },
  locationRadiusMeters: 250,
};

interface TenancyContextValue extends TenancyState {
  toggleChecklistItem: (id: string) => void;
  setReminderEnabled: (value: boolean) => void;
  toggleMoveInReminder: (value: boolean) => Promise<void>;
  scheduleRenewal: () => Promise<void>;
  setLeasePreviewed: (value: boolean) => void;
  setCheckInField: (updates: Partial<CheckInStatus>) => void;
  addCheckInPhoto: (room: string, uri?: string, location?: GeoPoint) => void;
  setDamageNotes: (value: string) => void;
  setCheckOutField: (updates: Partial<CheckOutStatus>) => void;
  addCheckOutPhoto: (room: string, uri?: string, location?: GeoPoint) => void;
  setForwardingAddress: (value: string) => void;
  setMeterReading: (value: string) => void;
  setDepositStatus: (status: DepositTracking['status']) => void;
  fileDispute: () => void;
  refreshTenancy: () => Promise<void>;
  syncCheckIn: (updates?: Partial<CheckInStatus>) => Promise<void>;
  syncCheckOut: (updates?: Partial<CheckOutStatus>) => Promise<void>;
  sendWelcomeNotification: () => Promise<void>;
}

const TenancyContext = createContext<TenancyContextValue | undefined>(undefined);

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const createPhotoNote = (room: string, uri?: string, location?: GeoPoint): PhotoNote => ({
  id: `photo-${Date.now()}`,
  room,
  uri,
  location,
  timestamp: new Date().toISOString(),
});

export const TenancyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TenancyState>(defaultState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        const stored = safeParse<TenancyState>(value, defaultState);
        setState(stored);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state]);

  const mergeRemoteState = (remote: TenancyOverviewResponse) => {
    setState((prev) => ({
      ...prev,
      ...remote,
      checklist: remote.checklist ?? prev.checklist,
      checkIn: { ...prev.checkIn, ...remote.checkIn },
      checkOut: { ...prev.checkOut, ...remote.checkOut },
      deposit: { ...prev.deposit, ...remote.deposit },
      leaseInfo: { ...prev.leaseInfo, ...remote.leaseInfo },
    }));
  };

  const refreshTenancy = async () => {
    const remote = await tenancyApi.fetchTenancyOverview();
    if (remote) {
      mergeRemoteState(remote);
    }
  };

  useEffect(() => {
    refreshTenancy().catch(() => undefined);
  }, []);

  const toggleChecklistItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const setReminderEnabled = (value: boolean) => {
    setState((prev) => ({ ...prev, reminderEnabled: value }));
  };

  const toggleMoveInReminder = async (value: boolean) => {
    if (!value && state.moveInReminderId) {
      await cancelNotification(state.moveInReminderId);
      setState((prev) => ({ ...prev, moveInReminderId: null, reminderEnabled: false }));
      return;
    }
    if (value) {
      const id = await scheduleMoveInReminder(state.moveInDate);
      setState((prev) => ({
        ...prev,
        moveInReminderId: id,
        reminderEnabled: !!id,
      }));
    }
  };

  const scheduleRenewal = async () => {
    if (state.renewalReminderIds.length) {
      await cancelNotifications(state.renewalReminderIds);
    }
    const ids = await scheduleRenewalReminders(state.leaseInfo.endDate, state.leaseInfo.renewalReminderDays);
    setState((prev) => ({ ...prev, renewalReminderIds: ids }));
  };

  const setLeasePreviewed = (value: boolean) => {
    setState((prev) => ({ ...prev, leasePreviewed: value }));
  };

  const setCheckInField = (updates: Partial<CheckInStatus>) => {
    setState((prev) => ({
      ...prev,
      checkIn: { ...prev.checkIn, ...updates },
    }));
  };

  const addCheckInPhoto = (room: string, uri?: string, location?: GeoPoint) => {
    setState((prev) => ({
      ...prev,
      checkIn: {
        ...prev.checkIn,
        photos: [createPhotoNote(room, uri, location), ...prev.checkIn.photos],
      },
    }));
    if (uri) {
      tenancyApi.uploadPhoto({ uri, room, stage: 'check-in' }).catch(() => undefined);
    }
  };

  const setDamageNotes = (value: string) => {
    setState((prev) => ({
      ...prev,
      checkIn: { ...prev.checkIn, damageNotes: value },
    }));
  };

  const setCheckOutField = (updates: Partial<CheckOutStatus>) => {
    setState((prev) => ({
      ...prev,
      checkOut: { ...prev.checkOut, ...updates },
    }));
  };

  const addCheckOutPhoto = (room: string, uri?: string, location?: GeoPoint) => {
    setState((prev) => ({
      ...prev,
      checkOut: {
        ...prev.checkOut,
        photos: [createPhotoNote(room, uri, location), ...prev.checkOut.photos],
      },
    }));
    if (uri) {
      tenancyApi.uploadPhoto({ uri, room, stage: 'check-out' }).catch(() => undefined);
    }
  };

  const setForwardingAddress = (value: string) => {
    setState((prev) => ({
      ...prev,
      checkOut: { ...prev.checkOut, forwardingAddress: value },
    }));
  };

  const setMeterReading = (value: string) => {
    setState((prev) => ({
      ...prev,
      checkOut: { ...prev.checkOut, meterReading: value },
    }));
  };

  const setDepositStatus = (status: DepositTracking['status']) => {
    setState((prev) => ({
      ...prev,
      deposit: { ...prev.deposit, status },
    }));
    tenancyApi.updateDepositStatus(status).catch(() => undefined);
  };

  const fileDispute = () => {
    setState((prev) => ({
      ...prev,
      deposit: { ...prev.deposit, status: 'disputed', disputeFiled: true },
    }));
    tenancyApi.fileDepositDispute().catch(() => undefined);
  };

  const syncCheckIn = async (updates?: Partial<CheckInStatus>) => {
    const payload = updates ? { ...state.checkIn, ...updates } : state.checkIn;
    await tenancyApi.updateCheckIn(payload);
  };

  const syncCheckOut = async (updates?: Partial<CheckOutStatus>) => {
    const payload = updates ? { ...state.checkOut, ...updates } : state.checkOut;
    await tenancyApi.updateCheckOut(payload);
  };

  const sendWelcomeNotification = async () => {
    await tenancyApi.sendWelcomeNotification({
      timestamp: state.checkIn.checkInTimestamp ?? new Date().toISOString(),
      unitStatus: state.checkIn.unitStatus,
    });
  };

  const value = useMemo(
    () => ({
      ...state,
      toggleChecklistItem,
      setReminderEnabled,
      setLeasePreviewed,
      setCheckInField,
      addCheckInPhoto,
      setDamageNotes,
      setCheckOutField,
      addCheckOutPhoto,
      setForwardingAddress,
      setMeterReading,
      setDepositStatus,
      fileDispute,
      refreshTenancy,
      syncCheckIn,
      syncCheckOut,
      sendWelcomeNotification,
      toggleMoveInReminder,
      scheduleRenewal,
    }),
    [state]
  );

  return <TenancyContext.Provider value={value}>{children}</TenancyContext.Provider>;
};

export const useTenancy = () => {
  const context = useContext(TenancyContext);
  if (!context) {
    throw new Error('useTenancy must be used within TenancyProvider');
  }
  return context;
};
