/**
 * Stub auth file for build compatibility
 * TODO: Implement proper NextAuth integration
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  company_id: string | null;
  cohort_id: string | null;
}

export interface Session {
  user: User;
}

// Stub auth function that returns null (for build purposes)
export async function auth(): Promise<Session | null> {
  return null;
}
