# Database Setup Guide

## Issue Resolved

The error **"Unexpected token '<', "<!DOCTYPE "... is not valid JSON"** occurs because the application can't connect to the database. The signup API returns an HTML error page instead of JSON.

## Solution: Set Up Neon Database

### Step 1: Create a Neon Database

1. Go to [https://console.neon.tech/](https://console.neon.tech/)
2. Sign up or log in to your Neon account
3. Click **"Create Project"**
4. Choose a name for your project (e.g., "skill-simulator")
5. Select a region close to you
6. Click **"Create Project"**

### Step 2: Get Your Database Connection String

1. After creating the project, you'll see a connection string
2. Copy the **Connection String** that looks like:
   ```
   postgresql://username:password@host.region.neon.tech/database?sslmode=require
   ```
3. Keep this string safe - you'll need it in the next step

### Step 3: Initialize the Database Schema

1. In your Neon project dashboard, click **"SQL Editor"** in the left sidebar
2. Open the file `init-database.sql` (in the project root)
3. Copy the entire contents of that file
4. Paste it into the Neon SQL Editor
5. Click **"Run"** to execute the script
6. You should see success messages for all tables created

**What this script does:**
- Creates 8 tables: companies, users, sessions, parameters, parameter_categories, simulations, engagement_events, nps_feedback
- Adds indexes for performance
- Inserts 5 test users (including demo accounts)

### Step 4: Update Your .env File

1. Open the `.env` file in your project root
2. Replace the placeholder `DATABASE_URL` with your actual connection string:

```env
DATABASE_URL=postgresql://your-username:your-password@your-host.region.neon.tech/your-database?sslmode=require
```

**Example:**
```env
OPENAI_API_KEY=sk-proj-rsq1...
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://myuser:mypassword@ep-cool-rain-12345.us-east-2.aws.neon.tech/mydb?sslmode=require
```

### Step 5: Restart Your Development Server

If your dev server is running, restart it:

```bash
# Press Ctrl+C to stop the server
# Then restart:
npm run dev
```

### Step 6: Test the Signup

1. Go to [http://localhost:3001/signup](http://localhost:3001/signup)
2. Fill in the signup form:
   - First Name: Your Name
   - Last Name: Your Last Name
   - Email: youremail@example.com
   - Password: (at least 8 characters)
   - Confirm Password: (same as password)
3. Click **"Sign Up"**
4. You should be redirected to the dashboard!

## Default Test Users

After running the initialization script, you can log in with these test accounts:

| Email | Password | Role |
|-------|----------|------|
| brittany.jones+learner@kaplan.com | admin123 | learner |
| brittany.jones+trainer@kaplan.com | admin123 | trainer |
| brittany.jones+companyadmin@kaplan.com | admin123 | company_admin |
| brittany.jones+superadmin@kaplan.com | admin123 | super_admin |
| demo@example.com | demo123 | learner |

## Troubleshooting

### Error: "ECONNREFUSED"
- Check that your `DATABASE_URL` is correct
- Make sure your Neon database is active (free tier may suspend after inactivity)

### Error: "relation does not exist"
- You need to run the `init-database.sql` script in the Neon SQL Editor
- Make sure all tables were created successfully

### Error: "password authentication failed"
- Your connection string has incorrect credentials
- Copy the connection string again from Neon console

### Still Getting JSON Parse Error?
1. Check the browser console (F12) for more details
2. Check the terminal where `npm run dev` is running for error messages
3. Make sure you restarted the dev server after updating `.env`

## Database Tables Overview

The application uses these tables:

1. **companies** - Organization/company information
2. **users** - User accounts with roles (learner, trainer, admin)
3. **sessions** - Authentication sessions
4. **parameters** - AI personality parameters
5. **parameter_categories** - Parameter groupings
6. **simulations** - Completed simulation records
7. **engagement_events** - User engagement tracking
8. **nps_feedback** - Net Promoter Score feedback

## Security Note

⚠️ **IMPORTANT**: The test users have plain text passwords for demo purposes only. In production:
- Use bcrypt to hash passwords
- Remove or change default test accounts
- Use strong, unique passwords
- Enable Neon's security features

## Next Steps

Once signup works, you can:
- Complete a simulation session
- View your performance review
- Track your progress over time
- Configure AI parameters as an admin
