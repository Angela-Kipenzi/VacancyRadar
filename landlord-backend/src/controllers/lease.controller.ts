import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

// Validation rules
export const leaseValidation = [
  body('unitId').isUUID().withMessage('Valid unit ID is required'),
  body('tenantId').isUUID().withMessage('Valid tenant ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('rentAmount').isFloat({ min: 0 }).withMessage('Rent amount must be positive'),
  body('depositAmount').isFloat({ min: 0 }).withMessage('Deposit amount must be positive'),
  body('paymentDueDay').isInt({ min: 1, max: 31 }).withMessage('Payment due day must be between 1-31'),
  body('leaseType').isIn(['fixed', 'month-to-month']).withMessage('Invalid lease type'),
];

// Get all leases for landlord
export const getLeases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, unitId } = req.query;

    let query = `
      SELECT l.*, 
        u.unit_number, p.name as property_name, p.address as property_address,
        t.first_name as tenant_first_name, t.last_name as tenant_last_name,
        t.email as tenant_email, t.phone as tenant_phone
      FROM leases l
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id
      WHERE p.landlord_id = $1
    `;

    const params: any[] = [req.userId];

    if (status) {
      query += ` AND l.status = $${params.length + 1}`;
      params.push(status);
    }

    if (unitId) {
      query += ` AND l.unit_id = $${params.length + 1}`;
      params.push(unitId);
    }

    query += ' ORDER BY l.start_date DESC';

    const result = await pool.query(query, params);

    const leases = result.rows.map((row:any) => ({
      id: row.id,
      unitId: row.unit_id,
      unitNumber: row.unit_number,
      propertyName: row.property_name,
      propertyAddress: row.property_address,
      tenant: {
        id: row.tenant_id,
        firstName: row.tenant_first_name,
        lastName: row.tenant_last_name,
        email: row.tenant_email,
        phone: row.tenant_phone,
      },
      startDate: row.start_date,
      endDate: row.end_date,
      rentAmount: parseFloat(row.rent_amount),
      depositAmount: parseFloat(row.deposit_amount),
      paymentDueDay: row.payment_due_day,
      leaseType: row.lease_type,
      status: row.status,
      documentUrl: row.document_url,
      signedDate: row.signed_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(leases);
  } catch (error) {
    console.error('Get leases error:', error);
    res.status(500).json({ error: 'Failed to fetch leases' });
  }
};

// Get single lease
export const getLease = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT l.*, 
        u.unit_number, u.bedrooms, u.bathrooms, u.square_feet,
        p.id as property_id, p.name as property_name, p.address as property_address,
        t.first_name as tenant_first_name, t.last_name as tenant_last_name,
        t.email as tenant_email, t.phone as tenant_phone,
        t.emergency_contact_name, t.emergency_contact_phone
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       JOIN tenants t ON l.tenant_id = t.id
       WHERE l.id = $1 AND p.landlord_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Lease not found' });
      return;
    }

    const row = result.rows[0];
    const lease = {
      id: row.id,
      unitId: row.unit_id,
      propertyId: row.property_id,
      unit: {
        unitNumber: row.unit_number,
        bedrooms: row.bedrooms,
        bathrooms: parseFloat(row.bathrooms),
        squareFeet: row.square_feet,
      },
      property: {
        name: row.property_name,
        address: row.property_address,
      },
      tenant: {
        id: row.tenant_id,
        firstName: row.tenant_first_name,
        lastName: row.tenant_last_name,
        email: row.tenant_email,
        phone: row.tenant_phone,
        emergencyContactName: row.emergency_contact_name,
        emergencyContactPhone: row.emergency_contact_phone,
      },
      startDate: row.start_date,
      endDate: row.end_date,
      rentAmount: parseFloat(row.rent_amount),
      depositAmount: parseFloat(row.deposit_amount),
      paymentDueDay: row.payment_due_day,
      leaseType: row.lease_type,
      status: row.status,
      documentUrl: row.document_url,
      signedDate: row.signed_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json(lease);
  } catch (error) {
    console.error('Get lease error:', error);
    res.status(500).json({ error: 'Failed to fetch lease' });
  }
};

// Create lease
export const createLease = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      unitId,
      tenantId,
      startDate,
      endDate,
      rentAmount,
      depositAmount,
      paymentDueDay,
      leaseType,
      documentUrl,
      signedDate,
      notes,
    } = req.body;

    // Verify unit ownership
    const unitCheck = await client.query(
      `SELECT u.id, p.landlord_id FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE u.id = $1 AND p.landlord_id = $2`,
      [unitId, req.userId]
    );

    if (unitCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Unit not found' });
      return;
    }

    // Verify tenant ownership
    const tenantCheck = await client.query(
      'SELECT id FROM tenants WHERE id = $1 AND landlord_id = $2',
      [tenantId, req.userId]
    );

    if (tenantCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Create lease
    const result = await client.query(
      `INSERT INTO leases (
        unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount,
        payment_due_day, lease_type, status, document_url, signed_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        unitId,
        tenantId,
        startDate,
        endDate,
        rentAmount,
        depositAmount,
        paymentDueDay,
        leaseType,
        signedDate ? 'active' : 'pending',
        documentUrl || null,
        signedDate || null,
        notes || null,
      ]
    );

    const lease = result.rows[0];

    // Update unit status to occupied if lease is active
    if (lease.status === 'active') {
      await client.query(
        'UPDATE units SET status = $1 WHERE id = $2',
        ['occupied', unitId]
      );

      // Update tenant status
      await client.query(
        'UPDATE tenants SET status = $1, move_in_date = $2 WHERE id = $3',
        ['active', startDate, tenantId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Lease created successfully',
      lease: {
        id: lease.id,
        unitId: lease.unit_id,
        tenantId: lease.tenant_id,
        startDate: lease.start_date,
        endDate: lease.end_date,
        rentAmount: parseFloat(lease.rent_amount),
        depositAmount: parseFloat(lease.deposit_amount),
        paymentDueDay: lease.payment_due_day,
        leaseType: lease.lease_type,
        status: lease.status,
        documentUrl: lease.document_url,
        signedDate: lease.signed_date,
        notes: lease.notes,
        createdAt: lease.created_at,
        updatedAt: lease.updated_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create lease error:', error);
    res.status(500).json({ error: 'Failed to create lease' });
  } finally {
    client.release();
  }
};

// Update lease
export const updateLease = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      startDate,
      endDate,
      rentAmount,
      depositAmount,
      paymentDueDay,
      leaseType,
      status,
      documentUrl,
      signedDate,
      notes,
    } = req.body;

    // Verify ownership
    const ownershipCheck = await pool.query(
      `SELECT l.id FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE l.id = $1 AND p.landlord_id = $2`,
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      res.status(404).json({ error: 'Lease not found' });
      return;
    }

    const result = await pool.query(
      `UPDATE leases SET
        start_date = COALESCE($1, start_date),
        end_date = COALESCE($2, end_date),
        rent_amount = COALESCE($3, rent_amount),
        deposit_amount = COALESCE($4, deposit_amount),
        payment_due_day = COALESCE($5, payment_due_day),
        lease_type = COALESCE($6, lease_type),
        status = COALESCE($7, status),
        document_url = COALESCE($8, document_url),
        signed_date = COALESCE($9, signed_date),
        notes = COALESCE($10, notes)
       WHERE id = $11
       RETURNING *`,
      [
        startDate,
        endDate,
        rentAmount,
        depositAmount,
        paymentDueDay,
        leaseType,
        status,
        documentUrl,
        signedDate,
        notes,
        id,
      ]
    );

    const lease = result.rows[0];

    res.json({
      message: 'Lease updated successfully',
      lease: {
        id: lease.id,
        unitId: lease.unit_id,
        tenantId: lease.tenant_id,
        startDate: lease.start_date,
        endDate: lease.end_date,
        rentAmount: parseFloat(lease.rent_amount),
        depositAmount: parseFloat(lease.deposit_amount),
        paymentDueDay: lease.payment_due_day,
        leaseType: lease.lease_type,
        status: lease.status,
        documentUrl: lease.document_url,
        signedDate: lease.signed_date,
        notes: lease.notes,
        createdAt: lease.created_at,
        updatedAt: lease.updated_at,
      },
    });
  } catch (error) {
    console.error('Update lease error:', error);
    res.status(500).json({ error: 'Failed to update lease' });
  }
};

// Terminate lease
export const terminateLease = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { terminationDate, notes } = req.body;

    // Verify ownership and get lease details
    const leaseCheck = await client.query(
      `SELECT l.id, l.unit_id, l.tenant_id FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE l.id = $1 AND p.landlord_id = $2`,
      [id, req.userId]
    );

    if (leaseCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Lease not found' });
      return;
    }

    const lease = leaseCheck.rows[0];

    // Update lease status
    await client.query(
      `UPDATE leases SET
        status = 'terminated',
        end_date = COALESCE($1, end_date),
        notes = COALESCE($2, notes)
       WHERE id = $3`,
      [terminationDate, notes, id]
    );

    // Update unit status to vacant
    await client.query(
      'UPDATE units SET status = $1 WHERE id = $2',
      ['vacant', lease.unit_id]
    );

    // Update tenant status
    await client.query(
      'UPDATE tenants SET status = $1, move_out_date = $2 WHERE id = $3',
      ['past', terminationDate || new Date(), lease.tenant_id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Lease terminated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Terminate lease error:', error);
    res.status(500).json({ error: 'Failed to terminate lease' });
  } finally {
    client.release();
  }
};

// Delete lease
export const deleteLease = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM leases l
       USING units u, properties p
       WHERE l.id = $1 AND l.unit_id = u.id AND u.property_id = p.id AND p.landlord_id = $2
       RETURNING l.id`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Lease not found' });
      return;
    }

    res.json({ message: 'Lease deleted successfully' });
  } catch (error) {
    console.error('Delete lease error:', error);
    res.status(500).json({ error: 'Failed to delete lease' });
  }
};
