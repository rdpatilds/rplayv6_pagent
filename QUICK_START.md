# 🚀 Quick Start Guide

## Environment Setup Summary

### ✅ Frontend Environment (.env.local)
**Location**: `/simulator/frontend/.env.local`
**Status**: ✅ Already configured
**Action**: **NO CHANGES NEEDED** - `.env.local` is the correct filename for Next.js

```bash
# Current settings (already correct):
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=AI Simulation Platform
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 🔧 Backend Environment (.env)
**Location**: `/simulator/backend/.env`
**Status**: ✅ Created (needs your values)
**Action**: **UPDATE with your credentials**

#### Required Variables:

1. **DATABASE_URL** (Required):
   ```bash
   # If using local PostgreSQL:
   DATABASE_URL=postgresql://user:password@localhost:5432/simulator_db

   # If using Neon (cloud PostgreSQL):
   DATABASE_URL=postgresql://user:password@your-project.neon.tech/simulator_db
   ```

2. **OPENAI_API_KEY** (Required for AI features):
   ```bash
   # Get from: https://platform.openai.com/api-keys
   OPENAI_API_KEY=sk-proj-...
   ```

#### Optional Variables:
- EMAIL_* - Only needed if testing email features
- RATE_LIMIT_* - Only needed for production rate limiting

---

## 🎯 Minimal Setup (Get Started Fast)

**For quick testing**, you only need:

### 1. Edit Backend .env
```bash
cd /home/user/projects/smulation1/v0-simulation-end-user-and-admin-main/simulator/backend
nano .env  # or use your preferred editor
```

**Minimum required**:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/simulator_db
OPENAI_API_KEY=sk-...
```

### 2. Frontend .env.local
✅ Already set - no changes needed!

---

## 📦 Installation & Startup

### One-Time Setup (Install Dependencies)

**Backend**:
```bash
cd /home/user/projects/smulation1/v0-simulation-end-user-and-admin-main/simulator/backend
npm install
```

**Frontend**:
```bash
cd /home/user/projects/smulation1/v0-simulation-end-user-and-admin-main/simulator/frontend
npm install
```

### Daily Startup (2 Terminals)

**Terminal 1 - Backend**:
```bash
cd /home/user/projects/smulation1/v0-simulation-end-user-and-admin-main/simulator/backend
npm run dev
```
Expected output:
```
✓ Backend server running on http://localhost:3001
✓ Database connected
```

**Terminal 2 - Frontend**:
```bash
cd /home/user/projects/smulation1/v0-simulation-end-user-and-admin-main/simulator/frontend
npm run dev
```
Expected output:
```
✓ Ready on http://localhost:3000
```

---

## 🧪 Test #1: User Registration (2 minutes)

Once both servers are running:

### Step 1: Open Browser
Navigate to: **http://localhost:3000/signup**

### Step 2: Fill Registration Form
```
Name: Test User
Email: test@example.com
Password: Test123!
Job Role: Developer
Company: Test Corp
```

### Step 3: Open DevTools (F12)
- Click **Network** tab
- Click **Sign Up** button

### Step 4: Verify Success ✅

**What to Check**:
1. **Network Tab**:
   - See POST request to `/api/auth/register`
   - Status: **200 OK**
   - Response: `{ success: true, data: { user, token } }`

2. **Application Tab** → localStorage:
   - Key `token` exists
   - Key `user` has your data

3. **Browser**:
   - Redirected to dashboard
   - Green toast: "Account created successfully"
   - No red console errors

### Step 5: Verify API Client Code ✅

The registration used our new API client:
```typescript
// components/signup-form.tsx line ~45
const response = await authApi.register({
  name: formData.name,
  email: formData.email,
  password: formData.password,
  jobRole: formData.jobRole,
  company: formData.company,
})
// Token automatically stored in localStorage!
```

**Before refactoring** (old code):
- 20+ lines of fetch boilerplate
- Manual token storage
- Manual error handling

**After refactoring** (new code):
- 1 line API call
- Automatic token storage
- Centralized error handling

---

## 🎉 Success!

If registration worked, your API client integration is working perfectly!

**What you just verified**:
- ✅ Frontend → Backend communication
- ✅ API proxy working (next.config.mjs)
- ✅ API client auto-adds headers
- ✅ Token stored automatically
- ✅ Type-safe response handling
- ✅ Error handling via toast

---

## 📋 Next Tests (Priority Order)

After successful registration:

1. **Test Login** (1 min):
   - Go to `/login`
   - Use test@example.com / Test123!
   - Should redirect to dashboard

2. **Test Simulation Flow** (5 min):
   - Click "Start New Simulation"
   - Select industry/difficulty
   - Watch Network tab (11 API calls!)
   - Complete simulation

3. **Test User Management** (3 min):
   - Go to `/admin/user-management`
   - View users table
   - Create/edit/delete users

For detailed steps, see: `/simulator/frontend/TESTING_GUIDE.md`

---

## 🐛 Troubleshooting

### Issue: Backend won't start
**Error**: "DATABASE_URL is required"
**Fix**: Edit `/simulator/backend/.env` and add your database URL

### Issue: Frontend shows "Network Error"
**Check**:
1. Is backend running on port 3001?
2. Check `/simulator/frontend/.env.local` has correct URL
3. Restart frontend server

### Issue: 401 Unauthorized
**Fix**:
1. Clear localStorage (DevTools → Application → localStorage → Clear)
2. Login again

### Issue: API calls go to wrong URL
**Check**:
1. Backend running on **port 3001** ✅
2. Frontend running on **port 3000** ✅
3. Check `next.config.mjs` rewrites configuration

---

## 📞 Documentation Links

- **Testing Guide**: `/simulator/frontend/TESTING_GUIDE.md`
- **Testing Checklist**: `/simulator/frontend/TESTING_CHECKLIST.md`
- **Session Summary**: `/SESSION_SUMMARY.md`
- **Migration Status**: `/MIGRATION_STATUS.md`

---

**Ready to test? Start with Test #1 above! 🚀**
