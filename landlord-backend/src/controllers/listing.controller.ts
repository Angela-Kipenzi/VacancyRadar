import { Response } from 'express';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

const hashToUnit = (value: string, seed: number) => {
  let hash = seed;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return (hash % 1000) / 1000;
};

const mapPropertyType = (propertyType: string, bedrooms: number) => {
  if (bedrooms === 0) return 'studio';
  if (propertyType === 'house' || propertyType === 'condo') return propertyType;
  return 'apartment';
};

const mapStatus = (unitStatus: string) => {
  if (unitStatus === 'vacant') return 'available';
  if (unitStatus === 'pending') return 'pending';
  if (unitStatus === 'maintenance') return 'pending';
  return 'occupied';
};

const normalizeArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (value) {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
};

export const getListings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.*, p.name as property_name, p.address, p.city, p.state, p.zip_code,
        p.property_type, p.year_built, p.amenities as property_amenities, p.photo_url,
        p.description as property_description
       FROM units u
       JOIN properties p ON u.property_id = p.id
       ORDER BY u.created_at DESC`
    );

    const listings = result.rows.map((row) => {
      const mapX = hashToUnit(row.id, 17);
      const mapY = hashToUnit(row.id, 43);
      const unitPhotos = normalizeArray(row.photos);
      const propertyAmenities = normalizeArray(row.property_amenities);
      const unitAmenities = normalizeArray(row.amenities);
      const photos = unitPhotos.length > 0 ? unitPhotos : row.photo_url ? [row.photo_url] : [];
      const amenities = unitAmenities.length > 0 ? unitAmenities : propertyAmenities;
      const createdAt = row.created_at ? new Date(row.created_at) : new Date();
      const daysOnPlatform = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        id: row.id,
        propertyId: row.property_id,
        title: `${row.property_name} ${row.unit_number}`,
        price: parseFloat(row.rent_amount),
        currency: 'USD',
        depositAmount: parseFloat(row.deposit_amount),
        minLeaseMonths: 12,
        unitNumber: row.unit_number,
        bedrooms: Number(row.bedrooms),
        bathrooms: parseFloat(row.bathrooms),
        type: mapPropertyType(row.property_type, Number(row.bedrooms)),
        sqft: row.square_feet ? Number(row.square_feet) : 0,
        sqftUnit: 'sqft',
        floor: 1,
        yearBuilt: row.year_built || 2000,
        status: mapStatus(row.status),
        city: row.city,
        neighborhood: row.city,
        address: row.address,
        daysOnPlatform,
        availableDate: row.available_date || new Date().toISOString().slice(0, 10),
        amenities,
        images: photos,
        description: row.description || row.property_description || '',
        virtualTourAvailable: false,
        location: {
          lat: 0,
          lng: 0,
          mapX,
          mapY,
        },
      };
    });

    res.json(listings);
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

export const getListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT u.*, p.name as property_name, p.address, p.city, p.state, p.zip_code,
        p.property_type, p.year_built, p.amenities as property_amenities, p.photo_url,
        p.description as property_description
       FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const row = result.rows[0];
    const mapX = hashToUnit(row.id, 17);
    const mapY = hashToUnit(row.id, 43);
    const unitPhotos = normalizeArray(row.photos);
    const propertyAmenities = normalizeArray(row.property_amenities);
    const unitAmenities = normalizeArray(row.amenities);
    const photos = unitPhotos.length > 0 ? unitPhotos : row.photo_url ? [row.photo_url] : [];
    const amenities = unitAmenities.length > 0 ? unitAmenities : propertyAmenities;
    const createdAt = row.created_at ? new Date(row.created_at) : new Date();
    const daysOnPlatform = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

    res.json({
      id: row.id,
      propertyId: row.property_id,
      title: `${row.property_name} ${row.unit_number}`,
      price: parseFloat(row.rent_amount),
      currency: 'USD',
      depositAmount: parseFloat(row.deposit_amount),
      minLeaseMonths: 12,
      unitNumber: row.unit_number,
      bedrooms: Number(row.bedrooms),
      bathrooms: parseFloat(row.bathrooms),
      type: mapPropertyType(row.property_type, Number(row.bedrooms)),
      sqft: row.square_feet ? Number(row.square_feet) : 0,
      sqftUnit: 'sqft',
      floor: 1,
      yearBuilt: row.year_built || 2000,
      status: mapStatus(row.status),
      city: row.city,
      neighborhood: row.city,
      address: row.address,
      daysOnPlatform,
      availableDate: row.available_date || new Date().toISOString().slice(0, 10),
      amenities,
      images: photos,
      description: row.description || row.property_description || '',
      virtualTourAvailable: false,
      location: {
        lat: 0,
        lng: 0,
        mapX,
        mapY,
      },
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
};
