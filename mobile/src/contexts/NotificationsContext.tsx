import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../config/api';

interface NotificationsContextValue {
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await api.get('/tenant-notifications/unread-count');
      if (response.data && typeof response.data.count === 'number') {
        setUnreadCount(response.data.count);
      } else {
        // Fallback: fetch all and count locally if endpoint doesn't exist
        const allRes = await api.get('/tenant-notifications');
        const count = (allRes.data || []).filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      }
    } catch {
      // Ignore errors for silent background refresh
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
    // Set up polling or listen for events here in a real app
    const intervalId = setInterval(refreshNotifications, 60000); // 1 minute
    return () => clearInterval(intervalId);
  }, [refreshNotifications]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
