# Manual Testing Guide — Vigil

Step-by-step instructions for testing every feature from a first-time user's perspective.
Follow each checklist in order. Mark items as you go.

---

## Prerequisites

### 1. Start the backend

```bash
cd backend
cp .env.example .env          # if not already done
# Add to .env:
#   DEV_AUTH_BYPASS=true
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vigil
npx prisma migrate dev
npx prisma db seed --preview-feature   # or: npx ts-node prisma/demo.ts
npm run start:dev
```

Backend runs on **http://localhost:3001**. Confirm with: `curl http://localhost:3001/health`

### 2. Start the frontend

```bash
cd frontend
# Add to .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:3001
#   NEXT_PUBLIC_DEV_AUTH_BYPASS=true
npm run dev
```

Frontend runs on **http://localhost:3000**

### 3. Seed accounts (created by demo.ts)

| Tenant | Role | Email | Password |
|--------|------|-------|----------|
| Sunrise Funeral Home | Director | evelyn@sunrisefh.com | (Cognito — use dev bypass) |
| Sunrise Funeral Home | Staff | marcus@sunrisefh.com | (Cognito — use dev bypass) |
| Heritage Memorial Chapel | Director | nadia@heritagememorial.com | (Cognito — use dev bypass) |

With `DEV_AUTH_BYPASS=true` there is no password — the middleware passes all requests through.

---

## Section 1 — Authentication

**Goal:** Confirm the login page renders and the dev bypass lets you into the app.

- [ ] Navigate to `http://localhost:3000/login`
- [ ] **Expected:** Login form with email + password fields and a submit button
- [ ] Navigate to `http://localhost:3000/cases` directly
- [ ] **Expected (dev bypass ON):** Cases list page loads — no redirect to login
- [ ] **Expected (dev bypass OFF):** Redirect to `/login?next=/cases`
- [ ] Open browser DevTools → Network → navigate the app — all API calls go to `localhost:3001`
- [ ] Confirm no 401 errors appear in the network tab

---

## Section 2 — Dashboard

**Goal:** Confirm the home dashboard loads with real seeded data.

- [ ] Navigate to `http://localhost:3000`
- [ ] **Expected:** Dashboard renders within 3 seconds
- [ ] Verify four stat cards appear (Active Cases, Open Tasks, Revenue MTD, Upcoming Services or similar)
- [ ] Verify each stat card shows a number (not "—" or blank)
- [ ] Verify "Recent Cases" table shows seeded cases (James Holloway, Margaret Chen, Robert Abrams, etc.)
- [ ] Click a case in the recent cases table → **Expected:** navigates to case detail page
- [ ] Navigate back with browser back button → **Expected:** dashboard reloads correctly
- [ ] Verify sidebar navigation links are visible (Cases, Tasks, Calendar, Analytics, etc.)

---

## Section 3 — Cases

### 3a. Cases List

- [ ] Navigate to `/cases`
- [ ] **Expected:** Table shows 5 seeded cases for Sunrise Funeral Home
- [ ] Verify status badges are visible (New, In Progress, Completed, etc.)
- [ ] Click the column headers to sort — **Expected:** rows re-order
- [ ] Use any search or filter input — **Expected:** list narrows without crash

### 3b. Create New Case

- [ ] Click "New Case" button on `/cases`
- [ ] **Expected:** Form opens with fields for deceased name, date of birth, date of death, service type
- [ ] Submit form with all fields blank → **Expected:** validation errors appear under each required field
- [ ] Fill in:
  - Deceased name: `Test Deceased`
  - Date of death: today's date
  - Service type: `Cremation`
- [ ] Click Create/Submit
- [ ] **Expected:** Redirects to the new case detail page; case appears at top of cases list
- [ ] **Cleanup:** You can soft-delete the test case (delete icon → confirm) after testing

### 3c. Case Detail

- [ ] Open any seeded case (e.g., James Holloway)
- [ ] **Expected:** Case detail header shows deceased name, status badge, assigned director
- [ ] Verify workspace tabs are visible (Tasks, Documents, Contacts, Payments, Notes, Signatures, etc.)

### 3d. Status Transitions

- [ ] On case detail, find the status control
- [ ] Change status: New → In Progress → **Expected:** badge updates, no page refresh crash
- [ ] Change status: In Progress → Completed → **Expected:** badge updates

### 3e. Soft Delete

- [ ] On the cases list, find the delete action for a case
- [ ] Click delete → confirm the dialog → **Expected:** case disappears from list
- [ ] **Expected:** case is NOT permanently deleted; `deletedAt` is set (90-day recoverable window)

---

## Section 4 — Contacts

- [ ] Open a seeded case → Contacts tab
- [ ] **Expected:** Existing family contacts appear (name, phone, relationship)
- [ ] Click "Add Contact"
- [ ] Fill in: Name: `Test Family`, Phone: `555-0100`, Relationship: `Spouse`
- [ ] Save → **Expected:** contact appears in the list
- [ ] Click the contact's edit icon → change phone number → save → **Expected:** updated
- [ ] Delete the test contact → **Expected:** removed from list

---

## Section 5 — Tasks

### 5a. Case Tasks

- [ ] Open a seeded case → Tasks tab
- [ ] **Expected:** Task checklist renders with seeded tasks (transfer arrangements, death cert, etc.)
- [ ] Click a task checkbox → **Expected:** task marked complete; visual indicator changes
- [ ] Click again to uncheck → **Expected:** task marked incomplete
- [ ] Click "Add Task" → fill title and due date → save → **Expected:** new task appears at bottom

### 5b. Global Tasks View

- [ ] Navigate to `/tasks`
- [ ] **Expected:** All open tasks across all cases listed
- [ ] **Expected:** Overdue tasks highlighted in red or with a warning indicator
- [ ] Filter by "Overdue" → **Expected:** only past-due tasks shown

### 5c. Task Templates

- [ ] Navigate to `/settings/templates`
- [ ] **Expected:** Service type templates listed (Cremation, Traditional Burial, Graveside)
- [ ] Click a template → **Expected:** default task list for that service type is shown
- [ ] Edit a task title → save → **Expected:** template updated

---

## Section 6 — Public Intake Form

- [ ] Navigate to `http://localhost:3000/intake/sunrise` (no auth)
- [ ] **Expected:** Intake form renders with fields for: deceased name, family contact info, service preference, SMS consent
- [ ] Submit form with all fields blank → **Expected:** validation errors shown
- [ ] Fill in all required fields with realistic test data:
  - Deceased first/last name
  - Family contact: name, phone, email
  - Service type preference
  - Check SMS consent if required
- [ ] Submit → **Expected:** success message / confirmation screen
- [ ] Verify in the Cases list (logged in): new case created from the intake submission

---

## Section 7 — Documents

- [ ] Open a seeded case → Documents tab
- [ ] **Expected:** Seeded documents listed (death certificate, invoice, service program)
- [ ] Click a document's download icon → **Expected:** browser downloads or opens the file
- [ ] Click "Upload Document"
- [ ] Select a small PDF file from your computer
- [ ] **Expected:** Upload dialog → file name appears → confirm → document listed
- [ ] Delete the uploaded document → confirm → **Expected:** removed from list
- [ ] Navigate to Photos tab
- [ ] Click "Upload Photo" → select an image → **Expected:** photo thumbnail appears

---

## Section 8 — Payments

### 8a. Record Payment

- [ ] Open a seeded case → Payments tab
- [ ] **Expected:** Current balance, amount paid, and amount due shown
- [ ] Click "Record Payment" (or "Add Payment")
- [ ] Enter: Amount: `500`, Method: `Check`, Note: `Test payment`
- [ ] Save → **Expected:** balance updates; payment listed in history

### 8b. Payment Plans

- [ ] On the Payments tab, look for "Create Payment Plan" or navigate to `/cases/[id]/payment-plans`
- [ ] Create a plan: total $3000, 6 installments, monthly
- [ ] **Expected:** installment schedule shown with due dates
- [ ] Mark first installment as paid → **Expected:** installment status updates

---

## Section 9 — E-Signatures

- [ ] Open a seeded case → Signatures tab
- [ ] **Expected:** Any existing signature requests listed (seeded: authorization + service contract)
- [ ] Click "Request Signature"
- [ ] Fill in: Document type, recipient name and email
- [ ] Click Send → **Expected:** signature request created; status shows "Pending"
- [ ] Copy the signing link from the request row
- [ ] Open the link in a new incognito window (no auth needed)
- [ ] **Expected:** Signing page loads with document summary and signature canvas
- [ ] Draw a signature in the canvas
- [ ] Click "Submit Signature" → **Expected:** success message
- [ ] Back in the cases Signatures tab → **Expected:** status updated to "Signed"

---

## Section 10 — Price List (GPL Compliance)

- [ ] Navigate to `/price-list`
- [ ] **Expected:** 21 seeded price list items shown for Sunrise Funeral Home
- [ ] Verify items are categorized (Professional Services, Facilities, Vehicles, Merchandise, etc.)
- [ ] Click "Add Item"
- [ ] Fill in: Name: `Test Service`, Category: `Professional Services`, Price: `250`
- [ ] Save → **Expected:** new item appears in list
- [ ] Navigate to `/price-list/audit`
- [ ] **Expected:** Audit log showing GPL view events and changes
- [ ] Open `http://localhost:3000/p/sunrise/prices` in incognito (no auth)
- [ ] **Expected:** Public FTC General Price List renders with all active items and prices

---

## Section 11 — Vendors

- [ ] Navigate to `/vendors`
- [ ] **Expected:** 6 seeded vendors listed (florist, clergy, crematory, livery, musician, vault)
- [ ] Click "Add Vendor"
- [ ] Fill in: Name: `Test Florist`, Type: `Florist`, Phone: `555-0200`
- [ ] Save → **Expected:** new vendor appears in list
- [ ] Open a seeded case → Vendors tab
- [ ] Click "Assign Vendor" → select your test florist → save
- [ ] **Expected:** vendor appears in the case's vendor list with status "Assigned"

---

## Section 12 — Calendar

- [ ] Navigate to `/calendar`
- [ ] **Expected:** Calendar view (month/week) showing seeded events (staff huddles, services, arrangement conferences)
- [ ] Click an event → **Expected:** event detail panel or popover opens
- [ ] Click "New Event"
- [ ] Fill in: Title: `Test Service`, Date: next week, Type: `Funeral Service`
- [ ] Assign a staff member → Save
- [ ] **Expected:** event appears on the calendar on the correct date
- [ ] Navigate between months using prev/next arrows → **Expected:** no crash

---

## Section 13 — Follow-ups (Grief)

- [ ] Open a seeded case → Follow-ups tab
- [ ] **Expected:** Seeded follow-ups for Abrams case: 1-week, 1-month, 6-month, 1-year
- [ ] **Expected:** Status shows Scheduled/Pending for each
- [ ] Click "Schedule Follow-ups" on a case that doesn't have them
- [ ] **Expected:** four follow-up records created automatically
- [ ] Mark one follow-up as "Sent" → **Expected:** status updates

---

## Section 14 — Obituary

- [ ] Open a seeded case → Obituary tab
- [ ] **Expected:** Obituary draft section (may have AI-generated content from seed)
- [ ] Click "Generate Obituary" (AI)
- [ ] **Expected:** Loading indicator → draft text populates with deceased info
- [ ] Edit the draft text → Save → **Expected:** changes persisted
- [ ] Click "Submit to Publication"
- [ ] Fill in: Publication name, submission method
- [ ] Submit → **Expected:** submission record created with "Submitted" status

---

## Section 15 — Body Tracking

- [ ] Open a seeded case → Tracking tab
- [ ] **Expected:** Chain-of-custody board shows current location/status
- [ ] **Expected:** QR code displayed for the case
- [ ] Click "Log Scan" or "Update Status"
- [ ] Select a location (e.g., "Preparation Room") → Save
- [ ] **Expected:** scan event logged with timestamp

---

## Section 16 — Memorial Page

- [ ] Open a seeded case → Memorial tab
- [ ] **Expected:** Memorial page editor with fields for tribute text, photo upload, visibility toggle
- [ ] Click "Create Memorial" if one doesn't exist
- [ ] Fill tribute text → set visibility to "Public" → Save
- [ ] Note the memorial URL slug
- [ ] Open `http://localhost:3000/memorial/[slug]` in incognito
- [ ] **Expected:** Public memorial page renders with tribute text
- [ ] Add a guestbook entry (name + message) → submit
- [ ] Back in the memorial editor → **Expected:** guestbook entry appears

---

## Section 17 — Pre-need Arrangements

- [ ] Navigate to `/preneed`
- [ ] **Expected:** Pre-need arrangements list (may be empty if none seeded)
- [ ] Click "New Arrangement"
- [ ] Fill in: client name, date of birth, service preference, payment method
- [ ] Save → **Expected:** arrangement appears in list with "Active" status
- [ ] Open the arrangement → click "Convert to Active Case"
- [ ] **Expected:** New case created with pre-need data pre-filled; arrangement status → "Converted"
- [ ] Public preplanning form: navigate to `http://localhost:3000/preplanning/sunrise`
- [ ] **Expected:** Form renders for self-service pre-need planning (no auth required)

---

## Section 18 — First Call / Removal

- [ ] Open a seeded case → First Call tab
- [ ] **Expected:** Form fields for: removal location, time, special instructions, transport notes
- [ ] Fill in removal address + time → Save → **Expected:** record saved
- [ ] Return to the tab → **Expected:** data persisted

---

## Section 19 — Death Certificate

- [ ] Open a seeded case → Death Certificate tab
- [ ] **Expected:** Fields for: cause of death, attending physician, EDRS status, certified copies ordered
- [ ] Fill in physician name + cause → Save
- [ ] Change EDRS status to "Filed" → **Expected:** status badge updates
- [ ] Add certified copies: quantity 3 → **Expected:** copy count saved

---

## Section 20 — Cremation Authorization

- [ ] Open a seeded case (set service type to Cremation first if needed) → Cremation Auth tab
- [ ] **Expected:** Authorization form with next-of-kin signature field, waiting period countdown
- [ ] Fill in authorization details → Save
- [ ] Click "Mark Waiting Period Cleared" → **Expected:** clearance recorded with timestamp
- [ ] Click "Mark Cremation Performed" → **Expected:** final status set

---

## Section 21 — Arrangement Conference

- [ ] Open a seeded case → Arrangement tab
- [ ] **Expected:** Notes editor for arrangement conference details
- [ ] Type notes about the arrangement: service preferences, music, readings
- [ ] Save → **Expected:** notes persisted
- [ ] Return to the tab → **Expected:** notes still there

---

## Section 22 — Veteran Benefits

- [ ] Open a seeded case where veteran status is set → Veteran Benefits tab
- [ ] Click "Initialize VA Checklist"
- [ ] **Expected:** List of VA benefit items (burial flag, headstone, burial allowance, etc.)
- [ ] Check off items as "Requested" or "Received"
- [ ] **Expected:** status updates per item

---

## Section 23 — Body Preparation

- [ ] Open a seeded case → Body Preparation tab
- [ ] **Expected:** Form for embalming authorization, prep checklist, refrigeration log
- [ ] Fill embalming authorization details → Save
- [ ] Click "Add Service Entry" → select service type (e.g., Embalming) → Save
- [ ] **Expected:** service log entry appears with timestamp

---

## Section 24 — Analytics

- [ ] Navigate to `/analytics`
- [ ] **Expected:** Charts/stats for: case volume by week, revenue by service type, staff workload
- [ ] Toggle time period (e.g., last 4 weeks vs 12 weeks) → **Expected:** charts update
- [ ] Navigate to personal dashboard → **Expected:** your tasks, your cases shown

---

## Section 25 — Settings

### 25a. Tenant Settings

- [ ] Navigate to `/settings/branding`
- [ ] **Expected:** Tenant name, logo upload, primary color
- [ ] Change the tenant display name → Save → **Expected:** updated in sidebar
- [ ] Navigate to `/settings/integrations`
- [ ] **Expected:** QuickBooks connect button, webhook configuration

### 25b. Staff Management

- [ ] Navigate to `/settings/staff`
- [ ] **Expected:** Staff list: Evelyn Park (funeral_director), Marcus Lee (staff)
- [ ] Click "Invite Staff"
- [ ] Enter email: `newstaff@test.com`, role: `staff` → Send
- [ ] **Expected:** Pending invitation appears in the list
- [ ] Click "Deactivate" on Marcus Lee → confirm
- [ ] **Expected:** Marcus shows as "Inactive"; cannot log in
- [ ] Click "Reactivate" → **Expected:** status restored

### 25c. API Keys

- [ ] Navigate to `/settings/api`
- [ ] Click "Generate API Key"
- [ ] **Expected:** Key shown **once** — copy it before closing
- [ ] Close the dialog → **Expected:** key listed by name/prefix only (full key not visible again)
- [ ] Click "Revoke" → confirm → **Expected:** key removed from list

---

## Section 26 — Multi-location

- [ ] Navigate to `/multi-location`
- [ ] **Expected:** Summary view for the tenant's location group
- [ ] If only one tenant is configured → shows single-location data

---

## Section 27 — Super Admin (director/super_admin role only)

- [ ] Navigate to `/super-admin/tenants`
- [ ] **Expected:** Both seeded tenants listed (Sunrise + Heritage Memorial)
- [ ] Click a tenant → **Expected:** tenant detail with plan tier, active status, case list
- [ ] Click "Impersonate" → **Expected:** session switched to that tenant's context

---

## Edge Cases to Verify

| Scenario | Expected Result |
|----------|----------------|
| Tenant A user tries to access Tenant B case URL | 404 or empty response (data isolation) |
| Submit intake form with invalid email format | Validation error inline |
| Upload a non-PDF as a document | Error message or rejection |
| Delete a case with open tasks | Soft delete succeeds; tasks remain attached |
| Mark a cremation as performed before waiting period | Warning shown, clearance required |
| Open `/sign/invalid-token` | Error page (not 500) |
| Open `/family/invalid-token` | Error page (not 500) |
| Open `/memorial/nonexistent-slug` | Not-found page (not 500) |
| Navigate to `/super-admin/tenants` as staff role | 403 or redirect |

---

## Running Automated Tests

```bash
cd frontend

# Watch tests run in Playwright's interactive UI (recommended)
npm run test:e2e:ui

# Watch tests run in a visible Chrome window
npm run test:e2e:headed

# Headless (CI mode)
npm run test:e2e

# Run a single test file
npx playwright test e2e/case-workflow.spec.ts --headed

# Run with verbose output
npx playwright test --headed --reporter=list
```

**Requirements before running automated tests:**
1. Backend running: `cd backend && DEV_AUTH_BYPASS=true npm run start:dev`
2. Database seeded: `cd backend && npx prisma db seed`
3. Frontend will auto-start via Playwright's `webServer` config

---

## Health Check Commands

```bash
# Verify backend is up
curl http://localhost:3001/health

# Verify auth bypass works
curl http://localhost:3001/cases -H "x-dev-user: evelyn@sunrisefh.com"

# Verify frontend is up
curl -I http://localhost:3000
```
