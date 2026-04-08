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
    
    // Fetch actual deposit paid from transactions
    const depositResult = await pool.query(
      `SELECT SUM(amount) as paid_amount 
       FROM payment_transactions 
       WHERE tenant_id = $1 AND status = 'paid'
         AND (purpose = 'deposit' OR description ILIKE '%deposit%')`,
      [req.userId]
    );
    const paidAmount = parseFloat(depositResult.rows[0]?.paid_amount || '0');

    const depositObj = row.deposit || {};
    if (paidAmount > 0) {
      depositObj.amount = paidAmount;
    }

    res.json({
      checklist: row.checklist ?? undefined,
      reminderEnabled: row.reminder_enabled,
      leasePreviewed: row.lease_previewed,
      moveInDate: row.move_in_date,
      propertyLocation: row.property_location ?? undefined,
      locationRadiusMeters: row.location_radius_meters ?? undefined,
      checkIn: row.check_in ?? undefined,
      checkOut: row.check_out ?? undefined,
      deposit: depositObj,
      leaseInfo: row.lease_info ?? undefined,
    });
  } catch (error) {
    console.error('Get tenancy overview error:', error);
    res.status(500).json({ error: 'Failed to fetch tenancy overview' });
  }
};

export const updateCheckIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const unitId = payload.unitId;

    if (unitId) {
      // Authorization mechanism: Only allow if tenant has applied, signed lease, and made a payment
      const authCheck = await pool.query(
        `SELECT
          EXISTS(SELECT 1 FROM applications WHERE tenant_id = $2 AND unit_id = $1) as has_app,
          EXISTS(SELECT 1 FROM leases WHERE tenant_id = $2 AND unit_id = $1 AND signed_date IS NOT NULL) as has_lease,
          EXISTS(
            SELECT 1 FROM payments p 
            JOIN leases l ON p.lease_id = l.id 
            WHERE p.tenant_id = $2 AND l.unit_id = $1 AND p.status = 'paid'
          ) as has_payment`,
        [unitId, req.userId]
      );

      const auth = authCheck.rows[0];
      if (!auth?.has_app || !auth?.has_lease || !auth?.has_payment) {
        const missing = [];
        if (!auth?.has_app) missing.push('an application');
        if (!auth?.has_lease) missing.push('a signed lease');
        if (!auth?.has_payment) missing.push('a completed payment');
        res.status(403).json({ error: `Not authorized: Missing ${missing.join(', ')} for this unit.` });
        return;
      }

      // Locking mechanism: Check if another tenant is currently checked in to this unit
      const lockCheck = await pool.query(
        `SELECT tenant_id 
         FROM tenancy_states 
         WHERE check_in->>'unitId' = $1 
           AND tenant_id != $2
           AND (check_out IS NULL OR check_out->>'unitStatus' NOT IN ('available', 'vacant'))`,
        [unitId, req.userId]
      );

      if (lockCheck.rows.length > 0) {
        res.status(403).json({ error: 'Unit is currently occupied by another tenant' });
        return;
      }
    }

    const tenantData = await pool.query(
      `SELECT 
        tn.first_name, 
        tn.landlord_id,
        ts.check_in,
        u.unit_number,
        p.name as property_name
      FROM tenants tn
      LEFT JOIN tenancy_states ts ON ts.tenant_id = tn.id
      LEFT JOIN units u ON u.id = $2
      LEFT JOIN properties p ON p.id = u.property_id
      WHERE tn.id = $1`,
      [req.userId, unitId || null]
    );

    const tenantInfo = tenantData.rows[0];
    const currentCheckIn = tenantInfo?.check_in || {};
    const isFirstTimeScan = payload.qrScanned && !currentCheckIn.qrScanned;

    await upsertJson(req.userId as string, 'check_in', payload);

    let welcomeInfo = null;
    if (unitId && tenantInfo) {
      welcomeInfo = {
        propertyName: tenantInfo.property_name,
        unitNumber: tenantInfo.unit_number,
        firstName: tenantInfo.first_name,
      };

      if (isFirstTimeScan) {
        // Find QR Code for this unit
        const qrResult = await pool.query('SELECT id FROM qr_codes WHERE unit_id = $1', [unitId]);
        
        if (qrResult.rows.length > 0) {
          const qrCodeId = qrResult.rows[0].id;
          const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
          const scanTime = new Date().toISOString();
          
          // User Agent stores the friendly message for dashboard
          const scanMessage = `${tenantInfo.first_name} Scanned unit ${tenantInfo.unit_number} at ${scanTime}`;
          
          // Log scan and update count
          await pool.query(
            `INSERT INTO qr_scans (qr_code_id, ip_address, user_agent, scanned_at) VALUES ($1, $2, $3, $4)`,
             [qrCodeId, ipAddress, scanMessage, scanTime]
          );
          await pool.query('UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1', [qrCodeId]);

          // Landlord Notification
          if (tenantInfo.landlord_id) {
            await pool.query(
              `INSERT INTO notifications (user_id, type, title, message) VALUES ($1, 'general', 'New Check-in', $2)`,
              [tenantInfo.landlord_id, `${tenantInfo.first_name} Checked-in to unit ${tenantInfo.unit_number} Successfully`]
            );
          }

          // Tenant Notification
          await pool.query(
            `INSERT INTO tenant_notifications (tenant_id, type, title, message) VALUES ($1, 'general', 'Check-in Successful', $2)`,
            [req.userId, `Welcome to ${tenantInfo.property_name} - Unit ${tenantInfo.unit_number}`]
          );
        }
      }
    }

    res.json({ success: true, welcomeInfo });
  } catch (error) {
    console.error('Update check-in error:', error);
    res.status(500).json({ error: 'Failed to update check-in' });
  }
};

export const updateCheckOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const nextState = req.body;

    // Get current state to detect changes
    const currentResult = await pool.query(
      'SELECT check_out, (SELECT landlord_id FROM tenants WHERE id = $1) as landlord_id, (SELECT first_name FROM tenants WHERE id = $1) as first_name, (SELECT u.unit_number FROM tenants t JOIN units u ON t.unit_id = u.id WHERE t.id = $1) as unit_number, (SELECT p.name FROM tenants t JOIN units u ON t.unit_id = u.id JOIN properties p ON u.property_id = p.id WHERE t.id = $1) as property_name FROM tenancy_states WHERE tenant_id = $1',
      [userId]
    );
    
    const currentState = currentResult.rows[0]?.check_out || {};
    const tenantInfo = currentResult.rows[0] || {};
    const landlordId = tenantInfo.landlord_id;

    await upsertJson(userId, 'check_out', nextState);

    // Notification Logic
    const triggers = [
      { field: 'initiated', title: 'Check-out Initiated', landlordMsg: `${tenantInfo.first_name} initiated check-out for Unit ${tenantInfo.unit_number}`, tenantMsg: `You initiated check-out for ${tenantInfo.property_name}` },
      { field: 'inspectionCompleted', title: 'Inspection Complete', landlordMsg: `Move-out inspection complete for Unit ${tenantInfo.unit_number}`, tenantMsg: `Move-out inspection complete for ${tenantInfo.property_name}` },
      { field: 'keyReturned', title: 'Key Returned', landlordMsg: `Key returned for Unit ${tenantInfo.unit_number}`, tenantMsg: `Key return confirmed for ${tenantInfo.property_name}` },
    ];

    for (const trigger of triggers) {
      if (nextState[trigger.field] && !currentState[trigger.field]) {
        // Send to Landlord
        if (landlordId) {
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, message) VALUES ($1, 'general', $2, $3)`,
            [landlordId, trigger.title, trigger.landlordMsg]
          );
        }
        // Send to Tenant
        await pool.query(
          `INSERT INTO tenant_notifications (tenant_id, type, title, message) VALUES ($1, 'general', $2, $3)`,
          [userId, trigger.title, trigger.tenantMsg]
        );
      }
    }

    // Final Success Trigger
    if (nextState.unitStatus === 'available' && currentState.unitStatus !== 'available') {
      const finalTitle = 'Checkout Successful';
      if (landlordId) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message) VALUES ($1, 'general', $2, $3)`,
          [landlordId, finalTitle, `Tenant ${tenantInfo.first_name} checkout successfully at ${new Date().toLocaleString()}`]
        );
      }
      await pool.query(
        `INSERT INTO tenant_notifications (tenant_id, type, title, message) VALUES ($1, 'general', $2, $3)`,
        [userId, finalTitle, `You successfully check out of ${tenantInfo.property_name} unit ${tenantInfo.unit_number}`]
      );
    }

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
