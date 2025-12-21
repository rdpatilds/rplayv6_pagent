# Phase 7: Testing Checklist

## Overview
This document provides a systematic testing checklist for the refactored frontend module. All API calls have been migrated to use the centralized API client.

---

## Prerequisites

### 1. Environment Setup
- [ ] Backend server is running on `localhost:3001` (or configured `NEXT_PUBLIC_API_URL`)
- [ ] Frontend dev server is running: `npm run dev` from `/simulator/frontend`
- [ ] Database is seeded with test data
- [ ] `.env.local` file is configured with correct API URL

### 2. Initial Verification
- [ ] No console errors on page load
- [ ] No TypeScript compilation errors: `npx tsc --noEmit`
- [ ] All imports resolve correctly
- [ ] API client is accessible at `http://localhost:3000` (or configured port)

---

## Test Categories

## A. Authentication Flow (Priority: CRITICAL)

### A1. User Registration
**File**: `components/signup-form.tsx`
**API**: `authApi.register()`

- [ ] Navigate to `/signup`
- [ ] Fill in all required fields (name, email, password, job role, company)
- [ ] Submit form
- [ ] **Expected**: User created successfully, redirected to dashboard
- [ ] **Expected**: Token stored in localStorage
- [ ] **Expected**: Success toast displayed
- [ ] Test with invalid email format
- [ ] **Expected**: Validation error shown
- [ ] Test with duplicate email
- [ ] **Expected**: API error shown in toast

### A2. User Login
**File**: `components/login-form.tsx`
**API**: `authApi.login()`

- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Submit form
- [ ] **Expected**: Successfully logged in, redirected to dashboard
- [ ] **Expected**: Token stored in localStorage
- [ ] Test with invalid credentials
- [ ] **Expected**: Error message displayed
- [ ] Test with missing fields
- [ ] **Expected**: Validation errors shown

### A3. Password Change
**File**: `app/account/change-password/page.tsx`
**API**: `authApi.changePassword()`

- [ ] Login as test user
- [ ] Navigate to `/account/change-password`
- [ ] Enter current password
- [ ] Enter new password (twice)
- [ ] Submit form
- [ ] **Expected**: Password updated successfully
- [ ] **Expected**: Success toast displayed
- [ ] Test with incorrect current password
- [ ] **Expected**: Error message shown
- [ ] Test with mismatched new passwords
- [ ] **Expected**: Validation error shown

---

## B. User Management (Priority: HIGH)

### B1. Profile Editing
**File**: `app/account/edit/page.tsx`
**API**: `usersApi.update()`

- [ ] Navigate to `/account/edit`
- [ ] Update name field
- [ ] Update email field
- [ ] Update job role field
- [ ] Submit form
- [ ] **Expected**: Profile updated successfully
- [ ] **Expected**: localStorage updated with new user data
- [ ] **Expected**: Success toast displayed
- [ ] Refresh page
- [ ] **Expected**: Updated data persists

### B2. User Management (Admin)
**File**: `app/admin/user-management/page.tsx`
**API**: `usersApi.getAll()`, `create()`, `update()`, `delete()`

#### Get All Users
- [ ] Navigate to `/admin/user-management`
- [ ] **Expected**: Table displays all users
- [ ] **Expected**: User roles visible
- [ ] **Expected**: No console errors

#### Create User
- [ ] Click "Add User" button
- [ ] Fill in form (name, email, password, role, job role)
- [ ] Submit
- [ ] **Expected**: New user appears in table
- [ ] **Expected**: Success toast displayed
- [ ] Test with duplicate email
- [ ] **Expected**: Error message shown

#### Update User
- [ ] Click edit icon on any user
- [ ] Modify user details
- [ ] Submit
- [ ] **Expected**: User updated in table
- [ ] **Expected**: Success toast displayed

#### Delete User
- [ ] Click delete icon on test user
- [ ] Confirm deletion
- [ ] **Expected**: User removed from table
- [ ] **Expected**: Success toast displayed

### B3. Bulk User Import
**File**: `components/bulk-import-dialog.tsx`
**API**: `usersApi.bulkImport()`

#### CSV Import
- [ ] Navigate to user management
- [ ] Click "Bulk Import" button
- [ ] Select CSV file
- [ ] Choose import method (append/replace)
- [ ] Submit
- [ ] **Expected**: Users imported successfully
- [ ] **Expected**: Success toast with count

#### JSON Import
- [ ] Switch to JSON tab
- [ ] Paste valid JSON user data
- [ ] Submit
- [ ] **Expected**: Users imported successfully
- [ ] Test with invalid JSON
- [ ] **Expected**: Parse error shown

---

## C. Simulation Flow (Priority: CRITICAL)

### C1. Industry Selection
**File**: `app/simulation/industry-selection/client.tsx`
**API**: `apiClient.get()` (5 calls)

- [ ] Navigate to `/simulation/industry-selection`
- [ ] **Expected**: Industry dropdown populated
- [ ] Select an industry (e.g., "Insurance")
- [ ] **Expected**: Subcategories loaded dynamically
- [ ] Select a subcategory
- [ ] **Expected**: Focus areas loaded (if insurance)
- [ ] **Expected**: Competencies loaded for selected industry
- [ ] Select difficulty level
- [ ] Select focus areas
- [ ] Click "Continue"
- [ ] **Expected**: Simulation ID generated
- [ ] **Expected**: Redirected to setup page
- [ ] **Expected**: No console errors

### C2. Simulation Setup
**File**: `app/simulation/setup/page.tsx`
**API**: `apiClient.get()` (2 calls)

- [ ] Arrive from industry selection page
- [ ] **Expected**: Industry metadata loaded
- [ ] **Expected**: Industry settings loaded (aiRoleLabel, aiRoleDescription)
- [ ] **Expected**: Client profile generated
- [ ] **Expected**: Selected competencies displayed
- [ ] **Expected**: Profile details visible (name, age, income, goals, etc.)
- [ ] Review simulation parameters
- [ ] Click "Start Simulation"
- [ ] **Expected**: Redirected to session page
- [ ] **Expected**: Session data stored in sessionStorage

### C3. Simulation Session
**File**: `app/simulation/session/page.tsx`
**API**: `apiClient.get()` (2 calls)

- [ ] Arrive from setup page
- [ ] **Expected**: Industry metadata loaded
- [ ] **Expected**: Industry settings loaded
- [ ] **Expected**: Client profile displayed
- [ ] **Expected**: Initial greeting message visible
- [ ] Send a message to client
- [ ] **Expected**: Message appears in chat
- [ ] **Expected**: Client responds (using AI)
- [ ] **Expected**: Objectives update based on conversation
- [ ] Test expert mode toggle
- [ ] **Expected**: Expert advice shown when enabled
- [ ] Add notes in notes panel
- [ ] **Expected**: Notes saved in state
- [ ] Check elapsed time counter
- [ ] **Expected**: Timer running
- [ ] Complete simulation
- [ ] **Expected**: Redirected to review page

### C4. Performance Review
**File**: `app/simulation/review/page.tsx`
**API**: `apiClient.get()`, `apiClient.post()`

- [ ] Arrive from completed session
- [ ] **Expected**: Industry metadata loaded
- [ ] **Expected**: Review generation triggered
- [ ] **Expected**: Loading indicator shown
- [ ] **Expected**: Review data displayed (overall score, competency scores)
- [ ] **Expected**: Strengths and areas for improvement listed
- [ ] **Expected**: Key takeaways visible
- [ ] **Expected**: NPS feedback form displayed
- [ ] Submit NPS feedback (score 0-10)
- [ ] **Expected**: Feedback saved successfully
- [ ] Click "Try Again" or "Back to Dashboard"
- [ ] **Expected**: Navigation works correctly

---

## D. Parameter Management (Priority: MEDIUM)

### D1. Parameter Categories
**File**: `components/parameter-catalog/category-manager.tsx`
**API**: `apiClient.post()`, `patch()`, `delete()`

- [ ] Navigate to parameter catalog page
- [ ] **Expected**: Categories loaded in sidebar

#### Create Category
- [ ] Click "Add Category" button
- [ ] Enter name and key
- [ ] Select parameter type
- [ ] Submit
- [ ] **Expected**: New category appears in list
- [ ] **Expected**: Success toast displayed

#### Update Category
- [ ] Click edit on any category
- [ ] Modify name or key
- [ ] Submit
- [ ] **Expected**: Category updated
- [ ] **Expected**: Success toast displayed

#### Delete Category
- [ ] Click delete on test category
- [ ] Confirm deletion
- [ ] **Expected**: Category removed
- [ ] **Expected**: Another category auto-selected if current was deleted

### D2. Parameters CRUD
**File**: `components/parameter-catalog/parameter-table.tsx`
**API**: `parametersApi.create()`, `update()`, `delete()`

#### Create Parameter
- [ ] Select a category
- [ ] Click "Add Parameter"
- [ ] Fill in all fields (name, description, range, examples)
- [ ] Submit
- [ ] **Expected**: Parameter added to table
- [ ] **Expected**: Success toast with parameter name

#### Update Parameter
- [ ] Click edit on any parameter
- [ ] Modify fields
- [ ] Submit
- [ ] **Expected**: Parameter updated
- [ ] **Expected**: List refreshed via mutate()

#### Delete Parameter
- [ ] Click delete on test parameter
- [ ] Confirm
- [ ] **Expected**: Parameter removed
- [ ] **Expected**: List refreshed

### D3. Reset Parameters
**File**: `components/parameter-catalog/reset-parameter-catalog.tsx`
**API**: `parametersApi.resetToDefaults()`

- [ ] Click "Reset to Defaults" button
- [ ] **Expected**: Confirmation dialog shown
- [ ] Confirm reset
- [ ] **Expected**: Parameters reset to defaults
- [ ] **Expected**: Success toast displayed
- [ ] **Expected**: Parameter list refreshed (onSuccess callback)

### D4. Parameter Hooks (SWR Integration)
**File**: `hooks/use-parameters.ts`, `hooks/use-parameter-categories.ts`
**API**: `parametersApi.getAll()`, `apiClient.get()`

#### use-parameters Hook
- [ ] Filter by category
- [ ] **Expected**: Filtered parameters displayed
- [ ] Filter by type (structured/narrative/guardrails)
- [ ] **Expected**: Type-specific parameters shown
- [ ] **Expected**: SWR caching works (check cache key pattern: `parameters|categoryId|type`)
- [ ] Mutate parameters from another component
- [ ] **Expected**: Hook automatically refreshes

#### use-parameter-categories Hook
- [ ] Load categories
- [ ] **Expected**: Categories returned as array
- [ ] **Expected**: SWR caching active

---

## E. Competency Management (Priority: MEDIUM)

### E1. Competencies Page
**File**: `app/admin/competencies/page.tsx`
**API**: `apiClient.post()` (rubric entries)

- [ ] Navigate to `/admin/competencies`
- [ ] **Expected**: Competencies list loaded (via server actions)
- [ ] **Expected**: Rubrics visible per competency

#### Add Rubric Entry
- [ ] Select a competency
- [ ] Enter score range (e.g., "8-10")
- [ ] Enter criteria description
- [ ] Click "Add Rubric Entry"
- [ ] **Expected**: New rubric added to competency
- [ ] **Expected**: Success toast displayed
- [ ] **Expected**: Input fields cleared
- [ ] Test with missing fields
- [ ] **Expected**: Validation prevents submission

---

## F. Feedback System (Priority: MEDIUM)

### F1. NPS Feedback Submission
**File**: `components/nps-feedback.tsx`
**API**: `feedbackApi.create()`

- [ ] Navigate to review page after simulation
- [ ] Rate experience (0-10 scale)
- [ ] Add optional comments
- [ ] Submit feedback
- [ ] **Expected**: Feedback saved with rating converted to 0-100 scale (score * 10)
- [ ] **Expected**: feedbackType set to "user_submitted"
- [ ] **Expected**: Success toast displayed
- [ ] Test without rating
- [ ] **Expected**: Validation prevents submission

---

## G. Admin Tools (Priority: LOW)

### G1. Seed Data Generation
**File**: `app/admin/seed-data/page.tsx`
**API**: `apiClient.post()`

- [ ] Navigate to `/admin/seed-data`
- [ ] Click "Generate Mock Data" button
- [ ] **Expected**: API call triggered
- [ ] **Expected**: Loading state shown
- [ ] **Expected**: Success message displayed
- [ ] **Expected**: Mock engagement/feedback data created

### G2. API Settings
**File**: `app/admin/api-settings/page.tsx`
**API**: `apiClient.get()`

- [ ] Navigate to `/admin/api-settings`
- [ ] Click "Trigger Profile Pre-generation" button
- [ ] **Expected**: API call to `/api/profile-pregeneration`
- [ ] **Expected**: Success/failure alert shown
- [ ] Test with network error
- [ ] **Expected**: Error message displayed with typed error handling

### G3. Engagement Session Tracking
**File**: `app/admin/engagement/session/[sessionId]/page.tsx`
**API**: `apiClient.get()`

- [ ] Navigate to `/admin/engagement/session/[sessionId]`
- [ ] **Expected**: Engagement events loaded for session
- [ ] **Expected**: Events sorted by timestamp
- [ ] **Expected**: Event types displayed (message_sent, help_used, etc.)
- [ ] **Expected**: No console errors
- [ ] Test with invalid session ID
- [ ] **Expected**: Error handling works

---

## H. Error Handling & Edge Cases (Priority: HIGH)

### H1. Network Errors
- [ ] Disconnect from network
- [ ] Attempt any API call
- [ ] **Expected**: Error caught and displayed
- [ ] **Expected**: User-friendly error message
- [ ] **Expected**: No unhandled promise rejections

### H2. Invalid Tokens
- [ ] Manually corrupt token in localStorage
- [ ] Attempt authenticated API call
- [ ] **Expected**: 401 error caught
- [ ] **Expected**: User redirected to login
- [ ] **Expected**: Token cleared from storage

### H3. Validation Errors
- [ ] Submit forms with invalid data
- [ ] **Expected**: Field-specific errors shown
- [ ] **Expected**: Form submission blocked
- [ ] **Expected**: Error messages clear and helpful

### H4. API Errors
- [ ] Trigger server error (500)
- [ ] **Expected**: Error message from API displayed
- [ ] **Expected**: Fallback UI shown if needed
- [ ] **Expected**: No application crash

---

## I. Performance & Best Practices (Priority: MEDIUM)

### I1. API Client Features
- [ ] Verify automatic token inclusion in headers
- [ ] Verify FormData handling for file uploads
- [ ] Verify JSON serialization for POST/PUT requests
- [ ] Verify error instanceof Error checks work
- [ ] Verify ApiResponse<T> typing is correct

### I2. SWR Integration
- [ ] Verify cache key patterns work (pipe-delimited)
- [ ] Verify mutate() triggers re-fetch
- [ ] Verify loading states display correctly
- [ ] Verify error states display correctly
- [ ] Verify data deduplication works

### I3. Code Quality
- [ ] No console errors during normal operation
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] All imports resolve correctly
- [ ] No circular dependencies
- [ ] Consistent error handling patterns

---

## J. Browser Compatibility (Priority: LOW)

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

For each browser:
- [ ] Login flow works
- [ ] Simulation flow works
- [ ] API calls succeed
- [ ] No console errors
- [ ] localStorage works

---

## Summary Checklist

### Critical Features (Must Pass)
- [ ] User registration and login
- [ ] Complete simulation flow (industry → setup → session → review)
- [ ] API client properly wraps all endpoints
- [ ] Token authentication works
- [ ] Error handling works across all components

### High Priority Features
- [ ] User management CRUD
- [ ] Profile editing
- [ ] Parameter management
- [ ] Password changes
- [ ] Feedback submission

### Medium Priority Features
- [ ] Competency management
- [ ] Admin tools
- [ ] Bulk import
- [ ] SWR caching

### Low Priority Features
- [ ] Browser compatibility
- [ ] Performance optimizations
- [ ] Edge case handling

---

## Troubleshooting

### Common Issues

1. **"Cannot find module '@/lib/api'"**
   - Check tsconfig.json path aliases
   - Verify `lib/api/index.ts` exists
   - Restart dev server

2. **401 Unauthorized errors**
   - Check token in localStorage
   - Verify backend is running
   - Check NEXT_PUBLIC_API_URL in .env.local

3. **Type errors**
   - Run `npx tsc --noEmit` to see all errors
   - Check shared types are properly imported
   - Verify API response types match

4. **CORS errors**
   - Check next.config.mjs rewrites
   - Verify backend CORS configuration
   - Ensure API URL is correct

---

## Testing Tools

### Manual Testing
- Browser DevTools (Network tab, Console)
- React DevTools
- localStorage inspection

### Automated Testing (Future)
- Jest for unit tests
- React Testing Library for component tests
- Playwright/Cypress for E2E tests

---

## Sign-off

Once all critical and high-priority tests pass:
- [ ] All authentication flows work ✅
- [ ] Complete simulation flow works ✅
- [ ] User management works ✅
- [ ] Parameter management works ✅
- [ ] Error handling is robust ✅
- [ ] No console errors ✅
- [ ] Ready for Phase 8: Cleanup

**Tested by**: _________________
**Date**: _________________
**Approval**: _________________

---

**Note**: This checklist should be used systematically. Mark each item as you test it. Document any issues found in a separate bug tracking document.
