import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

// Validation rules
export const tenantValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
];

// Tenant self endpoints
export const getMyLease = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT l.*,
        u.id as unit_id, u.unit_number, u.bedrooms, u.bathrooms, u.square_feet,
        u.rent_amount, u.deposit_amount, u.status as unit_status, u.amenities, u.photos,
        p.name as property_name, p.address as property_address, p.city as property_city,
        p.state as property_state, p.zip_code as property_zip
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE l.tenant_id = $1
       ORDER BY l.start_date DESC
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
      unitId: row.unit_id,
      startDate: row.start_date,
      endDate: row.end_date,
      rentAmount: parseFloat(row.rent_amount),
      depositAmount: parseFloat(row.deposit_amount),
      paymentDueDay: row.payment_due_day,
      leaseType: row.lease_type,
      status: row.status,
      documentUrl: row.document_url,
      unit: {
        id: row.unit_id,
        unitNumber: row.unit_number,
        bedrooms: Number(row.bedrooms),
        bathrooms: parseFloat(row.bathrooms),
        squareFeet: row.square_feet ? Number(row.square_feet) : undefined,
        rentAmount: parseFloat(row.rent_amount),
        depositAmount: parseFloat(row.deposit_amount),
        status: row.unit_status,
        amenities: row.amenities || [],
        photos: row.photos || [],
        property: {
          name: row.property_name,
          address: row.property_address,
          city: row.property_city,
          state: row.property_state,
          zipCode: row.property_zip,
        },
      },
    });
  } catch (error) {
    console.error('Get tenant lease error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant lease' });
  }
};

export const getMyUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.*, 
        p.name as property_name, p.address as property_address, p.city as property_city,
        p.state as property_state, p.zip_code as property_zip
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE l.tenant_id = $1
       ORDER BY l.start_date DESC
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
      unitNumber: row.unit_number,
      bedrooms: Number(row.bedrooms),
      bathrooms: parseFloat(row.bathrooms),
      squareFeet: row.square_feet ? Number(row.square_feet) : undefined,
      rentAmount: parseFloat(row.rent_amount),
      depositAmount: parseFloat(row.deposit_amount),
      status: row.status,
      amenities: row.amenities || [],
      photos: row.photos || [],
      property: {
        name: row.property_name,
        address: row.property_address,
        city: row.property_city,
        state: row.property_state,
        zipCode: row.property_zip,
      },
    });
  } catch (error) {
    console.error('Get tenant unit error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant unit' });
  }
};

// Get all tenants for landlord
export const getTenants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    let query = `
      SELECT t.*,
        u.unit_number, p.name as property_name,
        l.id as lease_id, l.start_date as lease_start_date, l.end_date as lease_end_date, l.rent_amount
      FROM tenants t
      LEFT JOIN leases l ON t.id = l.tenant_id AND l.status = 'active'
      LEFT JOIN units u ON l.unit_id = u.id
      LEFT JOIN properties p ON u.property_id = p.id
      WHERE t.landlord_id = $1
    `;

    const params: any[] = [req.userId];

    if (status) {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ' ORDER BY t.last_name, t.first_name';

    const result = await pool.query(query, params);

    const tenants = result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      moveInDate: row.move_in_date,
      moveOutDate: row.move_out_date,
      status: row.status,
      notes: row.notes,
      currentUnit: row.unit_number ? {
        unitNumber: row.unit_number,
        propertyName: row.property_name,
        leaseId: row.lease_id,
        leaseStartDate: row.lease_start_date,
        leaseEndDate: row.lease_end_date,
        rentAmount: row.rent_amount ? parseFloat(row.rent_amount) : null,
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(tenants);
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

// Get single tenant
export const getTenant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM tenants WHERE id = $1 AND landlord_id = $2',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const row = result.rows[0];

    // Get lease history
    const leasesResult = await pool.query(
      `SELECT l.*, u.unit_number, p.name as property_name
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE l.tenant_id = $1
       ORDER BY l.start_date DESC`,
      [id]
    );

    const tenant = {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      moveInDate: row.move_in_date,
      moveOutDate: row.move_out_date,
      status: row.status,
      notes: row.notes,
      leaseHistory: leasesResult.rows.map(lease => ({
        id: lease.id,
        unitNumber: lease.unit_number,
        propertyName: lease.property_name,
        startDate: lease.start_date,
        endDate: lease.end_date,
        rentAmount: parseFloat(lease.rent_amount),
        status: lease.status,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json(tenant);
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
};

// Create tenant
export const createTenant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      emergencyContactName,
      emergencyContactPhone,
      moveInDate,
      notes,
    } = req.body;

    const existingTenant = await pool.query(
      'SELECT id, landlord_id FROM tenants WHERE email = $1',
      [email]
    );

    if (existingTenant.rows.length > 0) {
      const existing = existingTenant.rows[0];
      if (!existing.landlord_id) {
        const updated = await pool.query(
          `UPDATE tenants SET
            landlord_id = $1,
            first_name = COALESCE($2, first_name),
            last_name = COALESCE($3, last_name),
            phone = COALESCE($4, phone),
            emergency_contact_name = COALESCE($5, emergency_contact_name),
            emergency_contact_phone = COALESCE($6, emergency_contact_phone),
            move_in_date = COALESCE($7, move_in_date),
            status = COALESCE($8, status),
            notes = COALESCE($9, notes)
           WHERE id = $10
           RETURNING *`,
          [
            req.userId,
            firstName,
            lastName,
            phone,
            emergencyContactName || null,
            emergencyContactPhone || null,
            moveInDate || null,
            'inactive',
            notes || null,
            existing.id,
          ]
        );

        const tenant = updated.rows[0];
        res.status(200).json({
          message: 'Tenant linked successfully',
          tenant: {
            id: tenant.id,
            firstName: tenant.first_name,
            lastName: tenant.last_name,
            email: tenant.email,
            phone: tenant.phone,
            emergencyContactName: tenant.emergency_contact_name,
            emergencyContactPhone: tenant.emergency_contact_phone,
            moveInDate: tenant.move_in_date,
            moveOutDate: tenant.move_out_date,
            status: tenant.status,
            notes: tenant.notes,
            createdAt: tenant.created_at,
            updatedAt: tenant.updated_at,
          },
        });
        return;
      }

      res.status(400).json({ error: 'Email already registered to another tenant' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO tenants (
        landlord_id, first_name, last_name, email, phone,
        emergency_contact_name, emergency_contact_phone,
        move_in_date, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.userId,
        firstName,
        lastName,
        email,
        phone,
        emergencyContactName || null,
        emergencyContactPhone || null,
        moveInDate || null,
        'inactive',
        notes || null,
      ]
    );

    const tenant = result.rows[0];

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: {
        id: tenant.id,
        firstName: tenant.first_name,
        lastName: tenant.last_name,
        email: tenant.email,
        phone: tenant.phone,
        emergencyContactName: tenant.emergency_contact_name,
        emergencyContactPhone: tenant.emergency_contact_phone,
        moveInDate: tenant.move_in_date,
        moveOutDate: tenant.move_out_date,
        status: tenant.status,
        notes: tenant.notes,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
      },
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
};

// Update tenant
export const updateTenant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      emergencyContactName,
      emergencyContactPhone,
      moveInDate,
      moveOutDate,
      status,
      notes,
    } = req.body;

    const result = await pool.query(
      `UPDATE tenants SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        emergency_contact_name = COALESCE($5, emergency_contact_name),
        emergency_contact_phone = COALESCE($6, emergency_contact_phone),
        move_in_date = COALESCE($7, move_in_date),
        move_out_date = COALESCE($8, move_out_date),
        status = COALESCE($9, status),
        notes = COALESCE($10, notes)
       WHERE id = $11 AND landlord_id = $12
       RETURNING *`,
      [
        firstName,
        lastName,
        email,
        phone,
        emergencyContactName,
        emergencyContactPhone,
        moveInDate,
        moveOutDate,
        status,
        notes,
        id,
        req.userId,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const tenant = result.rows[0];

    res.json({
      message: 'Tenant updated successfully',
      tenant: {
        id: tenant.id,
        firstName: tenant.first_name,
        lastName: tenant.last_name,
        email: tenant.email,
        phone: tenant.phone,
        emergencyContactName: tenant.emergency_contact_name,
        emergencyContactPhone: tenant.emergency_contact_phone,
        moveInDate: tenant.move_in_date,
        moveOutDate: tenant.move_out_date,
        status: tenant.status,
        notes: tenant.notes,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
      },
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
};

// Delete tenant
export const deleteTenant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if tenant has active leases
    const leaseCheck = await pool.query(
      'SELECT id FROM leases WHERE tenant_id = $1 AND status = $2',
      [id, 'active']
    );

    if (leaseCheck.rows.length > 0) {
      res.status(400).json({ error: 'Cannot delete tenant with active lease' });
      return;
    }

    const result = await pool.query(
      'DELETE FROM tenants WHERE id = $1 AND landlord_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
};
