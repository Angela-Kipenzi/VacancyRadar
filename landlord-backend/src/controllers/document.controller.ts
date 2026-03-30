import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const documentValidation = [
  body('type').isIn(['lease', 'receipt', 'notice', 'other']).withMessage('Invalid document type'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('fileUrl').isString().notEmpty().withMessage('File URL is required'),
];

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT * FROM tenant_documents
       WHERE tenant_id = $1
       ORDER BY uploaded_at DESC`,
      [req.userId]
    );

    const documents = result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      fileUrl: row.file_url,
      uploadedAt: row.uploaded_at,
    }));

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const createDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, title, description, fileUrl } = req.body;

    const result = await pool.query(
      `INSERT INTO tenant_documents (tenant_id, type, title, description, file_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.userId, type, title, description || null, fileUrl]
    );

    const row = result.rows[0];
    res.status(201).json({
      document: {
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        fileUrl: row.file_url,
        uploadedAt: row.uploaded_at,
      },
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};
