import express from 'express';
import { userService } from '../services/user-service.ts';
import { validateEmail, validateUUID } from '../utils/validation.ts';
import { parse } from 'csv-parse/sync';

const router = express.Router();

// Middleware to check authentication from Bearer token
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Get user from session token - using userService or sessionRepository
    const { sessionRepository } = await import('../db/repositories/session-repository.ts');
    const session = await sessionRepository.findByToken(token);

    if (!session) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }

    // Get user details
    const user = await userService.getUserById(session.user_id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

// Middleware to check admin role
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user || (user.role !== 'super_admin' && user.role !== 'company_admin')) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

// GET /api/users - Get all users (admin only)
router.get('/', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const users = await userService.getUsersByRole();
    return res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get users'
    });
  }
});

// POST /api/users - Create a single user (admin only)
router.post('/', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { firstName, lastName, email, password, role, jobRole } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, email, password, role'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Validate role
    const validRoles = ['super_admin', 'company_admin', 'trainer', 'learner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Construct full name
    const name = `${firstName} ${lastName}`.trim();

    // Create user
    const user = await userService.createUser({
      name,
      email,
      password,
      role,
      jobRole: jobRole || null,
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Failed to create user' });
    }

    return res.status(201).json({ success: true, user });
  } catch (error) {
    console.error('Create user error:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({ success: false, error: error.message });
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    });
  }
});

// GET /api/users/:id - Get user by ID (auth required, self or admin)
router.get('/:id', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = req.params.id;

    // Validate UUID
    if (!validateUUID(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }

    // Only admins can view other users
    if (currentUser.id !== userId && currentUser.role !== 'super_admin' && currentUser.role !== 'company_admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this user' });
    }

    // Get user with stats
    const user = await userService.getUserWithStats(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user'
    });
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.params.id;

    // Validate UUID
    if (!validateUUID(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }

    const { firstName, lastName, email, password, role, jobRole } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, email, role'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Validate role
    const validRoles = ['super_admin', 'company_admin', 'trainer', 'learner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Construct full name
    const name = `${firstName} ${lastName}`.trim();

    // Update user
    const updateData: any = {
      name,
      email,
      role,
      jobRole: jobRole || null,
    };

    // Only include password if provided
    if (password) {
      updateData.password = password;
    }

    const updatedUser = await userService.updateUser(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    if (error instanceof Error && error.message.includes('already taken')) {
      return res.status(409).json({ success: false, error: error.message });
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user'
    });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.params.id;

    // Validate UUID
    if (!validateUUID(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }

    // Delete user
    const success = await userService.deleteUser(userId);

    if (!success) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user'
    });
  }
});

// POST /api/users/bulk-import - Bulk import users (admin only)
router.post('/bulk-import', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { importMethod, users: usersData, csvData, jsonData } = req.body;

    let users: any[] = [];

    // Parse CSV data
    if (importMethod === 'csv' && csvData) {
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      users = records.map((record: any) => ({
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        password: record.password,
        role: record.role || 'learner',
        jobRole: record.jobRole || null,
      }));
    }
    // Parse JSON data
    else if (importMethod === 'json' && jsonData) {
      const parsedUsers = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      users = parsedUsers.map((user: any) => ({
        ...user,
        role: user.role || 'learner',
        jobRole: user.jobRole || null,
      }));
    }
    // Direct users array
    else if (usersData && Array.isArray(usersData)) {
      users = usersData.map((user: any) => ({
        ...user,
        role: user.role || 'learner',
        jobRole: user.jobRole || null,
      }));
    }
    else {
      return res.status(400).json({ success: false, error: 'Invalid import method or no data provided' });
    }

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, error: 'No users provided or invalid format' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    const validRoles = ['super_admin', 'company_admin', 'trainer', 'learner'];

    // Process each user
    for (const user of users) {
      const { firstName, lastName, email, password, role, jobRole } = user;

      // Validate required fields
      if (!firstName || !lastName || !email || !password) {
        results.failed++;
        results.errors.push(`User ${email || 'unknown'}: Missing required fields`);
        continue;
      }

      // Validate email format
      if (!validateEmail(email)) {
        results.failed++;
        results.errors.push(`User ${email}: Invalid email format`);
        continue;
      }

      // Validate role
      const userRole = role?.toLowerCase() || 'learner';
      if (!validRoles.includes(userRole)) {
        results.failed++;
        results.errors.push(`User ${email}: Invalid role. Must be one of: ${validRoles.join(', ')}`);
        continue;
      }

      try {
        // Construct full name
        const name = `${firstName} ${lastName}`.trim();

        // Create user via service
        await userService.createUser({
          name,
          email,
          password,
          role: userRole,
          jobRole: jobRole || null,
        });

        results.success++;
      } catch (error) {
        console.error(`Error creating user ${email}:`, error);
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`User ${email}: ${errorMessage}`);
      }
    }

    return res.json({ success: true, results });
  } catch (error) {
    console.error('Bulk import error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import users'
    });
  }
});

export default router;
