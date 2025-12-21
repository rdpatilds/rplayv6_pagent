import { querySingle, query } from "./db"
import type { User } from "@/auth"

export async function getUserById(id: string): Promise<User | null> {
  return querySingle<User>("SELECT id, email, name, role, company_id, cohort_id FROM users WHERE id = $1", [id])
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return querySingle<User>("SELECT id, email, name, role, company_id, cohort_id FROM users WHERE email = $1", [email])
}

export async function getUsers(companyId?: string): Promise<User[]> {
  if (companyId) {
    return query<User>("SELECT id, email, name, role, company_id, cohort_id FROM users WHERE company_id = $1", [
      companyId,
    ])
  }

  return query<User>("SELECT id, email, name, role, company_id, cohort_id FROM users")
}
