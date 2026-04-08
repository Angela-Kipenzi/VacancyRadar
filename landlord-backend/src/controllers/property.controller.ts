import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

// Validation rules
export const propertyValidation = [
  body('name').trim().notEmpty().withMessage('Property name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('propertyType').isIn(['apartment', 'house', 'condo', 'townhouse', 'other']).withMessage('Invalid property type'),
  body('totalUnits').isInt({ min: 1 }).withMessage('Total units must be at least 1'),
];

// Get all properties for landlord
export const getProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
        COUNT(DISTINCT u.id) as unit_count,
        COUNT(DISTINCT CASE WHEN u.status = 'vacant' THEN u.id END) as vacant_units,
        COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END) as occupied_units
       FROM properties p
       LEFT JOIN units u ON p.id = u.property_id
       WHERE p.landlord_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.userId]
    );

    const properties = result.rows.map((row:any) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      latitude: row.latitude,
      longitude: row.longitude,
      propertyType: row.property_type,
      yearBuilt: row.year_built,
      totalUnits: row.total_units,
      description: row.description,
      amenities: row.amenities,
      photoUrl: row.photo_url,
      photos: row.photos || [],
      virtualTourUrl: row.virtual_tour_url,
      videoTourUrl: row.video_tour_url,
      unitCount: parseInt(row.unit_count),
      vacantUnits: parseInt(row.vacant_units),
      occupiedUnits: parseInt(row.occupied_units),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(properties);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
};

// Get single property
export const getProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*,
        COUNT(DISTINCT u.id) as unit_count,
        COUNT(DISTINCT CASE WHEN u.status = 'vacant' THEN u.id END) as vacant_units,
        COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END) as occupied_units
       FROM properties p
       LEFT JOIN units u ON p.id = u.property_id
       WHERE p.id = $1 AND p.landlord_id = $2
       GROUP BY p.id`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const row = result.rows[0];
    const property = {
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      latitude: row.latitude,
      longitude: row.longitude,
      propertyType: row.property_type,
      yearBuilt: row.year_built,
      totalUnits: row.total_units,
      description: row.description,
      amenities: row.amenities,
      photoUrl: row.photo_url,
      photos: row.photos || [],
      virtualTourUrl: row.virtual_tour_url,
      videoTourUrl: row.video_tour_url,
      unitCount: parseInt(row.unit_count),
      vacantUnits: parseInt(row.vacant_units),
      occupiedUnits: parseInt(row.occupied_units),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json(property);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
};

// Create property
export const createProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      propertyType,
      yearBuilt,
      totalUnits,
      description,
      amenities,
      photoUrl,
      photos,
      virtualTourUrl,
      videoTourUrl,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO properties (
        landlord_id, name, address, city, state, zip_code, 
        latitude, longitude, property_type, year_built, total_units, description, amenities, photo_url,
        photos, virtual_tour_url, video_tour_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        req.userId,
        name,
        address,
        city,
        state,
        zipCode,
        latitude ?? null,
        longitude ?? null,
        propertyType,
        yearBuilt || null,
        totalUnits,
        description || null,
        JSON.stringify(amenities || []),
        photoUrl || null,
        JSON.stringify(photos || []),
        virtualTourUrl || null,
        videoTourUrl || null,
      ]
    );

    const property = result.rows[0];

    res.status(201).json({
      message: 'Property created successfully',
      property: {
        id: property.id,
        name: property.name,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zip_code,
        latitude: property.latitude,
        longitude: property.longitude,
        propertyType: property.property_type,
        yearBuilt: property.year_built,
        totalUnits: property.total_units,
        description: property.description,
        amenities: property.amenities,
        photoUrl: property.photo_url,
        photos: property.photos || [],
        virtualTourUrl: property.virtual_tour_url,
        videoTourUrl: property.video_tour_url,
        createdAt: property.created_at,
        updatedAt: property.updated_at,
      },
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
};

// Update property
export const updateProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      propertyType,
      yearBuilt,
      totalUnits,
      description,
      amenities,
      photoUrl,
      photos,
      virtualTourUrl,
      videoTourUrl,
    } = req.body;

    // Verify ownership
    const checkOwnership = await pool.query(
      'SELECT id FROM properties WHERE id = $1 AND landlord_id = $2',
      [id, req.userId]
    );

    if (checkOwnership.rows.length === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const result = await pool.query(
      `UPDATE properties SET
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        city = COALESCE($3, city),
        state = COALESCE($4, state),
        zip_code = COALESCE($5, zip_code),
        latitude = COALESCE($6, latitude),
        longitude = COALESCE($7, longitude),
        property_type = COALESCE($8, property_type),
        year_built = COALESCE($9, year_built),
        total_units = COALESCE($10, total_units),
        description = COALESCE($11, description),
        amenities = COALESCE($12, amenities),
        photo_url = COALESCE($13, photo_url),
        photos = COALESCE($14, photos),
        virtual_tour_url = COALESCE($15, virtual_tour_url),
        video_tour_url = COALESCE($16, video_tour_url)
       WHERE id = $17 AND landlord_id = $18
       RETURNING *`,
      [
        name,
        address,
        city,
        state,
        zipCode,
        latitude ?? null,
        longitude ?? null,
        propertyType,
        yearBuilt,
        totalUnits,
        description,
        amenities ? JSON.stringify(amenities) : null,
        photoUrl,
        photos ? JSON.stringify(photos) : null,
        virtualTourUrl !== undefined ? virtualTourUrl : null,
        videoTourUrl !== undefined ? videoTourUrl : null,
        id,
        req.userId,
      ]
    );

    const property = result.rows[0];

    res.json({
      message: 'Property updated successfully',
      property: {
        id: property.id,
        name: property.name,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zip_code,
        latitude: property.latitude,
        longitude: property.longitude,
        propertyType: property.property_type,
        yearBuilt: property.year_built,
        totalUnits: property.total_units,
        description: property.description,
        amenities: property.amenities,
        photoUrl: property.photo_url,
        photos: property.photos || [],
        virtualTourUrl: property.virtual_tour_url,
        videoTourUrl: property.video_tour_url,
        createdAt: property.created_at,
        updatedAt: property.updated_at,
      },
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
};

// Delete property
export const deleteProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM properties WHERE id = $1 AND landlord_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
};
