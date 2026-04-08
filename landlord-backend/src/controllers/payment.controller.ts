import { Response } from 'express';
import { body, param } from 'express-validator';
import { config } from '../config/index.js';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';
import { initiateStkPush, normalizeKenyanPhone } from '../services/mpesa.service.js';

type PaymentType = 'rent' | 'deposit';

const mapPayment = (row: Record<string, unknown>) => ({
  id: row.id as string,
  leaseId: row.lease_id as string | null,
  paymentType: (row.payment_type as PaymentType) || 'rent',
  amount: parseFloat(String(row.amount)),
  currency: (row.currency as string) || 'KES',
  dueDate: row.due_date as string,
  paidDate: row.paid_date as string | null,
  status: row.status as string,
  paymentMethod: row.payment_method as string | null,
  transactionId: row.transaction_id as string | null,
});

const mapTransaction = (row: Record<string, unknown>) => ({
  id: row.id as string,
  amount: parseFloat(String(row.amount)),
  currency: (row.currency as string) || 'KES',
  status: row.status as 'paid' | 'pending' | 'failed',
  methodId: row.method_id as string | null,
  paymentId: row.payment_id as string | null,
  purpose: (row.purpose as PaymentType | null) || null,
  provider: row.provider as string | null,
  phone: row.phone as string | null,
  checkoutRequestId: row.checkout_request_id as string | null,
  merchantRequestId: row.merchant_request_id as string | null,
  mpesaReceipt: row.mpesa_receipt as string | null,
  mpesaResultCode: row.mpesa_result_code as number | null,
  mpesaResultDesc: row.mpesa_result_desc as string | null,
  description: row.description as string,
  createdAt: row.created_at as string,
  completedAt: row.completed_at as string | null,
});

const sendTenantPaymentNotification = async (
  tenantId: string,
  title: string,
  message: string
) => {
  await pool.query(
    `INSERT INTO tenant_notifications (tenant_id, type, title, message)
     VALUES ($1, 'payment', $2, $3)`,
    [tenantId, title, message]
  );
};

export const paymentValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('status').optional().isIn(['pending', 'paid', 'late', 'partial']).withMessage('Invalid status'),
  body('currency').optional().isString(),
  body('leaseId').optional().isUUID().withMessage('Invalid lease ID'),
  body('paymentType').optional().isIn(['rent', 'deposit']).withMessage('Invalid payment type'),
];

export const payPaymentValidation = [
  body('status').optional().isIn(['pending', 'paid', 'late', 'partial']).withMessage('Invalid status'),
  body('paidDate').optional().isISO8601().withMessage('Valid paid date is required'),
  body('paymentMethod').optional().isString(),
  body('transactionId').optional().isString(),
];

export const mpesaStkPushValidation = [
  body('paymentId').optional().isUUID().withMessage('Invalid payment ID'),
  body('methodId').optional().isUUID().withMessage('Invalid payment method ID'),
  body('amount').optional().isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('phone').optional().isString(),
  body('purpose').optional().isIn(['rent', 'deposit']).withMessage('Invalid payment purpose'),
  body('description').optional().isString(),
];

export const mpesaStatusValidation = [
  param('transactionId').isUUID().withMessage('Invalid transaction ID'),
];

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT * FROM payments
       WHERE tenant_id = $1
       ORDER BY due_date DESC`,
      [req.userId]
    );

    res.json(result.rows.map(mapPayment));
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

    res.json(mapPayment(result.rows[0]));
  } catch (error) {
    console.error('Get next payment error:', error);
    res.status(500).json({ error: 'Failed to fetch next payment' });
  }
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      leaseId,
      paymentType,
      amount,
      dueDate,
      paidDate,
      status,
      paymentMethod,
      transactionId,
      currency,
    } = req.body as {
      leaseId?: string;
      paymentType?: PaymentType;
      amount: number;
      dueDate: string;
      paidDate?: string;
      status?: 'pending' | 'paid' | 'late' | 'partial';
      paymentMethod?: string;
      transactionId?: string;
      currency?: string;
    };

    let resolvedLeaseId = leaseId || null;
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
        tenant_id, lease_id, payment_type, amount, currency, due_date, paid_date,
        status, payment_method, transaction_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.userId,
        resolvedLeaseId,
        paymentType || 'rent',
        amount,
        currency || 'KES',
        dueDate,
        paidDate || null,
        status || 'pending',
        paymentMethod || null,
        transactionId || null,
      ]
    );

    res.status(201).json({ payment: mapPayment(result.rows[0]) });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

export const payPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paidDate, paymentMethod, transactionId } = req.body as {
      status?: 'pending' | 'paid' | 'late' | 'partial';
      paidDate?: string;
      paymentMethod?: string;
      transactionId?: string;
    };

    const paymentCheck = await pool.query(
      'SELECT id FROM payments WHERE id = $1 AND tenant_id = $2',
      [id, req.userId]
    );

    if (paymentCheck.rows.length === 0) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    const resolvedStatus = status || 'paid';
    const resolvedPaidDate =
      resolvedStatus === 'paid'
        ? paidDate || new Date().toISOString().slice(0, 10)
        : null;

    const result = await pool.query(
      `UPDATE payments
       SET status = $1,
           paid_date = $2,
           payment_method = COALESCE($3, payment_method),
           transaction_id = COALESCE($4, transaction_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND tenant_id = $6
       RETURNING *`,
      [
        resolvedStatus,
        resolvedPaidDate,
        paymentMethod || null,
        transactionId || null,
        id,
        req.userId,
      ]
    );

    res.json({ payment: mapPayment(result.rows[0]) });
  } catch (error) {
    console.error('Pay payment error:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
};

export const initiateMpesaStkPush = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!config.mpesa.enabled) {
      res.status(503).json({ error: 'M-Pesa is not enabled on this server' });
      return;
    }

    const { paymentId, methodId, amount, phone, purpose, description } = req.body as {
      paymentId?: string;
      methodId?: string;
      amount?: number;
      phone?: string;
      purpose?: PaymentType;
      description?: string;
    };

    let methodPhone: string | null = null;
    let provider: string | null = null;
    if (methodId) {
      const methodResult = await pool.query(
        `SELECT id, phone, provider, type
         FROM payment_methods
         WHERE id = $1 AND tenant_id = $2`,
        [methodId, req.userId]
      );

      if (methodResult.rows.length === 0) {
        res.status(404).json({ error: 'Payment method not found' });
        return;
      }

      const method = methodResult.rows[0];
      if (method.type !== 'mobile_money') {
        res.status(400).json({ error: 'Selected method is not mobile money' });
        return;
      }
      methodPhone = method.phone || null;
      provider = method.provider || 'M-Pesa';
    }

    const tenantResult = await pool.query('SELECT phone FROM tenants WHERE id = $1', [req.userId]);
    const tenantPhone = tenantResult.rows[0]?.phone as string | undefined;
    const rawPhone = phone || methodPhone || tenantPhone;
    if (!rawPhone) {
      res.status(400).json({ error: 'Phone number is required for M-Pesa payment' });
      return;
    }

    const normalizedPhone = normalizeKenyanPhone(rawPhone);
    if (!normalizedPhone) {
      res.status(400).json({
        error: 'Use a valid Kenyan phone number format (e.g. 0712345678 or 254712345678)',
      });
      return;
    }

    let resolvedAmount = amount;
    let resolvedPurpose: PaymentType = purpose || 'rent';
    let resolvedDescription = description || 'Rent payment';
    let resolvedCurrency = 'KES';

    if (paymentId) {
      const paymentResult = await pool.query(
        `SELECT id, amount, currency, status, payment_type, due_date
         FROM payments
         WHERE id = $1 AND tenant_id = $2`,
        [paymentId, req.userId]
      );

      if (paymentResult.rows.length === 0) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      const payment = paymentResult.rows[0];
      if (payment.status === 'paid') {
        res.status(400).json({ error: 'This payment is already settled' });
        return;
      }

      resolvedAmount = parseFloat(String(payment.amount));
      resolvedPurpose = (payment.payment_type as PaymentType) || resolvedPurpose;
      resolvedCurrency = (payment.currency as string) || resolvedCurrency;
      resolvedDescription =
        description ||
        `${resolvedPurpose === 'deposit' ? 'Security deposit' : 'Rent'} payment due ${String(
          payment.due_date
        )}`;
    }

    if (!resolvedAmount || resolvedAmount < 1) {
      res.status(400).json({ error: 'Provide a valid amount to pay with M-Pesa' });
      return;
    }

    const createdTxn = await pool.query(
      `INSERT INTO payment_transactions (
        tenant_id, amount, currency, status, method_id, payment_id, purpose, provider, phone, description, metadata
      )
      VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.userId,
        resolvedAmount,
        resolvedCurrency,
        methodId || null,
        paymentId || null,
        resolvedPurpose,
        provider || 'M-Pesa',
        normalizedPhone,
        resolvedDescription,
        JSON.stringify({ initiatedVia: 'mpesa_stk_push' }),
      ]
    );

    const txn = createdTxn.rows[0];
    const accountReference =
      resolvedPurpose === 'deposit' ? 'Security Deposit' : config.mpesa.accountReference;
    const stkResponse = await initiateStkPush({
      amount: resolvedAmount,
      phoneNumber: normalizedPhone,
      accountReference,
      transactionDesc: resolvedDescription,
    });

    if (stkResponse.ResponseCode !== '0') {
      await pool.query(
        `UPDATE payment_transactions
         SET status = 'failed',
             mpesa_result_code = $1,
             mpesa_result_desc = $2,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [
          stkResponse.errorCode ? parseInt(stkResponse.errorCode, 10) : null,
          stkResponse.errorMessage || stkResponse.ResponseDescription || 'M-Pesa request failed',
          txn.id,
        ]
      );

      res.status(400).json({
        error: stkResponse.errorMessage || stkResponse.ResponseDescription || 'M-Pesa request failed',
      });
      return;
    }

    const updatedTxn = await pool.query(
      `UPDATE payment_transactions
       SET checkout_request_id = $1,
           merchant_request_id = $2,
           mpesa_result_code = 0,
           mpesa_result_desc = $3
       WHERE id = $4
       RETURNING *`,
      [
        stkResponse.CheckoutRequestID || null,
        stkResponse.MerchantRequestID || null,
        stkResponse.ResponseDescription || 'STK push initiated',
        txn.id,
      ]
    );

    await sendTenantPaymentNotification(
      req.userId as string,
      'M-Pesa Payment Request',
      `STK push sent for ${resolvedPurpose} payment. Complete it on your phone.`
    );

    res.status(202).json({
      message: 'M-Pesa prompt sent to your phone',
      customerMessage: stkResponse.CustomerMessage,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      transaction: mapTransaction(updatedTxn.rows[0]),
    });
  } catch (error) {
    console.error('Initiate M-Pesa STK push error:', error);
    res.status(500).json({ error: 'Failed to initiate M-Pesa payment' });
  }
};

export const getMpesaTransactionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const result = await pool.query(
      `SELECT pt.*, p.status AS payment_status
       FROM payment_transactions pt
       LEFT JOIN payments p ON p.id = pt.payment_id
       WHERE pt.id = $1 AND pt.tenant_id = $2`,
      [transactionId, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const row = result.rows[0];
    res.json({
      transaction: mapTransaction(row),
      paymentStatus: (row.payment_status as string | null) || null,
    });
  } catch (error) {
    console.error('Get M-Pesa transaction status error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction status' });
  }
};

type MpesaCallbackMetadataItem = {
  Name: string;
  Value?: string | number;
};

const getMetadataValue = (
  metadata: MpesaCallbackMetadataItem[] | undefined,
  key: string
): string | null => {
  const found = metadata?.find((item) => item.Name === key);
  if (!found || found.Value === undefined || found.Value === null) {
    return null;
  }
  return String(found.Value);
};

export const handleMpesaCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stkCallback = req.body?.Body?.stkCallback as
      | {
          CheckoutRequestID?: string;
          ResultCode?: number;
          ResultDesc?: string;
          CallbackMetadata?: { Item?: MpesaCallbackMetadataItem[] };
        }
      | undefined;

    const checkoutRequestId = stkCallback?.CheckoutRequestID;
    if (!checkoutRequestId) {
      res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
      return;
    }

    const txnResult = await pool.query(
      `SELECT * FROM payment_transactions WHERE checkout_request_id = $1 LIMIT 1`,
      [checkoutRequestId]
    );

    if (txnResult.rows.length === 0) {
      res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
      return;
    }

    const txn = txnResult.rows[0];
    const resultCode = Number(stkCallback?.ResultCode ?? 1);
    const resultDesc = stkCallback?.ResultDesc || 'Callback processed';
    const metadata = stkCallback?.CallbackMetadata?.Item || [];
    const receipt = getMetadataValue(metadata, 'MpesaReceiptNumber');
    const callbackPhone = getMetadataValue(metadata, 'PhoneNumber');

    if (resultCode === 0) {
      const updatedTxn = await pool.query(
        `UPDATE payment_transactions
         SET status = 'paid',
             phone = COALESCE($1, phone),
             mpesa_receipt = $2,
             mpesa_result_code = $3,
             mpesa_result_desc = $4,
             metadata = COALESCE(metadata, '{}'::jsonb) || $5::jsonb,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [
          callbackPhone,
          receipt,
          resultCode,
          resultDesc,
          JSON.stringify({ callback: req.body }),
          txn.id,
        ]
      );

      if (txn.payment_id) {
        await pool.query(
          `UPDATE payments
           SET status = 'paid',
               paid_date = CURRENT_DATE,
               payment_method = 'M-Pesa',
               transaction_id = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND tenant_id = $3`,
          [updatedTxn.rows[0].id, txn.payment_id, txn.tenant_id]
        );
      }

      if (txn.purpose === 'deposit') {
        await pool.query(
          `INSERT INTO tenancy_states (tenant_id, deposit)
           VALUES ($1, $2::jsonb)
           ON CONFLICT (tenant_id)
           DO UPDATE SET
             deposit = COALESCE(tenancy_states.deposit, '{}'::jsonb) || EXCLUDED.deposit,
             updated_at = CURRENT_TIMESTAMP`,
          [
            txn.tenant_id,
            JSON.stringify({
              amount: parseFloat(String(txn.amount)),
              currency: txn.currency || 'KES',
              status: 'held',
              disputeFiled: false,
            }),
          ]
        );
      }

      await sendTenantPaymentNotification(
        txn.tenant_id as string,
        'Payment Successful',
        `${txn.purpose === 'deposit' ? 'Deposit' : 'Rent'} payment confirmed${
          receipt ? ` (Receipt: ${receipt})` : ''
        }.`
      );
    } else {
      await pool.query(
        `UPDATE payment_transactions
         SET status = 'failed',
             mpesa_result_code = $1,
             mpesa_result_desc = $2,
             metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [
          resultCode,
          resultDesc,
          JSON.stringify({ callback: req.body }),
          txn.id,
        ]
      );

      await sendTenantPaymentNotification(
        txn.tenant_id as string,
        'Payment Failed',
        `${txn.purpose === 'deposit' ? 'Deposit' : 'Rent'} payment failed: ${resultDesc}`
      );
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};
