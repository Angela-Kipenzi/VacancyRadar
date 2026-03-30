import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const paymentValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('status').optional().isIn(['pending', 'paid', 'late', 'partial']).withMessage('Invalid status'),
  body('currency').optional().isString(),
  body('leaseId').optional().isUUID().withMessage('Invalid lease ID'),
];

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT * FROM payments
       WHERE tenant_id = $1
       ORDER BY due_date DESC`,
      [req.userId]
    );

    const payments = result.rows.map((row) => ({
      id: row.id,
      leaseId: row.lease_id,
      amount: parseFloat(row.amount),
      dueDate: row.due_date,
      paidDate: row.paid_date,
      status: row.status,
      paymentMethod: row.payment_method,
      transactionId: row.transaction_id,
    }));

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const getNextPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT * FROM payments
       WHERE tenant_id = $1
         AND status IN ('pending', 'late', 'partial')
       ORDER BY due_date ASC
       LIMIT 1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.json(null);
      return;
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      leaseId: row.lease_id,
      amount: parseFloat(row.amount),
      dueDate: row.due_date,
      paidDate: row.paid_date,
      status: row.status,
      paymentMethod: row.payment_method,
      transactionId: row.transaction_id,
    });
  } catch (error) {
    console.error('Get next payment error:', error);
    res.status(500).json({ error: 'Failed to fetch next payment' });
  }
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      leaseId,
      amount,
      dueDate,
      paidDate,
      status,
      paymentMethod,
      transactionId,
      currency,
    } = req.body;

    let resolvedLeaseId = leaseId as string | null | undefined;
    if (resolvedLeaseId) {
      const leaseCheck = await pool.query(
        'SELECT id FROM leases WHERE id = $1 AND tenant_id = $2',
        [resolvedLeaseId, req.userId]
      );
      if (leaseCheck.rows.length === 0) {
        res.status(404).json({ error: 'Lease not found' });
        return;
      }
    } else {
      const leaseRes = await pool.query(
        'SELECT id FROM leases WHERE tenant_id = $1 ORDER BY start_date DESC LIMIT 1',
        [req.userId]
      );
      resolvedLeaseId = leaseRes.rows[0]?.id ?? null;
    }

    const result = await pool.query(
      `INSERT INTO payments (
        tenant_id, lease_id, amount, currency, due_date, paid_date,
        status, payment_method, transaction_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        req.userId,
        resolvedLeaseId,
        amount,
        currency || 'USD',
        dueDate,
        paidDate || null,
        status || 'pending',
        paymentMethod || null,
        transactionId || null,
      ]
    );

    const row = result.rows[0];
    res.status(201).json({
      payment: {
        id: row.id,
        leaseId: row.lease_id,
        amount: parseFloat(row.amount),
        dueDate: row.due_date,
        paidDate: row.paid_date,
        status: row.status,
        paymentMethod: row.payment_method,
        transactionId: row.transaction_id,
      },
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};
