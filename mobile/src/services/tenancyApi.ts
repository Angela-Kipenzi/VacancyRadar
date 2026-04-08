import api, { endpoints } from '../config/api';
import { CheckInStatus, CheckOutStatus, DepositTracking } from '../types';

export interface TenancyOverviewResponse {
  checklist?: Array<{ id: string; label: string; completed: boolean }>;
  reminderEnabled?: boolean;
  leasePreviewed?: boolean;
  moveInDate?: string;
  propertyLocation?: { lat: number; lng: number };
  locationRadiusMeters?: number;
  checkIn?: Partial<CheckInStatus>;
  checkOut?: Partial<CheckOutStatus>;
  deposit?: Partial<DepositTracking>;
  leaseInfo?: { endDate?: string; renewalReminderDays?: number[] };
}

export const tenancyApi = {
  async fetchTenancyOverview(): Promise<TenancyOverviewResponse | null> {
    try {
      const response = await api.get(endpoints.tenancyOverview);
      return response.data;
    } catch {
      return null;
    }
  },

  async updateCheckIn(payload: CheckInStatus) {
    const response = await api.post(endpoints.checkIn, payload);
    return response.data;
  },

  async updateCheckOut(payload: CheckOutStatus) {
    try {
      await api.post(endpoints.checkOut, payload);
    } catch {
      return;
    }
  },

  async uploadPhoto(payload: { uri: string; room: string; stage: 'check-in' | 'check-out' }) {
    try {
      const data = new FormData();
      data.append('stage', payload.stage);
      data.append('room', payload.room);
      data.append('photo', {
        uri: payload.uri,
        name: `photo-${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      await api.post(endpoints.tenancyPhotoUpload, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch {
      return;
    }
  },

  async sendWelcomeNotification(payload: { timestamp: string; unitStatus: string }) {
    try {
      await api.post(endpoints.tenancyWelcome, payload);
    } catch {
      return;
    }
  },

  async updateDepositStatus(status: DepositTracking['status']) {
    try {
      await api.post(endpoints.tenancyDepositStatus, { status });
    } catch {
      return;
    }
  },

  async fileDepositDispute() {
    try {
      await api.post(endpoints.tenancyDepositDispute);
    } catch {
      return;
    }
  },
};
