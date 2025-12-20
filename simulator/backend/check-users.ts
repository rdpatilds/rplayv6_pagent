import { sql } from './db/connection.ts';

async function checkUsers() {
  try {
    const users = await sql`SELECT email, role FROM users LIMIT 10`;
    console.log('\nAvailable users in database:');
    console.log('============================');
    users.forEach((u: any) => console.log(`  - ${u.email} (role: ${u.role})`));
    console.log('============================\n');
  } catch (error) {
    console.error('Error querying users:', error);
  }
  process.exit(0);
}

checkUsers();
