import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const reviewValidation = [
  body('propertyId').isUUID().withMessage('Valid property id is required'),
  body('ratings').isObject().withMessage('Ratings are required'),
];

const normalizeJson = <T,>(value: any, fallback: T): T => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const mapReview = (row: any) => ({
  id: row.id,
  propertyId: row.unit_id || row.property_id,
  propertyName: row.property_name,
  propertyAddress: row.property_address,
  ratings: normalizeJson(row.ratings, {}),
  pros: normalizeJson(row.pros, []),
  cons: normalizeJson(row.cons, []),
  details: row.details || undefined,
  photos: normalizeJson(row.photos, []),
  anonymous: row.anonymous,
  authorId: row.tenant_id || 'unknown',
  authorName: row.author_name || 'Anonymous',
  status: row.status,
  verified: row.verified,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  landlordResponse: row.landlord_response || undefined,
  flagged: row.flagged,
});

export const getReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const propertyId = req.query.propertyId as string | undefined;
    const params: any[] = [];
    let query = 'SELECT * FROM reviews WHERE status = $1';
    params.push('published');

    if (propertyId) {
      query += ` AND (unit_id = $${params.length + 1} OR property_id = $${params.length + 1})`;
      params.push(propertyId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(mapReview));
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const getMyReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows.map(mapReview));
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      propertyId,
      ratings,
      pros,
      cons,
      details,
      photos,
      anonymous,
    } = req.body;

    const unitResult = await pool.query(
      `SELECT u.id as unit_id, p.id as property_id, p.name as property_name, p.address, p.city
       FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE u.id = $1`,
      [propertyId]
    );

    if (unitResult.rows.length === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const unit = unitResult.rows[0];
    const address = `${unit.address}, ${unit.city}`;

    const leaseCheck = await pool.query(
      `SELECT id FROM leases WHERE tenant_id = $1 AND unit_id = $2 AND status = 'active'`,
      [req.userId, unit.unit_id]
    );

    const tenantResult = await pool.query(
      'SELECT first_name, last_name FROM tenants WHERE id = $1',
      [req.userId]
    );

    const authorName = tenantResult.rows.length
      ? `${tenantResult.rows[0].first_name} ${tenantResult.rows[0].last_name}`.trim()
      : 'Tenant';

    const result = await pool.query(
      `INSERT INTO reviews (
        tenant_id, unit_id, property_id, property_name, property_address,
        ratings, pros, cons, details, photos, anonymous, author_name,
        status, verified, flagged
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        req.userId,
        unit.unit_id,
        unit.property_id,
        unit.property_name,
        address,
        ratings,
        JSON.stringify(pros || []),
        JSON.stringify(cons || []),
        details || null,
        JSON.stringify(photos || []),
        !!anonymous,
        authorName,
        'published',
        leaseCheck.rows.length > 0,
        false,
      ]
    );

    res.status(201).json({ review: mapReview(result.rows[0]) });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ratings, pros, cons, details, photos } = req.body;

    const result = await pool.query(
      `UPDATE reviews SET
        ratings = COALESCE($1, ratings),
        pros = COALESCE($2, pros),
        cons = COALESCE($3, cons),
        details = COALESCE($4, details),
        photos = COALESCE($5, photos)
       WHERE id = $6 AND tenant_id = $7
       RETURNING *`,
      [
        ratings || null,
        pros ? JSON.stringify(pros) : null,
        cons ? JSON.stringify(cons) : null,
        details || null,
        photos ? JSON.stringify(photos) : null,
        id,
        req.userId,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    res.json({ review: mapReview(result.rows[0]) });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

export const flagReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE reviews SET flagged = TRUE WHERE id = $1 RETURNING id, flagged`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    res.json({ message: 'Review flagged', review: result.rows[0] });
  } catch (error) {
    console.error('Flag review error:', error);
    res.status(500).json({ error: 'Failed to flag review' });
  }
};
