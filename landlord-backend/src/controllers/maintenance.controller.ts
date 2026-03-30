import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const maintenanceValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(['plumbing', 'electrical', 'hvac', 'appliance', 'other'])
    .withMessage('Invalid category'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('unitId').optional().isUUID().withMessage('Invalid unit ID'),
];

export const getMaintenanceRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statusParam = (req.query.status as string | undefined) ?? undefined;
    const statuses = statusParam
      ? statusParam.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const params: any[] = [req.userId];
    let query = 'SELECT * FROM maintenance_requests WHERE tenant_id = $1';

    if (statuses.length > 0) {
      query += ` AND status = ANY($${params.length + 1})`;
      params.push(statuses);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    const requests = result.rows.map((row) => ({
      id: row.id,
      unitId: row.unit_id,
      title: row.title,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      photos: row.photos || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
    }));

    res.json(requests);
  } catch (error) {
    console.error('Get maintenance error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance requests' });
  }
};

export const createMaintenanceRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, priority, unitId } = req.body;

    let resolvedUnitId = unitId as string | null | undefined;
    if (!resolvedUnitId) {
      const leaseRes = await pool.query(
        'SELECT unit_id FROM leases WHERE tenant_id = $1 ORDER BY start_date DESC LIMIT 1',
        [req.userId]
      );
      resolvedUnitId = leaseRes.rows[0]?.unit_id ?? null;
    }

    const result = await pool.query(
      `INSERT INTO maintenance_requests (
        tenant_id, unit_id, title, description, category, priority, status, photos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        req.userId,
        resolvedUnitId,
        title,
        description,
        category,
        priority,
        'pending',
        '[]',
      ]
    );

    const row = result.rows[0];
    res.status(201).json({
      request: {
        id: row.id,
        unitId: row.unit_id,
        title: row.title,
        description: row.description,
        category: row.category,
        priority: row.priority,
        status: row.status,
        photos: row.photos || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
      },
    });
  } catch (error) {
    console.error('Create maintenance error:', error);
    res.status(500).json({ error: 'Failed to create maintenance request' });
  }
};
