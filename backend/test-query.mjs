import { sql } from './db/index.ts';

try {
  // Try to get constraint definition
  const constraints = await sql`
    SELECT 
      conname,
      pg_get_constraintdef(c.oid) as definition
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'users' AND conname LIKE '%role%'
  `;
  
  console.log('Constraint definition:', JSON.stringify(constraints, null, 2));
  process.exit(0);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
