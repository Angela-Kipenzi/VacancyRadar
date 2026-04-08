import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const paymentTransactionValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('currency').optional().isString(),
  body('status').isIn(['paid', 'pending', 'failed']).withMessage('Invalid status'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('methodId').optional().isUUID().withMessage('Invalid method id'),
  body('paymentId').optional().isUUID().withMessage('Invalid payment id'),
  body('purpose').optional().isIn(['rent', 'deposit']).withMessage('Invalid purpose'),
  body('provider').optional().isString(),
  body('phone').optional().isString(),
];

const mapTransaction = (row: Record<string, unknown>) => ({
  id: row.id as string,
  amount: parseFloat(String(row.amount)),
  currency: row.currency as string,
  status: row.status as 'paid' | 'pending' | 'failed',
  methodId: (row.method_id as string) || undefined,
  paymentId: (row.payment_id as string) || undefined,
  purpose: (row.purpose as 'rent' | 'deposit') || undefined,
  provider: (row.provider as string) || undefined,
  phone: (row.phone as string) || undefined,
  checkoutRequestId: (row.checkout_request_id as string) || undefined,
  merchantRequestId: (row.merchant_request_id as string) || undefined,
  mpesaReceipt: (row.mpesa_receipt as string) || undefined,
  mpesaResultCode: (row.mpesa_result_code as number | null) ?? undefined,
  mpesaResultDesc: (row.mpesa_result_desc as string) || undefined,
  description: row.description as string,
  createdAt: row.created_at as string,
  completedAt: (row.completed_at as string) || undefined,
});

export const getPaymentTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM payment_transactions WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json(result.rows.map(mapTransaction));
  } catch (error) {
    console.error('Get payment transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const createPaymentTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, currency, status, methodId, paymentId, purpose, provider, phone, description } = req.body;

    const result = await pool.query(
      `INSERT INTO payment_transactions (
        tenant_id, amount, currency, status, method_id, payment_id, purpose, provider, phone, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.userId,
        amount,
        currency || 'KES',
        status,
        methodId || null,
        paymentId || null,
        purpose || null,
        provider || null,
        phone || null,
        description,
      ]
    );

    res.status(201).json({ transaction: mapTransaction(result.rows[0]) });
  } catch (error) {
    console.error('Create payment transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};
