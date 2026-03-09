import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

// Validation rules
export const unitValidation = [
  body('propertyId').isUUID().withMessage('Valid property ID is required'),
  body('unitNumber').trim().notEmpty().withMessage('Unit number is required'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a positive number'),
  body('bathrooms').isFloat({ min: 0 }).withMessage('Bathrooms must be a positive number'),
  body('rentAmount').isFloat({ min: 0 }).withMessage('Rent amount must be a positive number'),
  body('depositAmount').isFloat({ min: 0 }).withMessage('Deposit amount must be a positive number'),
  body('status').isIn(['vacant', 'occupied', 'maintenance', 'pending']).withMessage('Invalid status'),
];

// Get all units (optionally filtered by property)
export const getUnits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.query;

    let query = `
      SELECT u.*, p.name as property_name, p.address as property_address,
        t.first_name as tenant_first_name, t.last_name as tenant_last_name,
        l.id as lease_id, l.end_date as lease_end_date
      FROM units u
      JOIN properties p ON u.property_id = p.id
      LEFT JOIN leases l ON u.id = l.unit_id AND l.status = 'active'
      LEFT JOIN tenants t ON l.tenant_id = t.id
      WHERE p.landlord_id = $1
    `;

    const params: any[] = [req.userId];

    if (propertyId) {
      query += ' AND u.property_id = $2';
      params.push(propertyId);
    }

    query += ' ORDER BY p.name, u.unit_number';

    const result = await pool.query(query, params);

    const units = result.rows.map((row: any) => ({
      id: row.id,
      propertyId: row.property_id,
      propertyName: row.property_name,
      propertyAddress: row.property_address,
      unitNumber: row.unit_number,
      bedrooms: row.bedrooms,
      bathrooms: parseFloat(row.bathrooms),
      squareFeet: row.square_feet,
      rentAmount: parseFloat(row.rent_amount),
      depositAmount: parseFloat(row.deposit_amount),
      status: row.status,
      availableDate: row.available_date,
      floorPlan: row.floor_plan,
      photos: row.photos,
      amenities: row.amenities,
      description: row.description,
      tenant: row.tenant_first_name ? {
        firstName: row.tenant_first_name,
        lastName: row.tenant_last_name,
      } : null,
      lease: row.lease_id ? {
        id: row.lease_id,
        endDate: row.lease_end_date,
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(units);
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
};

// Get single unit
export const getUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.*, p.name as property_name, p.address as property_address,
        t.first_name as tenant_first_name, t.last_name as tenant_last_name, t.email as tenant_email, t.phone as tenant_phone,
        l.id as lease_id, l.start_date as lease_start_date, l.end_date as lease_end_date
       FROM units u
       JOIN properties p ON u.property_id = p.id
       LEFT JOIN leases l ON u.id = l.unit_id AND l.status = 'active'
       LEFT JOIN tenants t ON l.tenant_id = t.id
       WHERE u.id = $1 AND p.landlord_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Unit not found' });
      return;
    }

    const row = result.rows[0];
    const unit = {
      id: row.id,
      propertyId: row.property_id,
      propertyName: row.property_name,
      propertyAddress: row.property_address,
      unitNumber: row.unit_number,
      bedrooms: row.bedrooms,
      bathrooms: parseFloat(row.bathrooms),
      squareFeet: row.square_feet,
      rentAmount: parseFloat(row.rent_amount),
      depositAmount: parseFloat(row.deposit_amount),
      status: row.status,
      availableDate: row.available_date,
      floorPlan: row.floor_plan,
      photos: row.photos,
      amenities: row.amenities,
      description: row.description,
      tenant: row.tenant_first_name ? {
        firstName: row.tenant_first_name,
        lastName: row.tenant_last_name,
        email: row.tenant_email,
        phone: row.tenant_phone,
      } : null,
      lease: row.lease_id ? {
        id: row.lease_id,
        startDate: row.lease_start_date,
        endDate: row.lease_end_date,
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json(unit);
  } catch (error) {
    console.error('Get unit error:', error);
    res.status(500).json({ error: 'Failed to fetch unit' });
  }
};

// Create unit
export const createUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      propertyId,
      unitNumber,
      bedrooms,
      bathrooms,
      squareFeet,
      rentAmount,
      depositAmount,
      status,
      availableDate,
      floorPlan,
      photos,
      amenities,
      description,
    } = req.body;

    // Verify property ownership
    const propertyCheck = await pool.query(
      'SELECT id FROM properties WHERE id = $1 AND landlord_id = $2',
      [propertyId, req.userId]
    );

    if (propertyCheck.rows.length === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO units (
        property_id, unit_number, bedrooms, bathrooms, square_feet,
        rent_amount, deposit_amount, status, available_date, floor_plan,
        photos, amenities, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        propertyId,
        unitNumber,
        bedrooms,
        bathrooms,
        squareFeet || null,
        rentAmount,
        depositAmount,
        status,
        availableDate || null,
        floorPlan || null,
        JSON.stringify(photos || []),
        JSON.stringify(amenities || []),
        description || null,
      ]
    );

    const unit = result.rows[0];

    res.status(201).json({
      message: 'Unit created successfully',
      unit: {
        id: unit.id,
        propertyId: unit.property_id,
        unitNumber: unit.unit_number,
        bedrooms: unit.bedrooms,
        bathrooms: parseFloat(unit.bathrooms),
        squareFeet: unit.square_feet,
        rentAmount: parseFloat(unit.rent_amount),
        depositAmount: parseFloat(unit.deposit_amount),
        status: unit.status,
        availableDate: unit.available_date,
        floorPlan: unit.floor_plan,
        photos: unit.photos,
        amenities: unit.amenities,
        description: unit.description,
        createdAt: unit.created_at,
        updatedAt: unit.updated_at,
      },
    });
  } catch (error) {
    console.error('Create unit error:', error);
    if ((error as any).code === '23505') {
      res.status(400).json({ error: 'Unit number already exists for this property' });
    } else {
      res.status(500).json({ error: 'Failed to create unit' });
    }
  }
};

// Update unit
export const updateUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      unitNumber,
      bedrooms,
      bathrooms,
      squareFeet,
      rentAmount,
      depositAmount,
      status,
      availableDate,
      floorPlan,
      photos,
      amenities,
      description,
    } = req.body;

    // Verify ownership through property
    const ownershipCheck = await pool.query(
      `SELECT u.id FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE u.id = $1 AND p.landlord_id = $2`,
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      res.status(404).json({ error: 'Unit not found' });
      return;
    }

    const result = await pool.query(
      `UPDATE units SET
        unit_number = COALESCE($1, unit_number),
        bedrooms = COALESCE($2, bedrooms),
        bathrooms = COALESCE($3, bathrooms),
        square_feet = COALESCE($4, square_feet),
        rent_amount = COALESCE($5, rent_amount),
        deposit_amount = COALESCE($6, deposit_amount),
        status = COALESCE($7, status),
        available_date = COALESCE($8, available_date),
        floor_plan = COALESCE($9, floor_plan),
        photos = COALESCE($10, photos),
        amenities = COALESCE($11, amenities),
        description = COALESCE($12, description)
       WHERE id = $13
       RETURNING *`,
      [
        unitNumber,
        bedrooms,
        bathrooms,
        squareFeet,
        rentAmount,
        depositAmount,
        status,
        availableDate,
        floorPlan,
        photos ? JSON.stringify(photos) : null,
        amenities ? JSON.stringify(amenities) : null,
        description,
        id,
      ]
    );

    const unit = result.rows[0];

    res.json({
      message: 'Unit updated successfully',
      unit: {
        id: unit.id,
        propertyId: unit.property_id,
        unitNumber: unit.unit_number,
        bedrooms: unit.bedrooms,
        bathrooms: parseFloat(unit.bathrooms),
        squareFeet: unit.square_feet,
        rentAmount: parseFloat(unit.rent_amount),
        depositAmount: parseFloat(unit.deposit_amount),
        status: unit.status,
        availableDate: unit.available_date,
        floorPlan: unit.floor_plan,
        photos: unit.photos,
        amenities: unit.amenities,
        description: unit.description,
        createdAt: unit.created_at,
        updatedAt: unit.updated_at,
      },
    });
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ error: 'Failed to update unit' });
  }
};

// Delete unit
export const deleteUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM units u
       USING properties p
       WHERE u.id = $1 AND u.property_id = p.id AND p.landlord_id = $2
       RETURNING u.id`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Unit not found' });
      return;
    }

    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ error: 'Failed to delete unit' });
  }
};
