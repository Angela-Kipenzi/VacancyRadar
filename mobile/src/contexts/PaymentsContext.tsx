import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaymentMethod, PaymentTransaction, PaymentMethodType } from '../types';

const STORAGE_KEY = 'tenant_payment_methods';
const TRANSACTION_KEY = 'tenant_payment_transactions';

const initialMethods: PaymentMethod[] = [
  {
    id: 'pm-1001',
    type: 'card',
    label: 'Visa •••• 4242',
    brand: 'Visa',
    last4: '4242',
    expiry: '08/27',
    isDefault: true,
  },
  {
    id: 'pm-1002',
    type: 'mobile_money',
    label: 'M-Pesa •••• 9843',
    provider: 'M-Pesa',
    phone: '+254 712 984 843',
    isDefault: false,
  },
];

const initialTransactions: PaymentTransaction[] = [
  {
    id: 'txn-1001',
    amount: 1200,
    currency: 'USD',
    status: 'paid',
    methodId: 'pm-1001',
    description: 'March Rent',
    createdAt: '2026-03-05',
  },
  {
    id: 'txn-1002',
    amount: 75,
    currency: 'USD',
    status: 'paid',
    methodId: 'pm-1002',
    description: 'Late Fee',
    createdAt: '2026-03-08',
  },
  {
    id: 'txn-1003',
    amount: 1200,
    currency: 'USD',
    status: 'pending',
    methodId: 'pm-1001',
    description: 'April Rent',
    createdAt: '2026-04-01',
  },
];

interface PaymentsContextValue {
  methods: PaymentMethod[];
  transactions: PaymentTransaction[];
  addMethod: (payload: Omit<PaymentMethod, 'id'>) => void;
  removeMethod: (id: string) => void;
  setDefaultMethod: (id: string) => void;
  addTransaction: (transaction: PaymentTransaction) => void;
}

const PaymentsContext = createContext<PaymentsContextValue | undefined>(undefined);

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const PaymentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(initialTransactions);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => setMethods(safeParse<PaymentMethod[]>(value, initialMethods)))
      .catch(() => undefined);
    AsyncStorage.getItem(TRANSACTION_KEY)
      .then((value) => setTransactions(safeParse<PaymentTransaction[]>(value, initialTransactions)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(methods)).catch(() => undefined);
  }, [methods]);

  useEffect(() => {
    AsyncStorage.setItem(TRANSACTION_KEY, JSON.stringify(transactions)).catch(() => undefined);
  }, [transactions]);

  const addMethod = (payload: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = {
      ...payload,
      id: `pm-${Date.now()}`,
    };
    setMethods((prev) => {
      if (newMethod.isDefault || prev.length === 0) {
        return [newMethod, ...prev.map((item) => ({ ...item, isDefault: false }))];
      }
      return [newMethod, ...prev];
    });
  };

  const removeMethod = (id: string) => {
    setMethods((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length > 0 && !next.some((item) => item.isDefault)) {
        next[0].isDefault = true;
      }
      return [...next];
    });
  };

  const setDefaultMethod = (id: string) => {
    setMethods((prev) => prev.map((item) => ({ ...item, isDefault: item.id === id })));
  };

  const addTransaction = (transaction: PaymentTransaction) => {
    setTransactions((prev) => [transaction, ...prev]);
  };

  const value = useMemo(
    () => ({ methods, transactions, addMethod, removeMethod, setDefaultMethod, addTransaction }),
    [methods, transactions]
  );

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
};

export const usePayments = () => {
  const context = useContext(PaymentsContext);
  if (!context) {
    throw new Error('usePayments must be used within PaymentsProvider');
  }
  return context;
};
