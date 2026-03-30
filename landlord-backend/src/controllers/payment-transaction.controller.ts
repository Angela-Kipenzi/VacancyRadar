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
];

export const getPaymentTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM payment_transactions WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json(result.rows.map((row) => ({
      id: row.id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      methodId: row.method_id,
      description: row.description,
      createdAt: row.created_at,
    })));
  } catch (error) {
    console.error('Get payment transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const createPaymentTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, currency, status, methodId, description } = req.body;

    const result = await pool.query(
      `INSERT INTO payment_transactions (
        tenant_id, amount, currency, status, method_id, description
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [req.userId, amount, currency || 'USD', status, methodId || null, description]
    );

    const row = result.rows[0];
    res.status(201).json({
      transaction: {
        id: row.id,
        amount: parseFloat(row.amount),
        currency: row.currency,
        status: row.status,
        methodId: row.method_id,
        description: row.description,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('Create payment transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};
