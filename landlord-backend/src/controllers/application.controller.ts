import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

// Validation rules
export const applicationValidation = [
  body('unitId').isUUID().withMessage('Valid unit ID is required'),
  body('applicantName').trim().notEmpty().withMessage('Applicant name is required'),
  body('applicantEmail').isEmail().withMessage('Valid email is required'),
  body('applicantPhone').trim().notEmpty().withMessage('Phone number is required'),
];

export const tenantApplicationValidation = [
  body('unitId').isUUID().withMessage('Valid unit ID is required'),
  body('applicant').isObject().withMessage('Applicant details are required'),
  body('applicant.firstName').trim().notEmpty().withMessage('First name is required'),
  body('applicant.lastName').trim().notEmpty().withMessage('Last name is required'),
  body('applicant.email').isEmail().withMessage('Valid email is required'),
  body('applicant.phone').trim().notEmpty().withMessage('Phone number is required'),
];

// Get all applications for landlord
export const getApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, unitId } = req.query;

    let query = `
      SELECT a.*, u.unit_number, p.name as property_name, p.address as property_address
      FROM applications a
      JOIN units u ON a.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE p.landlord_id = $1
    `;

    const params: any[] = [req.userId];

    if (status) {
      query += ` AND a.status = $${params.length + 1}`;
      params.push(status);
    }

    if (unitId) {
      query += ` AND a.unit_id = $${params.length + 1}`;
      params.push(unitId);
    }

    query += ' ORDER BY a.submitted_at DESC';

    const result = await pool.query(query, params);

    const applications = result.rows.map((row:any) => ({
      id: row.id,
      unitId: row.unit_id,
      unitNumber: row.unit_number,
      propertyName: row.property_name,
      propertyAddress: row.property_address,
      applicantName: row.applicant_name,
      applicantEmail: row.applicant_email,
      applicantPhone: row.applicant_phone,
      currentAddress: row.current_address,
      employmentStatus: row.employment_status,
      employerName: row.employer_name,
      annualIncome: row.annual_income ? parseFloat(row.annual_income) : null,
      moveInDate: row.move_in_date,
      numOccupants: row.num_occupants,
      hasPets: row.has_pets,
      petDetails: row.pet_details,
      status: row.status,
      notes: row.notes,
      documents: row.documents,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

// Get single application
export const getApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, u.unit_number, u.bedrooms, u.bathrooms, u.rent_amount,
        p.name as property_name, p.address as property_address
       FROM applications a
       JOIN units u ON a.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE a.id = $1 AND p.landlord_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const row = result.rows[0];
    const application = {
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
      applicantName: row.applicant_name,
      applicantEmail: row.applicant_email,
      applicantPhone: row.applicant_phone,
      currentAddress: row.current_address,
      employmentStatus: row.employment_status,
      employerName: row.employer_name,
      annualIncome: row.annual_income ? parseFloat(row.annual_income) : null,
      moveInDate: row.move_in_date,
      numOccupants: row.num_occupants,
      hasPets: row.has_pets,
      petDetails: row.pet_details,
      status: row.status,
      notes: row.notes,
      documents: row.documents,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
};

// Create application (public endpoint - no auth)
export const createApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      unitId,
      applicantName,
      applicantEmail,
      applicantPhone,
      currentAddress,
      employmentStatus,
      employerName,
      annualIncome,
      moveInDate,
      numOccupants,
      hasPets,
      petDetails,
      documents,
      tenantId,
    } = req.body;

    // Verify unit exists and is available
    const unitCheck = await pool.query(
      'SELECT id, status FROM units WHERE id = $1',
      [unitId]
    );

    if (unitCheck.rows.length === 0) {
      res.status(404).json({ error: 'Unit not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO applications (
        unit_id, tenant_id, applicant_name, applicant_email, applicant_phone,
        current_address, employment_status, employer_name, annual_income,
        move_in_date, num_occupants, has_pets, pet_details, status, documents
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        unitId,
        tenantId || null,
        applicantName,
        applicantEmail,
        applicantPhone,
        currentAddress || null,
        employmentStatus || null,
        employerName || null,
        annualIncome || null,
        moveInDate || null,
        numOccupants || null,
        hasPets || false,
        petDetails || null,
        'pending',
        JSON.stringify(documents || []),
      ]
    );

    const application = result.rows[0];

    // Create notification for landlord
    const landlordResult = await pool.query(
      `SELECT p.landlord_id FROM properties p
       JOIN units u ON p.id = u.property_id
       WHERE u.id = $1`,
      [unitId]
    );

    if (landlordResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          landlordResult.rows[0].landlord_id,
          'application',
          'New Application Received',
          `${applicantName} has submitted an application`,
          `/applications/${application.id}`,
        ]
      );
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        status: application.status,
        submittedAt: application.submitted_at,
      },
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
};

// Tenant: Get own applications
export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.unit_number, u.bedrooms, u.bathrooms, u.rent_amount,
        p.id as property_id, p.name as property_name, p.address as property_address, p.city as property_city
       FROM applications a
       JOIN units u ON a.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE a.tenant_id = $1
       ORDER BY a.submitted_at DESC`,
      [req.userId]
    );

    const mapStatus = (status: string) => (status === 'under_review' ? 'pending' : status);

    const applications = result.rows.map((row: any) => ({
      id: row.id,
      propertyId: row.property_id,
      propertyName: row.property_name,
      propertyAddress: `${row.property_address}, ${row.property_city}`,
      unitNumber: row.unit_number,
      monthlyRent: parseFloat(row.rent_amount),
      bedrooms: row.bedrooms,
      bathrooms: parseFloat(row.bathrooms),
      applicant: {
        firstName: row.applicant_name?.split(' ')[0] || '',
        lastName: row.applicant_name?.split(' ').slice(1).join(' ') || '',
        email: row.applicant_email,
        phone: row.applicant_phone,
        currentAddress: row.current_address || undefined,
      },
      message: row.notes || undefined,
      status: mapStatus(row.status),
      appliedOn: row.submitted_at
        ? String(row.submitted_at).slice(0, 10)
        : row.created_at
          ? String(row.created_at).slice(0, 10)
          : '',
    }));

    res.json(applications);
  } catch (error) {
    console.error('Get tenant applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

export const getMyApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT a.*, u.unit_number, u.bedrooms, u.bathrooms, u.rent_amount,
        p.id as property_id, p.name as property_name, p.address as property_address, p.city as property_city
       FROM applications a
       JOIN units u ON a.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE a.id = $1 AND a.tenant_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const row = result.rows[0];
    const mapStatus = (status: string) => (status === 'under_review' ? 'pending' : status);

    res.json({
      id: row.id,
      propertyId: row.property_id,
      propertyName: row.property_name,
      propertyAddress: `${row.property_address}, ${row.property_city}`,
      unitNumber: row.unit_number,
      monthlyRent: parseFloat(row.rent_amount),
      bedrooms: row.bedrooms,
      bathrooms: parseFloat(row.bathrooms),
      applicant: {
        firstName: row.applicant_name?.split(' ')[0] || '',
        lastName: row.applicant_name?.split(' ').slice(1).join(' ') || '',
        email: row.applicant_email,
        phone: row.applicant_phone,
        currentAddress: row.current_address || undefined,
      },
      message: row.notes || undefined,
      status: mapStatus(row.status),
      appliedOn: row.submitted_at
        ? String(row.submitted_at).slice(0, 10)
        : row.created_at
          ? String(row.created_at).slice(0, 10)
          : '',
    });
  } catch (error) {
    console.error('Get tenant application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
};

export const createTenantApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unitId, applicant, message } = req.body;
    const applicantName = `${applicant.firstName} ${applicant.lastName}`.trim();

    const unitCheck = await pool.query(
      'SELECT id FROM units WHERE id = $1',
      [unitId]
    );

    if (unitCheck.rows.length === 0) {
      res.status(404).json({ error: 'Unit not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO applications (
        unit_id, tenant_id, applicant_name, applicant_email, applicant_phone,
        current_address, status, notes, documents
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        unitId,
        req.userId,
        applicantName,
        applicant.email,
        applicant.phone,
        applicant.currentAddress || null,
        'pending',
        message || null,
        JSON.stringify([]),
      ]
    );

    const row = result.rows[0];
    res.status(201).json({
      application: {
        id: row.id,
        status: row.status,
        submittedAt: row.submitted_at,
      },
    });
  } catch (error) {
    console.error('Create tenant application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

export const withdrawMyApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE applications
       SET status = 'withdrawn'
       WHERE id = $1 AND tenant_id = $2
       RETURNING id, status`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.json({ message: 'Application withdrawn', application: result.rows[0] });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ error: 'Failed to withdraw application' });
  }
};

// Update application status
export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const nextNotes = notes ?? null;

    if (!['pending', 'under_review', 'approved', 'rejected', 'withdrawn'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    // Verify ownership
    await client.query('BEGIN');

    const ownershipCheck = await client.query(
      `SELECT a.id FROM applications a
       JOIN units u ON a.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE a.id = $1 AND p.landlord_id = $2`,
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const result = await client.query(
      `UPDATE applications SET
        status = $1::text,
        notes = COALESCE($2::text, notes),
        reviewed_at = CASE WHEN $1::text IN ('approved', 'rejected') THEN CURRENT_TIMESTAMP ELSE reviewed_at END
       WHERE id = $3::uuid
       RETURNING *`,
      [status, nextNotes, id]
    );

    const application = result.rows[0];

    // Update unit status if approved
    if (status === 'approved') {
      await client.query(
        'UPDATE units SET status = $1 WHERE id = $2',
        ['pending', application.unit_id]
      );

      let tenantId: string | null = application.tenant_id ?? null;

      if (tenantId) {
        const tenantResult = await client.query(
          'SELECT id, landlord_id FROM tenants WHERE id = $1',
          [tenantId]
        );
        if (tenantResult.rows.length > 0) {
          const currentLandlord = tenantResult.rows[0].landlord_id;
          if (!currentLandlord || currentLandlord === req.userId) {
            await client.query(
              `UPDATE tenants SET
                landlord_id = $1,
                status = COALESCE(status, 'inactive')
               WHERE id = $2`,
              [req.userId, tenantId]
            );
          }
        }
      } else {
        const existingTenant = await client.query(
          'SELECT id, landlord_id FROM tenants WHERE email = $1',
          [application.applicant_email]
        );

        if (existingTenant.rows.length > 0) {
          tenantId = existingTenant.rows[0].id;
          const currentLandlord = existingTenant.rows[0].landlord_id;
          if (!currentLandlord || currentLandlord === req.userId) {
            await client.query(
              `UPDATE tenants SET
                landlord_id = $1,
                status = COALESCE(status, 'inactive')
               WHERE id = $2`,
              [req.userId, tenantId]
            );
          }
        } else {
          const nameParts = String(application.applicant_name || '').split(' ').filter(Boolean);
          const firstName = nameParts[0] || 'Tenant';
          const lastName = nameParts.slice(1).join(' ') || 'Applicant';
          const createdTenant = await client.query(
            `INSERT INTO tenants (
              landlord_id, first_name, last_name, email, phone, status, move_in_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id`,
            [
              req.userId,
              firstName,
              lastName,
              application.applicant_email,
              application.applicant_phone,
              'inactive',
              application.move_in_date || null,
            ]
          );
          tenantId = createdTenant.rows[0]?.id ?? null;
        }
      }

      if (tenantId && !application.tenant_id) {
        await client.query(
          'UPDATE applications SET tenant_id = $1 WHERE id = $2',
          [tenantId, application.id]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      message: 'Application updated successfully',
      application: {
        id: application.id,
        status: application.status,
        notes: application.notes,
        reviewedAt: application.reviewed_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update application error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to update application', details });
  } finally {
    client.release();
  }
};

// Delete application
export const deleteApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM applications a
       USING units u, properties p
       WHERE a.id = $1 AND a.unit_id = u.id AND u.property_id = p.id AND p.landlord_id = $2
       RETURNING a.id`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
};
