import { Response } from 'express';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

const upsertJson = async (
  tenantId: string,
  column: 'check_in' | 'check_out' | 'deposit' | 'lease_info' | 'checklist',
  payload: unknown
) => {
  await pool.query(
    `INSERT INTO tenancy_states (tenant_id, ${column})
     VALUES ($1, $2)
     ON CONFLICT (tenant_id)
     DO UPDATE SET ${column} = $2, updated_at = CURRENT_TIMESTAMP`,
    [tenantId, payload]
  );
};

export const getTenancyOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM tenancy_states WHERE tenant_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.json({});
      return;
    }

    const row = result.rows[0];
    res.json({
      checklist: row.checklist ?? undefined,
      reminderEnabled: row.reminder_enabled,
      leasePreviewed: row.lease_previewed,
      moveInDate: row.move_in_date,
      propertyLocation: row.property_location ?? undefined,
      locationRadiusMeters: row.location_radius_meters ?? undefined,
      checkIn: row.check_in ?? undefined,
      checkOut: row.check_out ?? undefined,
      deposit: row.deposit ?? undefined,
      leaseInfo: row.lease_info ?? undefined,
    });
  } catch (error) {
    console.error('Get tenancy overview error:', error);
    res.status(500).json({ error: 'Failed to fetch tenancy overview' });
  }
};

export const updateCheckIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await upsertJson(req.userId as string, 'check_in', req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Update check-in error:', error);
    res.status(500).json({ error: 'Failed to update check-in' });
  }
};

export const updateCheckOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await upsertJson(req.userId as string, 'check_out', req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Update check-out error:', error);
    res.status(500).json({ error: 'Failed to update check-out' });
  }
};

export const sendWelcomeNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT check_in FROM tenancy_states WHERE tenant_id = $1',
      [req.userId]
    );
    const current = result.rows[0]?.check_in || {};
    const next = {
      ...current,
      welcomeSent: true,
      checkInTimestamp: current.checkInTimestamp || req.body?.timestamp,
      unitStatus: req.body?.unitStatus || current.unitStatus,
    };
    await upsertJson(req.userId as string, 'check_in', next);
    res.json({ success: true });
  } catch (error) {
    console.error('Send welcome error:', error);
    res.status(500).json({ error: 'Failed to send welcome notification' });
  }
};

export const updateDepositStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status: string };
    const result = await pool.query(
      'SELECT deposit FROM tenancy_states WHERE tenant_id = $1',
      [req.userId]
    );
    const current = result.rows[0]?.deposit || {};
    const next = { ...current, status };
    await upsertJson(req.userId as string, 'deposit', next);
    res.json({ success: true });
  } catch (error) {
    console.error('Update deposit error:', error);
    res.status(500).json({ error: 'Failed to update deposit status' });
  }
};

export const fileDepositDispute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT deposit FROM tenancy_states WHERE tenant_id = $1',
      [req.userId]
    );
    const current = result.rows[0]?.deposit || {};
    const next = { ...current, status: 'disputed', disputeFiled: true };
    await upsertJson(req.userId as string, 'deposit', next);
    res.json({ success: true });
  } catch (error) {
    console.error('File dispute error:', error);
    res.status(500).json({ error: 'Failed to file dispute' });
  }
};

export const uploadTenancyPhoto = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true });
};
