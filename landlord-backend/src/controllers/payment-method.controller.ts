import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const paymentMethodValidation = [
  body('type').isIn(['card', 'mobile_money']).withMessage('Invalid method type'),
  body('label').trim().notEmpty().withMessage('Label is required'),
];

export const getPaymentMethods = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM payment_methods WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      label: row.label,
      brand: row.brand,
      last4: row.last4,
      expiry: row.expiry,
      provider: row.provider,
      phone: row.phone,
      isDefault: row.is_default,
    })));
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
};

export const createPaymentMethod = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      type,
      label,
      brand,
      last4,
      expiry,
      provider,
      phone,
      isDefault,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO payment_methods (
        tenant_id, type, label, brand, last4, expiry, provider, phone, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        req.userId,
        type,
        label,
        brand || null,
        last4 || null,
        expiry || null,
        provider || null,
        phone || null,
        !!isDefault,
      ]
    );

    if (isDefault) {
      await pool.query(
        `UPDATE payment_methods SET is_default = FALSE
         WHERE tenant_id = $1 AND id <> $2`,
        [req.userId, result.rows[0].id]
      );
    }

    const row = result.rows[0];
    res.status(201).json({
      method: {
        id: row.id,
        type: row.type,
        label: row.label,
        brand: row.brand,
        last4: row.last4,
        expiry: row.expiry,
        provider: row.provider,
        phone: row.phone,
        isDefault: row.is_default,
      },
    });
  } catch (error) {
    console.error('Create payment method error:', error);
    res.status(500).json({ error: 'Failed to create payment method' });
  }
};

export const deletePaymentMethod = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM payment_methods WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Payment method not found' });
      return;
    }

    res.json({ message: 'Payment method removed' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Failed to remove payment method' });
  }
};

export const setDefaultPaymentMethod = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const methodCheck = await pool.query(
      'SELECT id FROM payment_methods WHERE id = $1 AND tenant_id = $2',
      [id, req.userId]
    );

    if (methodCheck.rows.length === 0) {
      res.status(404).json({ error: 'Payment method not found' });
      return;
    }

    await pool.query(
      'UPDATE payment_methods SET is_default = FALSE WHERE tenant_id = $1',
      [req.userId]
    );
    await pool.query(
      'UPDATE payment_methods SET is_default = TRUE WHERE tenant_id = $1 AND id = $2',
      [req.userId, id]
    );

    res.json({ message: 'Default payment method updated' });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
};
