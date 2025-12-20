import 'dotenv/config';
import { sql } from '../db/connection.ts';

async function queryUsers() {
  try {
    console.log('\n=== Querying Users Table ===\n');

    const users = await sql`
      SELECT id, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 20
    `;

    if (users.length === 0) {
      console.log('No users found in database.');
      return;
    }

    console.log(`Found ${users.length} users:\n`);
    console.log('EMAIL'.padEnd(35), 'ROLE'.padEnd(20), 'CREATED');
    console.log('-'.repeat(80));

    users.forEach((user: any) => {
      const email = user.email.padEnd(35);
      const role = user.role.padEnd(20);
      const created = new Date(user.created_at).toLocaleDateString();
      console.log(email, role, created);
    });

    console.log('\n' + '='.repeat(80));

    // Count by role
    const adminCount = users.filter((u: any) => u.role === 'super_admin' || u.role === 'company_admin').length;
    const trainerCount = users.filter((u: any) => u.role === 'trainer').length;
    const learnerCount = users.filter((u: any) => u.role === 'learner').length;

    console.log('\nRole Distribution:');
    console.log(`  Admins (super_admin/company_admin): ${adminCount}`);
    console.log(`  Trainers: ${trainerCount}`);
    console.log(`  Learners: ${learnerCount}`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('Error querying users:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

queryUsers();
