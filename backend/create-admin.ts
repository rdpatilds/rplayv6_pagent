import 'dotenv/config';
import { sql } from './db/index.ts';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Admin123Pass', 10);
    const userId = uuidv4();

    await sql`
      INSERT INTO users (id, name, email, password, role, job_role, created_at)
      VALUES (${userId}, 'Admin User', 'admin@example.com', ${hashedPassword}, 'super_admin', 'Administrator', NOW())
      ON CONFLICT (email) DO UPDATE SET role = 'super_admin'
    `;

    console.log('✓ Admin user created/updated successfully');
    console.log('  Email: admin@example.com');
    console.log('  Password: Admin123Pass');
    console.log('  Role: super_admin');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
