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

type GeoPoint = { lat: number; lng: number };

const CITY_CENTER_LOOKUP: Record<string, GeoPoint> = {
  'nairobi': { lat: -1.286389, lng: 36.817223 },
  'mombasa': { lat: -4.043477, lng: 39.668206 },
  'kisumu': { lat: -0.1022, lng: 34.7617 },
  'nakuru': { lat: -0.3031, lng: 36.08 },
  'eldoret': { lat: 0.5143, lng: 35.2698 },
  'thika': { lat: -1.0333, lng: 37.0693 },
  'los angeles': { lat: 34.052235, lng: -118.243683 },
  'san diego': { lat: 32.715736, lng: -117.161087 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'new york': { lat: 40.7128, lng: -74.006 },
};

const STATE_FALLBACK_LOOKUP: Record<string, GeoPoint> = {
  ca: { lat: 36.778259, lng: -119.417931 },
  ny: { lat: 43.0, lng: -75.0 },
  tx: { lat: 31.0, lng: -99.0 },
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const toFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
};

const deriveCoordinates = (
  explicitLat: unknown,
  explicitLng: unknown,
  city: string,
  state: string,
  mapX: number,
  mapY: number
): GeoPoint => {
  const lat = toFiniteNumber(explicitLat);
  const lng = toFiniteNumber(explicitLng);
  if (lat !== null && lng !== null) {
    return {
      lat: clamp(lat, -90, 90),
      lng: clamp(lng, -180, 180),
    };
  }

  const normalizedCity = city.trim().toLowerCase();
  const normalizedState = state.trim().toLowerCase();
  const cityCenter = CITY_CENTER_LOOKUP[normalizedCity];
  const stateCenter = STATE_FALLBACK_LOOKUP[normalizedState];
  const base = cityCenter || stateCenter || CITY_CENTER_LOOKUP.nairobi;

  // Stable offset around city center so multiple units do not overlap exactly.
  const latOffset = (mapY - 0.5) * 0.08;
  const lngOffset = (mapX - 0.5) * 0.08;

  return {
    lat: clamp(base.lat + latOffset, -90, 90),
    lng: clamp(base.lng + lngOffset, -180, 180),
  };
};

export const getListings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.*, p.name as property_name, p.address, p.city, p.state, p.zip_code,
        p.property_type, p.year_built, p.amenities as property_amenities, p.photo_url,
        p.latitude, p.longitude,
        p.photos as property_photos, p.virtual_tour_url as property_virtual_tour_url,
        p.video_tour_url as property_video_tour_url,
        p.description as property_description, l.email as landlord_email, l.phone as landlord_phone
       FROM units u
       JOIN properties p ON u.property_id = p.id
       JOIN users l ON p.landlord_id = l.id
       WHERE u.status IN ('vacant', 'pending')
       ORDER BY u.created_at DESC`
    );

    const listings = result.rows.map((row) => {
      const mapX = hashToUnit(row.id, 17);
      const mapY = hashToUnit(row.id, 43);
      const coords = deriveCoordinates(row.latitude, row.longitude, row.city, row.state, mapX, mapY);
      const unitPhotos = normalizeArray(row.photos);
      const propertyAmenities = normalizeArray(row.property_amenities);
      const unitAmenities = normalizeArray(row.amenities);
      const propertyPhotos = normalizeArray(row.property_photos);
      const photos = unitPhotos.length > 0 ? unitPhotos : propertyPhotos.length > 0 ? propertyPhotos : row.photo_url ? [row.photo_url] : [];
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
        virtualTourAvailable: !!(row.virtual_tour_url || row.property_virtual_tour_url || row.video_tour_url || row.property_video_tour_url),
        virtualTourUrl: row.virtual_tour_url || row.property_virtual_tour_url || undefined,
        videoTourUrl: row.video_tour_url || row.property_video_tour_url || undefined,
        floorPlanUrl: row.floor_plan || undefined,
        landlordEmail: row.landlord_email,
        landlordPhone: row.landlord_phone,
        location: {
          lat: coords.lat,
          lng: coords.lng,
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
        p.latitude, p.longitude,
        p.photos as property_photos, p.virtual_tour_url as property_virtual_tour_url,
        p.video_tour_url as property_video_tour_url,
        p.description as property_description, l.email as landlord_email, l.phone as landlord_phone
       FROM units u
       JOIN properties p ON u.property_id = p.id
       JOIN users l ON p.landlord_id = l.id
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
    const coords = deriveCoordinates(row.latitude, row.longitude, row.city, row.state, mapX, mapY);
    const unitPhotos = normalizeArray(row.photos);
    const propertyAmenities = normalizeArray(row.property_amenities);
    const unitAmenities = normalizeArray(row.amenities);
    const propertyPhotos = normalizeArray(row.property_photos);
    const photos = unitPhotos.length > 0 ? unitPhotos : propertyPhotos.length > 0 ? propertyPhotos : row.photo_url ? [row.photo_url] : [];
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
      virtualTourAvailable: !!(row.virtual_tour_url || row.property_virtual_tour_url || row.video_tour_url || row.property_video_tour_url),
      virtualTourUrl: row.virtual_tour_url || row.property_virtual_tour_url || undefined,
      videoTourUrl: row.video_tour_url || row.property_video_tour_url || undefined,
      floorPlanUrl: row.floor_plan || undefined,
      landlordEmail: row.landlord_email,
      landlordPhone: row.landlord_phone,
      location: {
        lat: coords.lat,
        lng: coords.lng,
        mapX,
        mapY,
      },
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
};
