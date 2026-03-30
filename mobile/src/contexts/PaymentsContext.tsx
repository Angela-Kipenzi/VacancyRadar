import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../config/api';
import { PaymentMethod, PaymentTransaction } from '../types';

interface PaymentsContextValue {
  methods: PaymentMethod[];
  transactions: PaymentTransaction[];
  addMethod: (payload: Omit<PaymentMethod, 'id'>) => void;
  removeMethod: (id: string) => void;
  setDefaultMethod: (id: string) => void;
  addTransaction: (transaction: PaymentTransaction) => void;
}

const PaymentsContext = createContext<PaymentsContextValue | undefined>(undefined);

export const PaymentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);

  const loadMethods = async () => {
    try {
      const response = await api.get('/payment-methods');
      setMethods(response.data || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await api.get('/payment-transactions');
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  useEffect(() => {
    loadMethods().catch(() => undefined);
    loadTransactions().catch(() => undefined);
  }, []);

  const addMethod = (payload: Omit<PaymentMethod, 'id'>) => {
    void (async () => {
      try {
        const response = await api.post('/payment-methods', payload);
        if (response.data?.method) {
          setMethods((prev) => [response.data.method, ...prev.filter((m) => m.id !== response.data.method.id)]);
        } else {
          await loadMethods();
        }
      } catch (error) {
        console.error('Error adding payment method:', error);
      }
    })();
  };

  const removeMethod = (id: string) => {
    void (async () => {
      try {
        await api.delete(`/payment-methods/${id}`);
        setMethods((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error('Error removing payment method:', error);
      }
    })();
  };

  const setDefaultMethod = (id: string) => {
    void (async () => {
      try {
        await api.patch(`/payment-methods/${id}/default`);
        setMethods((prev) => prev.map((item) => ({ ...item, isDefault: item.id === id })));
      } catch (error) {
        console.error('Error setting default method:', error);
      }
    })();
  };

  const addTransaction = (transaction: PaymentTransaction) => {
    void (async () => {
      try {
        const response = await api.post('/payment-transactions', {
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          methodId: transaction.methodId,
          description: transaction.description,
        });
        if (response.data?.transaction) {
          setTransactions((prev) => [response.data.transaction, ...prev]);
        } else {
          await loadTransactions();
        }
      } catch (error) {
        console.error('Error adding transaction:', error);
      }
    })();
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
