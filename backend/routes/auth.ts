/**
 * Express Auth Routes
 * Handles authentication endpoints
 */

import express from 'express';
import { authService } from '../services/auth-service.ts';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req: express.Request, res: express.Response) => {
  try {
    const { name, email, password, jobRole, company } = req.body;

    console.log('[REGISTRATION] Attempt for email:', email);

    // Use auth service to handle registration
    // Note: company field is currently not stored in database
    const result = await authService.signup({
      name,
      email,
      password,
      job_role: jobRole
      // Omit role to use default from auth service (learner)
    });

    console.log('[REGISTRATION] Success for user:', result.user.id, email);

    return res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.sessionToken
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    console.error('[REGISTRATION] Failed for email:', req.body.email, '- Error:', message);

    // Handle specific error cases
    if (message.includes('already registered') || message.includes('already exists') || message.includes('unique constraint') || message.includes('duplicate key')) {
      return res.status(409).json({
        success: false,
        error: 'This email is already registered. Please use a different email or try logging in.'
      });
    }

    return res.status(400).json({
      success: false,
      error: message
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    // Use auth service to handle login
    const result = await authService.login({ email, password });

    return res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.sessionToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }
});

// POST /api/auth/change-password
router.post('/change-password', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    // Use auth service to handle password change
    await authService.changePassword(userId, currentPassword, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    const message = error instanceof Error ? error.message : 'Password change failed';

    if (message.includes('not found')) {
      return res.status(404).json({ success: false, error: message });
    }
    if (message.includes('incorrect') || message.includes('invalid')) {
      return res.status(401).json({ success: false, error: message });
    }

    return res.status(400).json({
      success: false,
      error: message
    });
  }
});

// Debug endpoint
router.get('/debug-constraint', async (req: express.Request, res: express.Response) => {
  try {
    const { sql } = await import('../db/index.ts');
    const constraints = await sql`
      SELECT
        conname,
        pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'users' AND conname LIKE '%role%'
    `;
    res.json({ constraints });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

export default router;
