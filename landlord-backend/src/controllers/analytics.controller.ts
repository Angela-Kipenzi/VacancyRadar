import { Response } from 'express';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

// Get dashboard overview statistics
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Total properties
    const propertiesResult = await pool.query(
      'SELECT COUNT(*) as count FROM properties WHERE landlord_id = $1',
      [req.userId]
    );

    // Total units
    const unitsResult = await pool.query(
      `SELECT COUNT(*) as total,
        COUNT(CASE WHEN status = 'vacant' THEN 1 END) as vacant,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
       FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1`,
      [req.userId]
    );

    // Total tenants
    const tenantsResult = await pool.query(
      `SELECT COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active
       FROM tenants
       WHERE landlord_id = $1`,
      [req.userId]
    );

    // Pending applications
    const applicationsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM applications a
       JOIN units u ON a.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1 AND a.status = 'pending'`,
      [req.userId]
    );

    // Active leases
    const leasesResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1 AND l.status = 'active'`,
      [req.userId]
    );

    // Monthly revenue
    const revenueResult = await pool.query(
      `SELECT SUM(l.rent_amount) as total
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1 AND l.status = 'active'`,
      [req.userId]
    );

    // Occupancy rate
    const units = unitsResult.rows[0];
    const occupancyRate = units.total > 0
      ? ((parseInt(units.occupied) / parseInt(units.total)) * 100).toFixed(1)
      : '0';

    res.json({
      properties: parseInt(propertiesResult.rows[0].count),
      units: {
        total: parseInt(units.total),
        vacant: parseInt(units.vacant),
        occupied: parseInt(units.occupied),
        maintenance: parseInt(units.maintenance),
        occupancyRate: parseFloat(occupancyRate),
      },
      tenants: {
        total: parseInt(tenantsResult.rows[0].total),
        active: parseInt(tenantsResult.rows[0].active),
      },
      applications: {
        pending: parseInt(applicationsResult.rows[0].count),
      },
      leases: {
        active: parseInt(leasesResult.rows[0].count),
      },
      revenue: {
        monthly: revenueResult.rows[0].total ? parseFloat(revenueResult.rows[0].total) : 0,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Get revenue analytics
export const getRevenueAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Monthly revenue from active leases
    const activeRevenueResult = await pool.query(
      `SELECT SUM(l.rent_amount) as total
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1 AND l.status = 'active'`,
      [req.userId]
    );

    // Revenue by property
    const propertyRevenueResult = await pool.query(
      `SELECT p.id, p.name, p.address,
        SUM(l.rent_amount) as revenue,
        COUNT(l.id) as active_leases
       FROM properties p
       LEFT JOIN units u ON p.id = u.property_id
       LEFT JOIN leases l ON u.id = l.unit_id AND l.status = 'active'
       WHERE p.landlord_id = $1
       GROUP BY p.id, p.name, p.address
       ORDER BY revenue DESC NULLS LAST`,
      [req.userId]
    );

    // Projected annual revenue
    const monthlyRevenue = activeRevenueResult.rows[0].total
      ? parseFloat(activeRevenueResult.rows[0].total)
      : 0;
    const annualRevenue = monthlyRevenue * 12;

    res.json({
      monthly: monthlyRevenue,
      annual: annualRevenue,
      byProperty: propertyRevenueResult.rows.map((row:any) => ({
        propertyId: row.id,
        propertyName: row.name,
        propertyAddress: row.address,
        revenue: row.revenue ? parseFloat(row.revenue) : 0,
        activeLeases: parseInt(row.active_leases),
      })),
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
};

// Get occupancy analytics
export const getOccupancyAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Overall occupancy
    const overallResult = await pool.query(
      `SELECT COUNT(*) as total,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN status = 'vacant' THEN 1 END) as vacant,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
       FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1`,
      [req.userId]
    );

    // Occupancy by property
    const propertyResult = await pool.query(
      `SELECT p.id, p.name, p.address,
        COUNT(u.id) as total_units,
        COUNT(CASE WHEN u.status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN u.status = 'vacant' THEN 1 END) as vacant
       FROM properties p
       LEFT JOIN units u ON p.id = u.property_id
       WHERE p.landlord_id = $1
       GROUP BY p.id, p.name, p.address
       ORDER BY p.name`,
      [req.userId]
    );

    const overall = overallResult.rows[0];
    const totalUnits = parseInt(overall.total);
    const occupancyRate = totalUnits > 0
      ? ((parseInt(overall.occupied) / totalUnits) * 100).toFixed(1)
      : '0';

    res.json({
      overall: {
        total: totalUnits,
        occupied: parseInt(overall.occupied),
        vacant: parseInt(overall.vacant),
        maintenance: parseInt(overall.maintenance),
        pending: parseInt(overall.pending),
        occupancyRate: parseFloat(occupancyRate),
      },
      byProperty: propertyResult.rows.map((row: any) => {
        const total = parseInt(row.total_units);
        const occupied = parseInt(row.occupied);
        const rate = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0';
        
        return {
          propertyId: row.id,
          propertyName: row.name,
          propertyAddress: row.address,
          totalUnits: total,
          occupied,
          vacant: parseInt(row.vacant),
          occupancyRate: parseFloat(rate),
        };
      }),
    });
  } catch (error) {
    console.error('Get occupancy analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch occupancy analytics' });
  }
};

// Get application analytics
export const getApplicationAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Applications by status
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM applications a
       JOIN units u ON a.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1
       GROUP BY status`,
      [req.userId]
    );

    // Recent applications (last 30 days)
    const recentResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM applications a
       JOIN units u ON a.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1 
       AND a.submitted_at >= NOW() - INTERVAL '30 days'`,
      [req.userId]
    );

    // Applications by property
    const propertyResult = await pool.query(
      `SELECT p.id, p.name, COUNT(a.id) as count
       FROM properties p
       LEFT JOIN units u ON p.id = u.property_id
       LEFT JOIN applications a ON u.id = a.unit_id
       WHERE p.landlord_id = $1
       GROUP BY p.id, p.name
       ORDER BY count DESC`,
      [req.userId]
    );

    // Average time to review (in days)
    const reviewTimeResult = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - submitted_at)) / 86400) as avg_days
       FROM applications a
       JOIN units u ON a.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1 
       AND reviewed_at IS NOT NULL
       AND submitted_at >= NOW() - INTERVAL '90 days'`,
      [req.userId]
    );

    const byStatus: Record<string, number> = {};
    statusResult.rows.forEach((row: any) => {
      byStatus[row.status] = parseInt(row.count);
    });

    res.json({
      byStatus,
      recentApplications: parseInt(recentResult.rows[0].count),
      byProperty: propertyResult.rows.map((row: any) => ({
        propertyId: row.id,
        propertyName: row.name,
        count: parseInt(row.count),
      })),
      averageReviewTime: reviewTimeResult.rows[0].avg_days
        ? parseFloat(reviewTimeResult.rows[0].avg_days).toFixed(1)
        : '0',
    });
  } catch (error) {
    console.error('Get application analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch application analytics' });
  }
};

// Get QR code analytics
export const getQRCodeAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Total scans
    const totalScansResult = await pool.query(
      `SELECT SUM(q.scan_count) as total
       FROM qr_codes q
       JOIN units u ON q.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1`,
      [req.userId]
    );

    // Scans by unit
    const unitScansResult = await pool.query(
      `SELECT u.id, u.unit_number, p.name as property_name, q.scan_count
       FROM qr_codes q
       JOIN units u ON q.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1
       ORDER BY q.scan_count DESC
       LIMIT 10`,
      [req.userId]
    );

    // Recent scans (last 7 days)
    const recentScansResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM qr_scans qs
       JOIN qr_codes q ON qs.qr_code_id = q.id
       JOIN units u ON q.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1
       AND qs.scanned_at >= NOW() - INTERVAL '7 days'`,
      [req.userId]
    );

    // Scans by day (last 30 days)
    const scansByDayResult = await pool.query(
      `SELECT DATE(qs.scanned_at) as date, COUNT(*) as count
       FROM qr_scans qs
       JOIN qr_codes q ON qs.qr_code_id = q.id
       JOIN units u ON q.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1
       AND qs.scanned_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(qs.scanned_at)
       ORDER BY date DESC`,
      [req.userId]
    );

    res.json({
      totalScans: totalScansResult.rows[0].total
        ? parseInt(totalScansResult.rows[0].total)
        : 0,
      recentScans: parseInt(recentScansResult.rows[0].count),
      topUnits: unitScansResult.rows.map((row: any) => ({
        unitId: row.id,
        unitNumber: row.unit_number,
        propertyName: row.property_name,
        scanCount: row.scan_count,
      })),
      scansByDay: scansByDayResult.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count),
      })),
    });
  } catch (error) {
    console.error('Get QR code analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch QR code analytics' });
  }
};

// Get lease expiration analytics
export const getLeaseExpirationAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Leases expiring in next 30 days
    const expiring30Result = await pool.query(
      `SELECT COUNT(*) as count
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1
       AND l.status = 'active'
       AND l.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`,
      [req.userId]
    );

    // Leases expiring in next 60 days
    const expiring60Result = await pool.query(
      `SELECT COUNT(*) as count
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1
       AND l.status = 'active'
       AND l.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'`,
      [req.userId]
    );

    // Leases expiring in next 90 days
    const expiring90Result = await pool.query(
      `SELECT COUNT(*) as count
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1
       AND l.status = 'active'
       AND l.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'`,
      [req.userId]
    );

    // Upcoming expirations with details
    const upcomingResult = await pool.query(
      `SELECT l.id, l.end_date, u.unit_number, p.name as property_name,
        t.first_name, t.last_name, l.rent_amount
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       JOIN tenants t ON l.tenant_id = t.id
       WHERE p.landlord_id = $1
       AND l.status = 'active'
       AND l.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
       ORDER BY l.end_date ASC`,
      [req.userId]
    );

    res.json({
      expiring: {
        next30Days: parseInt(expiring30Result.rows[0].count),
        next60Days: parseInt(expiring60Result.rows[0].count),
        next90Days: parseInt(expiring90Result.rows[0].count),
      },
      upcoming: upcomingResult.rows.map((row: any) => ({
        leaseId: row.id,
        endDate: row.end_date,
        unitNumber: row.unit_number,
        propertyName: row.property_name,
        tenantName: `${row.first_name} ${row.last_name}`,
        rentAmount: parseFloat(row.rent_amount),
      })),
    });
  } catch (error) {
    console.error('Get lease expiration analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch lease expiration analytics' });
  }
};
