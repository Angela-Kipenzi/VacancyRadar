import { Response } from 'express';
import QRCode from 'qrcode';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';
import { config } from '../config/index.js';

// Generate QR code for unit
export const generateQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unitId } = req.params;

    // Verify unit ownership
    const unitCheck = await pool.query(
      `SELECT u.id, u.unit_number, p.name as property_name FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE u.id = $1 AND p.landlord_id = $2`,
      [unitId, req.userId]
    );

    if (unitCheck.rows.length === 0) {
      res.status(404).json({ error: 'Unit not found' });
      return;
    }

    // Check if QR code already exists
    const existingQR = await pool.query(
      'SELECT * FROM qr_codes WHERE unit_id = $1',
      [unitId]
    );

    if (existingQR.rows.length > 0) {
      const qr = existingQR.rows[0];
      res.json({
        id: qr.id,
        unitId: qr.unit_id,
        codeUrl: qr.code_url,
        landingPageUrl: qr.landing_page_url,
        scanCount: qr.scan_count,
        isActive: qr.is_active,
        createdAt: qr.created_at,
      });
      return;
    }

    // Create landing page URL
    const landingPageUrl = `${config.qrCode.baseUrl}/${unitId}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(landingPageUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    });

    // Save to database
    const result = await pool.query(
      `INSERT INTO qr_codes (unit_id, code_url, landing_page_url, scan_count, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [unitId, qrCodeDataUrl, landingPageUrl, 0, true]
    );

    const qrCode = result.rows[0];

    res.status(201).json({
      message: 'QR code generated successfully',
      qrCode: {
        id: qrCode.id,
        unitId: qrCode.unit_id,
        codeUrl: qrCode.code_url,
        landingPageUrl: qrCode.landing_page_url,
        scanCount: qrCode.scan_count,
        isActive: qrCode.is_active,
        createdAt: qrCode.created_at,
      },
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

// Get all QR codes for landlord
export const getQRCodes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT q.*, u.unit_number, p.name as property_name, p.address as property_address
       FROM qr_codes q
       JOIN units u ON q.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1
       ORDER BY q.created_at DESC`,
      [req.userId]
    );

    const qrCodes = result.rows.map((row: any) => ({
      id: row.id,
      unitId: row.unit_id,
      unitNumber: row.unit_number,
      propertyName: row.property_name,
      propertyAddress: row.property_address,
      codeUrl: row.code_url,
      landingPageUrl: row.landing_page_url,
      scanCount: row.scan_count,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(qrCodes);
  } catch (error) {
    console.error('Get QR codes error:', error);
    res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
};

// Get QR code by ID
export const getQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT q.*, u.unit_number, u.bedrooms, u.bathrooms, u.rent_amount,
        p.name as property_name, p.address as property_address
       FROM qr_codes q
       JOIN units u ON q.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE q.id = $1 AND p.landlord_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    const row = result.rows[0];

    // Get recent scans
    const scansResult = await pool.query(
      `SELECT * FROM qr_scans
       WHERE qr_code_id = $1
       ORDER BY scanned_at DESC
       LIMIT 50`,
      [id]
    );

    const qrCode = {
      id: row.id,
      unitId: row.unit_id,
      unitNumber: row.unit_number,
      propertyName: row.property_name,
      propertyAddress: row.property_address,
      unitDetails: {
        bedrooms: row.bedrooms,
        bathrooms: parseFloat(row.bathrooms),
        rentAmount: parseFloat(row.rent_amount),
      },
      codeUrl: row.code_url,
      landingPageUrl: row.landing_page_url,
      scanCount: row.scan_count,
      isActive: row.is_active,
      recentScans: scansResult.rows.map((scan: any) => ({
        id: scan.id,
        scannedAt: scan.scanned_at,
        ipAddress: scan.ip_address,
        userAgent: scan.user_agent,
        location: scan.location,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json(qrCode);
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
};

// Toggle QR code active status
export const toggleQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE qr_codes q SET is_active = NOT is_active
       FROM units u, properties p
       WHERE q.id = $1 AND q.unit_id = u.id AND u.property_id = p.id AND p.landlord_id = $2
       RETURNING q.*`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    const qrCode = result.rows[0];

    res.json({
      message: `QR code ${qrCode.is_active ? 'activated' : 'deactivated'} successfully`,
      isActive: qrCode.is_active,
    });
  } catch (error) {
    console.error('Toggle QR code error:', error);
    res.status(500).json({ error: 'Failed to toggle QR code' });
  }
};

// Record QR code scan (public endpoint - no auth)
export const recordScan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unitId } = req.params;

    // Find QR code for unit
    const qrCodeResult = await pool.query(
      'SELECT id, is_active FROM qr_codes WHERE unit_id = $1',
      [unitId]
    );

    if (qrCodeResult.rows.length === 0) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    const qrCode = qrCodeResult.rows[0];

    if (!qrCode.is_active) {
      res.status(403).json({ error: 'QR code is inactive' });
      return;
    }

    // Get IP and user agent
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Record scan
    await pool.query(
      `INSERT INTO qr_scans (qr_code_id, ip_address, user_agent)
       VALUES ($1, $2, $3)`,
      [qrCode.id, ipAddress, userAgent]
    );

    // Increment scan count
    await pool.query(
      'UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1',
      [qrCode.id]
    );

    // Get unit details for response
    const unitResult = await pool.query(
      `SELECT u.*, p.name as property_name, p.address as property_address,
        p.city, p.state, p.zip_code
       FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE u.id = $1`,
      [unitId]
    );

    const unit = unitResult.rows[0];

    res.json({
      message: 'Scan recorded successfully',
      unit: {
        id: unit.id,
        unitNumber: unit.unit_number,
        bedrooms: unit.bedrooms,
        bathrooms: parseFloat(unit.bathrooms),
        squareFeet: unit.square_feet,
        rentAmount: parseFloat(unit.rent_amount),
        depositAmount: parseFloat(unit.deposit_amount),
        status: unit.status,
        availableDate: unit.available_date,
        photos: unit.photos,
        amenities: unit.amenities,
        description: unit.description,
        property: {
          name: unit.property_name,
          address: unit.property_address,
          city: unit.city,
          state: unit.state,
          zipCode: unit.zip_code,
        },
      },
    });
  } catch (error) {
    console.error('Record scan error:', error);
    res.status(500).json({ error: 'Failed to record scan' });
  }
};

// Delete QR code
export const deleteQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM qr_codes q
       USING units u, properties p
       WHERE q.id = $1 AND q.unit_id = u.id AND u.property_id = p.id AND p.landlord_id = $2
       RETURNING q.id`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'QR code not found' });
      return;
    }

    res.json({ message: 'QR code deleted successfully' });
  } catch (error) {
    console.error('Delete QR code error:', error);
    res.status(500).json({ error: 'Failed to delete QR code' });
  }
};
