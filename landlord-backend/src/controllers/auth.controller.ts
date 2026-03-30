import { Response } from 'express';
import bcrypt from 'bcrypt';
import { body } from 'express-validator';
import pool from '../database/connection.js';
import { AuthRequest, UserRole, generateToken } from '../middleware/auth.js';

// Validation rules
export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').optional().isIn(['landlord', 'tenant']).withMessage('Invalid role'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').optional().isIn(['landlord', 'tenant']).withMessage('Invalid role'),
];

// Register
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, companyName, role } = req.body as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      companyName?: string;
      role?: UserRole;
    };

    const resolvedRole: UserRole = role === 'tenant' ? 'tenant' : 'landlord';

    if (resolvedRole === 'tenant') {
      // Check if tenant exists
      const existingTenant = await pool.query(
        'SELECT id FROM tenants WHERE email = $1',
        [email]
      );

      if (existingTenant.rows.length > 0) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create tenant (landlord_id can be null until linked)
      const result = await pool.query(
        `INSERT INTO tenants (landlord_id, first_name, last_name, email, phone, status, password)
         VALUES (NULL, $1, $2, $3, $4, $5, $6)
         RETURNING id, email, first_name, last_name, phone, status, created_at`,
        [firstName, lastName, email, phone || null, 'inactive', hashedPassword]
      );

      const tenant = result.rows[0];

      // Generate token
      const token = generateToken(tenant.id, tenant.email, 'tenant');

      res.status(201).json({
        message: 'Tenant registered successfully',
        token,
        user: {
          id: tenant.id,
          email: tenant.email,
          firstName: tenant.first_name,
          lastName: tenant.last_name,
          phone: tenant.phone,
          createdAt: tenant.created_at,
          role: 'tenant',
        },
      });
      return;
    }

    // Landlord registration (default)
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, company_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, phone, company_name, created_at`,
      [email, hashedPassword, firstName, lastName, phone || null, companyName || null]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user.id, user.email, 'landlord');

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        companyName: user.company_name,
        createdAt: user.created_at,
        role: 'landlord',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body as {
      email: string;
      password: string;
      role?: UserRole;
    };

    const resolvedRole: UserRole = role === 'tenant' ? 'tenant' : 'landlord';

    if (resolvedRole === 'tenant') {
      const result = await pool.query(
        'SELECT * FROM tenants WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const tenant = result.rows[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, tenant.password);

      if (!validPassword) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Generate token
      const token = generateToken(tenant.id, tenant.email, 'tenant');

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: tenant.id,
          email: tenant.email,
          firstName: tenant.first_name,
          lastName: tenant.last_name,
          phone: tenant.phone,
          role: 'tenant',
        },
      });
      return;
    }

    // Landlord login (default)
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.email, 'landlord');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        companyName: user.company_name,
        role: 'landlord',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Get current user
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userRole === 'tenant') {
      const result = await pool.query(
        'SELECT id, email, first_name, last_name, phone, created_at FROM tenants WHERE id = $1',
        [req.userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const user = result.rows[0];

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        createdAt: user.created_at,
        role: 'tenant',
      });
      return;
    }

    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone, company_name, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      companyName: user.company_name,
      createdAt: user.created_at,
      role: 'landlord',
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phone, companyName } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           company_name = COALESCE($4, company_name)
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, company_name`,
      [firstName, lastName, phone, companyName, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        companyName: user.company_name,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, req.userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
