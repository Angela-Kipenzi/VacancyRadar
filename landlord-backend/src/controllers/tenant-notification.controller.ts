import { Response } from 'express';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const getTenantNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isRead } = req.query;

    let query = 'SELECT * FROM tenant_notifications WHERE tenant_id = $1';
    const params: any[] = [req.userId];

    if (isRead !== undefined) {
      query += ` AND is_read = $${params.length + 1}`;
      params.push(isRead === 'true');
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, params);

    const notifications = result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      isRead: row.is_read,
      link: row.link,
      createdAt: row.created_at,
    }));

    res.json(notifications);
  } catch (error) {
    console.error('Get tenant notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markTenantNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE tenant_notifications
       SET is_read = true
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    const row = result.rows[0];
    res.json({
      notification: {
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        isRead: row.is_read,
        link: row.link,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('Mark tenant notification read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};
