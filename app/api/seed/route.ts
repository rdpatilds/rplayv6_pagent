import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { sql } from "@/lib/db"

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "This endpoint is only available in development" }, { status: 403 })
  }

  try {
    // Create tables
    await sql`
      -- Users Table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT NOT NULL,
        role TEXT CHECK (role IN ('learner', 'trainer', 'company_admin', 'super_admin')) NOT NULL,
        company_id UUID,
        cohort_id UUID,
        created_at TIMESTAMP DEFAULT now()
      );

      -- Companies Table
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      );

      -- Cohorts Table
      CREATE TABLE IF NOT EXISTS cohorts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        company_id UUID REFERENCES companies(id),
        created_at TIMESTAMP DEFAULT now()
      );

      -- Simulation Sessions
      CREATE TABLE IF NOT EXISTS simulation_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        industry_id UUID,
        subcategory_id UUID,
        focus_area_id UUID,
        difficulty_level TEXT,
        client_profile JSONB,
        simulation_messages JSONB,
        is_replay BOOLEAN DEFAULT false,
        original_session_id UUID,
        xp_earned INT,
        started_at TIMESTAMP DEFAULT now(),
        ended_at TIMESTAMP
      );

      -- Objectives
      CREATE TABLE IF NOT EXISTS simulation_objectives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES simulation_sessions(id),
        objective_name TEXT,
        status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
        updated_at TIMESTAMP DEFAULT now()
      );

      -- XP Log
      CREATE TABLE IF NOT EXISTS xp_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        session_id UUID REFERENCES simulation_sessions(id),
        xp_source TEXT,
        amount INT,
        awarded_at TIMESTAMP DEFAULT now()
      );

      -- NPS Feedback
      CREATE TABLE IF NOT EXISTS feedback_nps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        session_id UUID REFERENCES simulation_sessions(id),
        rating INT CHECK (rating BETWEEN 0 AND 10),
        comment TEXT,
        created_at TIMESTAMP DEFAULT now()
      );

      -- Engagement Events
      CREATE TABLE IF NOT EXISTS engagement_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        session_id UUID REFERENCES simulation_sessions(id),
        event_type TEXT,
        event_payload JSONB,
        occurred_at TIMESTAMP DEFAULT now()
      );

      -- Indexes for joins and performance
      CREATE INDEX IF NOT EXISTS idx_simulation_sessions_user_id ON simulation_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_xp_log_user_id ON xp_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_simulation_objectives_session_id ON simulation_objectives(session_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_nps_session_id ON feedback_nps(session_id);
    `

    // Hash the password
    const hashedPassword = await hash("admin123", 10)

    // Seed test users
    const testUsers = [
      { email: "brittany.jones+learner@kaplan.com", name: "Brittany Learner", role: "learner" },
      { email: "brittany.jones+trainer@kaplan.com", name: "Brittany Trainer", role: "trainer" },
      { email: "brittany.jones+companyadmin@kaplan.com", name: "Brittany Admin", role: "company_admin" },
      { email: "brittany.jones+superadmin@kaplan.com", name: "Brittany SuperAdmin", role: "super_admin" },
    ]

    for (const user of testUsers) {
      await sql`
        INSERT INTO users (email, name, password, role)
        VALUES (${user.email}, ${user.name}, ${hashedPassword}, ${user.role})
        ON CONFLICT (email) DO NOTHING
      `
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully" })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 })
  }
}
