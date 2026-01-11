import 'dotenv/config';
import { sql } from '../db/connection.ts';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function createOrUpdateAdmin() {
  try {
    const email = 'demo4@example.com';
    const password = 'demo123456';
    const role = 'super_admin';

    console.log('\n=== Creating/Updating Admin User ===\n');

    // Check if user exists
    const existingUser = await sql`
      SELECT id, email, role
      FROM users
      WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      // User exists - update to admin
      console.log(`User ${email} already exists with role: ${existingUser[0].role}`);
      console.log(`Updating role to: ${role}...`);

      await sql`
        UPDATE users
        SET role = ${role}
        WHERE email = ${email}
      `;

      console.log(`✅ Successfully updated ${email} to ${role}`);
    } else {
      // Create new admin user
      console.log(`User ${email} does not exist. Creating new admin user...`);

      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);

      await sql`
        INSERT INTO users (id, email, password_hash, role, created_at)
        VALUES (
          ${userId},
          ${email},
          ${hashedPassword},
          ${role},
          NOW()
        )
      `;

      console.log(`✅ Successfully created admin user: ${email}`);
    }

    // Verify the change
    const verifyUser = await sql`
      SELECT id, email, role
      FROM users
      WHERE email = ${email}
    `;

    console.log('\n=== Admin User Details ===');
    console.log(`Email: ${verifyUser[0].email}`);
    console.log(`Role: ${verifyUser[0].role}`);
    console.log(`User ID: ${verifyUser[0].id}`);

    console.log('\n=== Login Credentials ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('Error creating/updating admin user:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

createOrUpdateAdmin();
