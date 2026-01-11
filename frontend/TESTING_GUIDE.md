# Quick Testing Guide - API Client Integration

## ✅ Setup Complete

Your frontend module is fully configured and ready for testing:
- ✅ 21 files migrated to use API client
- ✅ Environment configured (.env.local created)
- ✅ API proxy configured (next.config.mjs)
- ✅ TypeScript paths configured (tsconfig.json)
- ✅ All dependencies installed

---

## 🚀 Quick Start

### 1. Start the Backend (Terminal 1)
```bash
cd /home/user/projects/smulation1/v0-simulation-end-user-and-admin-main/simulator/backend
npm run dev
```
**Expected**: Backend running on http://localhost:3001

### 2. Start the Frontend (Terminal 2)
```bash
cd /home/user/projects/smulation1/v0-simulation-end-user-and-admin-main/simulator/frontend
npm run dev
```
**Expected**: Frontend running on http://localhost:3000

### 3. Open Browser
Navigate to: http://localhost:3000

---

## 🧪 Critical Test Flows (Priority Order)

### Test 1: User Registration ⭐ CRITICAL
**File**: `components/signup-form.tsx`
**API Method**: `authApi.register()`

1. Navigate to: http://localhost:3000/signup
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!
   - Job Role: Developer
   - Company: Test Corp
3. Click "Sign Up"

**✅ Success Criteria**:
- User created successfully
- Redirected to dashboard
- Token stored in localStorage
- Success toast appears
- No console errors

**🔍 What to Check**:
- Open DevTools → Network tab
- Look for POST request to `/api/auth/register`
- Check Response: `{ success: true, data: { user, token } }`
- Open DevTools → Application → localStorage
- Verify `token` key exists

**📝 API Client Code Being Tested**:
```typescript
// components/signup-form.tsx line ~45
const response = await authApi.register({
  name: formData.name,
  email: formData.email,
  password: formData.password,
  jobRole: formData.jobRole,
  company: formData.company,
})
```

---

### Test 2: User Login ⭐ CRITICAL
**File**: `components/login-form.tsx`
**API Method**: `authApi.login()`

1. Navigate to: http://localhost:3000/login
2. Enter credentials from Test 1:
   - Email: test@example.com
   - Password: Test123!
3. Click "Login"

**✅ Success Criteria**:
- Login successful
- Redirected to dashboard
- Token stored in localStorage
- No console errors

**🔍 What to Check**:
- Network tab: POST `/api/auth/login`
- Response includes token
- localStorage updated
- User data in localStorage

**📝 API Client Code Being Tested**:
```typescript
// components/login-form.tsx line ~35
const response = await authApi.login(email, password)
// Auto-stores token in localStorage
```

---

### Test 3: Complete Simulation Flow ⭐ CRITICAL
**Files**: industry-selection, setup, session, review (4 pages)
**API Methods**: Multiple `apiClient.get()`, `apiClient.post()`

#### 3.1 Industry Selection
1. From dashboard, click "Start New Simulation"
2. Navigate to: http://localhost:3000/simulation/industry-selection

**Actions**:
- Select Industry: "Insurance"
- **Expected**: Subcategories load dynamically
- Select Subcategory: "Life & Health"
- **Expected**: Focus areas appear
- Select Difficulty: "Intermediate"
- Select 2-3 Focus Areas
- **Expected**: Competencies load
- Click "Continue"

**🔍 API Calls to Verify** (5 total):
1. GET `/api/competencies/industry` - Loads industry metadata
2. GET `/api/competencies` - Loads all competencies
3. GET `/api/industry-settings?industry=insurance&subcategory=life-health` - Loads focus areas
4. GET `/api/industry-settings?industry=insurance` - Loads subcategories
5. GET `/api/competencies/industry` - Loads subcategory metadata

**📝 Code Location**: `app/simulation/industry-selection/client.tsx` lines 117, 123, 137, 252, 256

#### 3.2 Simulation Setup
**Expected**: Auto-redirected from industry selection

**Actions**:
- Review client profile (AI-generated)
- Review competencies
- Click "Start Simulation"

**🔍 API Calls to Verify** (2 total):
1. GET `/api/competencies/industry` - Loads metadata
2. GET `/api/industry-settings?industry=X&subcategory=Y` - Loads AI role settings

**📝 Code Location**: `app/simulation/setup/page.tsx` lines 92, 727

#### 3.3 Simulation Session
**Expected**: Auto-redirected from setup

**Actions**:
- Wait for initial greeting from AI client
- Type a message: "Hello, how can I help you today?"
- Press Send
- **Expected**: AI responds based on client profile
- Continue conversation (2-3 exchanges)
- Add notes in Notes panel
- Complete simulation

**🔍 API Calls to Verify** (2 total):
1. GET `/api/competencies/industry` - Loads metadata
2. GET `/api/industry-settings?industry=X&subcategory=Y` - Loads role settings

**📝 Code Location**: `app/simulation/session/page.tsx` lines 214, 1161

#### 3.4 Performance Review
**Expected**: Auto-redirected after completing session

**Actions**:
- Wait for review generation (AI-powered)
- Review scores and feedback
- Submit NPS feedback (rate 0-10)
- Add optional comments
- Submit

**🔍 API Calls to Verify** (2 total):
1. GET `/api/competencies/industry` - Loads metadata
2. POST `/api/simulation/generate-review` - Generates performance review

**📝 Code Location**: `app/simulation/review/page.tsx` lines 83, 233

---

### Test 4: User Management (Admin) ⭐ HIGH PRIORITY
**File**: `app/admin/user-management/page.tsx`
**API Methods**: `usersApi.getAll()`, `create()`, `update()`, `delete()`

1. Navigate to: http://localhost:3000/admin/user-management

**Test 4.1: View All Users**
- **Expected**: Table with all users
- **API Call**: GET `/api/users`

**Test 4.2: Create User**
- Click "Add User"
- Fill form:
  - First Name: Jane
  - Last Name: Doe
  - Email: jane@example.com
  - Password: Test123!
  - Role: user
  - Job Role: Manager
- Submit
- **Expected**: New user in table
- **API Call**: POST `/api/users`

**Test 4.3: Update User**
- Click edit icon on Jane Doe
- Change role to "admin"
- Submit
- **Expected**: Role updated in table
- **API Call**: PUT `/api/users/:id`

**Test 4.4: Delete User**
- Click delete icon on Jane Doe
- Confirm deletion
- **Expected**: User removed from table
- **API Call**: DELETE `/api/users/:id`

**📝 Code Location**: `app/admin/user-management/page.tsx` lines 100, 117, 139, 158

---

### Test 5: Parameter Management ⭐ HIGH PRIORITY
**Files**: parameter-table, category-manager, reset-parameter-catalog
**API Methods**: `parametersApi.create()`, `update()`, `delete()`, `resetToDefaults()`

1. Navigate to: http://localhost:3000/parameter-catalog

**Test 5.1: View Parameters**
- **Expected**: Categories in sidebar, parameters in table
- **API Call**: Via SWR hook in `use-parameters.ts`

**Test 5.2: Create Parameter**
- Select a category
- Click "Add Parameter"
- Fill form:
  - Name: Test Parameter
  - Description: Test description
  - Range: 0-100
  - Examples: Example 1, Example 2
- Submit
- **Expected**: New parameter appears
- **API Call**: POST `/api/parameters`

**Test 5.3: Update Parameter**
- Click edit on test parameter
- Change description
- Submit
- **Expected**: Description updated
- **API Call**: PATCH `/api/parameters/:id`

**Test 5.4: Delete Parameter**
- Click delete on test parameter
- Confirm
- **Expected**: Parameter removed
- **API Call**: DELETE `/api/parameters/:id`

**Test 5.5: Reset to Defaults**
- Click "Reset to Defaults"
- Confirm
- **Expected**: All parameters reset
- **API Call**: POST `/api/parameter-catalog/reset`

**📝 Code Locations**:
- Create: `parameter-table.tsx` line 70
- Update: `parameter-table.tsx` line 95
- Delete: `parameter-table.tsx` line 113
- Reset: `reset-parameter-catalog.tsx` line 23

---

## 🔍 How to Verify API Client is Working

### Check 1: Network Tab
Open DevTools → Network tab → Filter: Fetch/XHR

**What to Look For**:
- ✅ Requests go to `/api/*` (proxied to backend)
- ✅ Authorization header present (after login)
- ✅ Response format: `{ success: true, data: {...} }`
- ✅ Status codes: 200 (success), 400 (validation), 401 (unauthorized)

### Check 2: Console
Open DevTools → Console

**Expected**:
- ✅ No red errors during normal operation
- ✅ API errors displayed as toast notifications
- ✅ Loading states work correctly

### Check 3: localStorage
Open DevTools → Application → Storage → localStorage

**Expected Keys**:
- `token` - JWT authentication token (after login)
- `user` - User data object (after login)
- `currentSimulationId` - Active simulation ID
- `clientProfile` - Generated client profile (during simulation)

### Check 4: Error Handling
Test error scenarios:

**Scenario 1: Invalid Login**
- Enter wrong password
- **Expected**: Error toast with message from API
- **Code**: `login-form.tsx` line 40-42

**Scenario 2: Network Error**
- Stop backend server
- Try any API call
- **Expected**: Error toast with "Network error" or similar
- **Code**: API client catches all errors

**Scenario 3: Validation Error**
- Submit form with missing fields
- **Expected**: Field-specific validation errors
- **Code**: Each form component

---

## 📊 API Client Features to Verify

### ✅ Feature 1: Automatic Token Management
**Test**: Login → Check headers on next API call
- **Expected**: `Authorization: Bearer <token>` header auto-added
- **Code**: `lib/api-client.ts` line 25-31

### ✅ Feature 2: Error Instanceof Checks
**Test**: Trigger any error → Check toast message
- **Expected**: Error message extracted correctly
- **Code**: All components use `error instanceof Error ? error.message`

### ✅ Feature 3: FormData Handling
**Test**: Bulk import CSV file
- **Expected**: File uploaded correctly via FormData
- **Code**: `bulk-import-dialog.tsx` line 45, `api-client.ts` upload method

### ✅ Feature 4: TypeScript Typing
**Test**: IntelliSense in IDE
- **Expected**: `ApiResponse<T>` provides autocomplete
- **Code**: All API methods return typed responses

### ✅ Feature 5: SWR Integration
**Test**: Update parameter → Check list refresh
- **Expected**: List auto-updates via mutate()
- **Code**: `use-parameters.ts` hook + parameter-table mutations

---

## 🐛 Common Issues & Solutions

### Issue 1: 404 Not Found on /api/*
**Cause**: Backend not running or wrong URL
**Fix**:
1. Check backend is running on port 3001
2. Verify NEXT_PUBLIC_API_URL in .env.local
3. Restart frontend dev server

### Issue 2: CORS Errors
**Cause**: Backend CORS not configured
**Fix**: Check backend allows requests from localhost:3000

### Issue 3: 401 Unauthorized
**Cause**: Invalid or missing token
**Fix**:
1. Clear localStorage
2. Login again
3. Check token is being sent in headers

### Issue 4: Type Errors in IDE
**Cause**: TypeScript cache or wrong imports
**Fix**:
1. Restart TypeScript server (VS Code: Cmd+Shift+P → Restart TS Server)
2. Run: `npx tsc --noEmit` to see all errors
3. Check imports use `@/lib/api` not relative paths

### Issue 5: Module Not Found
**Cause**: Path aliases not resolved
**Fix**:
1. Check tsconfig.json paths configuration
2. Restart dev server
3. Clear .next cache: `rm -rf .next`

---

## 📈 Success Metrics

After testing, you should have:

### ✅ 100% API Client Adoption
- All 21 migrated files use API client
- Zero direct `fetch()` calls in migrated components
- Consistent error handling patterns

### ✅ Zero Breaking Changes
- All features work as before
- No regressions in functionality
- Improved code quality and maintainability

### ✅ Better Developer Experience
- IntelliSense for API calls
- Typed responses
- Centralized error handling
- Automatic token management

---

## 📝 Testing Checklist

Use this quick checklist to track your progress:

**Authentication**:
- [ ] User registration works
- [ ] User login works
- [ ] Password change works
- [ ] Token stored in localStorage
- [ ] Token auto-included in API calls

**Simulation Flow**:
- [ ] Industry selection loads data
- [ ] Setup page generates profile
- [ ] Session runs AI conversation
- [ ] Review generates feedback
- [ ] All API calls succeed

**User Management**:
- [ ] View all users
- [ ] Create user
- [ ] Update user
- [ ] Delete user
- [ ] Bulk import (CSV/JSON)

**Parameter Management**:
- [ ] View parameters (SWR hook)
- [ ] Create parameter
- [ ] Update parameter
- [ ] Delete parameter
- [ ] Reset to defaults

**Error Handling**:
- [ ] Invalid login shows error
- [ ] Network errors handled
- [ ] Validation errors shown
- [ ] Toast notifications work

---

## 🎯 Next Steps After Testing

Once testing is complete:

1. **Document Issues**: Create a list of any bugs found
2. **Phase 8: Cleanup**: Remove old code from root directory
3. **Documentation**: Update README with new architecture
4. **Production**: Prepare for deployment

---

## 📞 Need Help?

Refer to:
- **Detailed Checklist**: `TESTING_CHECKLIST.md`
- **Migration Status**: `/MIGRATION_STATUS.md` (in root)
- **API Client Code**: `lib/api-client.ts` and `lib/api/*.ts`

---

**Happy Testing! 🚀**
