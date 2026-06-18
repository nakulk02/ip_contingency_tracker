# IP Contingency Tool — Stage-Wise Implementation Plan

## Context
Building a single-tenant internal tool for in-house counsel to surface IP ownership gaps and deadline risk. This plan breaks the 5 phases from `docs/Plan_v1.md` into 10 granular stages, each producing a running app. Greenfield project — no code exists yet.

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 14+ App Router |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | NextAuth.js (Credentials provider) |
| Styling | Tailwind CSS + shadcn/ui |
| Validation | Zod |
| Email | Resend (or Nodemailer) |
| File Storage | S3-compatible (Stage 9) |
| PDF | @react-pdf/renderer (Stage 10) |

## Project Structure
```
ip_contingency/
  docs/                         # All documentation
  prisma/
    schema.prisma
    migrations/
    seed.ts
  src/
    app/
      api/                      # API routes
      (auth)/                   # Login/Register pages
      (dashboard)/              # All authenticated pages
    lib/                        # Shared logic (prisma client, auth, queries)
    components/
      ui/                       # shadcn/ui
```

---

## STAGE 1 — Skeleton App *(Plan_v1.md Phase 0)*

**Goal:** Deployed, login-protected app with Notes CRUD proving the full stack.

### 1a: Scaffold + DB Connection
- `npx create-next-app@latest` with TypeScript, Tailwind, App Router, src dir
- `git init`, install Prisma, configure PostgreSQL datasource
- **Files:** `prisma/schema.prisma`, `src/lib/prisma.ts` (singleton client), `.env.local`, `.env.example`
- **Verify:** `npx prisma db push` succeeds, `npm run dev` loads default page

### 1b: Auth (NextAuth.js + Users table)
- **Schema:** `User { id, email, hashedPassword, name, createdAt, updatedAt }`
- Install `next-auth`, `bcryptjs`
- **Files:** `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/auth/register/route.ts`
- **UI:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
- **Middleware:** `src/middleware.ts` — protect all routes except auth pages
- **Verify:** Register, login, redirect to `/`. Unauthenticated → `/login`.

### 1c: shadcn/ui + Dashboard Layout
- `npx shadcn-ui@latest init` + add button, card, input, label, form, table, dialog, toast
- **Files:** `src/app/(dashboard)/layout.tsx` (nav shell with sign-out), `src/app/(dashboard)/dashboard/page.tsx` (placeholder)
- **Verify:** After login, dashboard layout renders with nav and user name.

### 1d: Notes CRUD (Full-Stack Proof)
- **Schema:** `Note { id, title, body, createdAt, updatedAt, userId → User }`
- **API:** `src/app/api/notes/route.ts` (GET, POST), `src/app/api/notes/[id]/route.ts` (GET, PUT, DELETE)
- **UI:** `src/app/(dashboard)/notes/page.tsx` (list), `notes/new/page.tsx` (create), `notes/[id]/page.tsx` (edit)
- **Verify:** Create, edit, delete note. Data persists across refresh and re-login.

### 1e: Deploy + README
- Deploy to Render/Railway/Fly with env vars and migration
- `README.md` with local dev setup steps
- **Verify:** Production URL: register, login, CRUD notes end-to-end.

---

## STAGE 2 — IP Assets + People CRUD *(Phase 1, Part 1)*

**Goal:** First domain tables with full CRUD.

### Schema
```prisma
enum AssetType    { PATENT, TRADEMARK }
enum AssetStatus  { DRAFT, FILED, PUBLISHED, REGISTERED, EXPIRED, ABANDONED }
enum PersonRole   { FOUNDER, EMPLOYEE, CONTRACTOR, ADVISOR }

model IpAsset { id, type, title, jurisdiction, filingDate?, status, registrationNumber?, description? }
model Person  { id, name, email?, role, startDate, endDate? }
```

### API Routes
- `src/app/api/ip-assets/` and `src/app/api/people/` — standard CRUD

### UI Pages
- `(dashboard)/ip-assets/` — list (filterable by type/status), new, [id] detail/edit
- `(dashboard)/people/` — list (filterable by role), new, [id] detail/edit
- Nav: add "IP Assets" and "People" links

### Verify
Create 2-3 patents, 2-3 trademarks, 5+ people. All CRUD operations work.

---

## STAGE 3 — Assignments + Ownership Gap Dashboard *(Phase 1, Part 2)*

**Goal:** The core product differentiator — counsel sees ownership gaps at a glance.

### Schema
```prisma
enum AgreementStatus { SIGNED, MISSING, PENDING }
enum AgreementScope  { COMPANY_WIDE, ASSET_SPECIFIC }

model AssignmentAgreement { id, personId→Person, ipAssetId?→IpAsset, scope, signedDate?, fileReference?, status, notes? }
```

### Key Logic: `src/lib/queries/ownership-gaps.ts`
- **Assets with gaps:** IpAssets with zero signed assignments
- **People with gaps:** People with zero signed assignments (current = high priority, departed = medium)

### API
- `src/app/api/assignments/` — CRUD
- `src/app/api/dashboard/ownership-gaps/` — GET returns both gap lists

### UI
- `(dashboard)/assignments/` — list, new (dropdowns for person + optional asset), [id] edit
- `(dashboard)/dashboard/page.tsx` — **REPLACE placeholder** with Ownership Gap Dashboard:
  - Summary cards (X assets at risk, Y people without agreements)
  - Assets gap table, People gap table
  - Color badges: red=MISSING, yellow=PENDING, green=SIGNED

### Seed Script: `prisma/seed.ts`
2 patents, 3 trademarks, 6 people (mixed roles), 5 assignments (mixed statuses).

### Verify
1. Seed DB → dashboard shows correct gaps
2. Add person without assignment → appears in gap list
3. Sign assignment for them → disappears from gap list

---

## STAGE 4 — Deadline Schema + Rules Engine *(Phase 2, Part 1)*

**Goal:** Configurable deadline rules reference, manual deadline CRUD.

### Schema
```prisma
enum DeadlineStatus { UPCOMING, DONE, MISSED }

model Deadline     { id, ipAssetId→IpAsset, deadlineType, dueDate, status, notes?, autoGenerated, ruleId?→DeadlineRule }
model DeadlineRule { id, name, assetType, jurisdiction?, deadlineType, offsetMonths, description?, isActive }
```

### Seed Rules
Patent US: Provisional→Non-Provisional (12mo), Maintenance 3.5yr/7.5yr/11.5yr
Trademark US: Statement of Use (6mo), Section 8 (72mo), Renewal (120mo)

### UI
- `(dashboard)/deadlines/` — list, new, [id] edit (mark as done)
- `(dashboard)/settings/deadline-rules/` — rules management

### Verify
Rules are seeded and editable. Manual deadlines can be created/edited/completed.

---

## STAGE 5 — Deadline Auto-Generation + Urgency View *(Phase 2, Part 2)*

**Goal:** Filing date → auto-populated deadlines. Urgency-sorted view.

### Key Logic: `src/lib/deadlines/generate.ts`
- `generateDeadlinesForAsset(assetId)`: match rules by asset type/jurisdiction, calculate dueDate = filingDate + offsetMonths, create idempotently
- Hooked into IP Asset create (POST) and update (PUT, if filingDate changed)
- Manual deadlines never touched by regeneration

### Urgency View Enhancement
- `(dashboard)/deadlines/page.tsx` — tabbed: Overdue / 30d / 60d / 90d / All
- `src/components/deadlines/urgency-badge.tsx` — color-coded by time remaining
- Dashboard: add "Deadline Summary" card (X overdue, Y due in 30d)

### Verify
1. Create patent filed 11 months ago → non-provisional deadline appears due in ~1 month
2. Change filing date → auto-deadlines update, manual ones untouched
3. Urgency tabs show correct categorization

---

## STAGE 6 — Email Notifications *(Phase 2, Part 3)*

**Goal:** Daily email digest of upcoming/overdue deadlines.

### Implementation
- `src/lib/email/send.ts` — email abstraction (Resend or Nodemailer)
- `src/lib/email/templates/deadline-digest.tsx` — React email template
- `src/app/api/cron/deadline-digest/route.ts` — GET, protected by `CRON_SECRET`, queries deadlines due in 7 days + overdue, sends digest
- Platform cron: daily at 8 AM

### Env Vars
`RESEND_API_KEY`, `CRON_SECRET`, `DIGEST_RECIPIENTS`

### Verify
Hit cron endpoint manually → email arrives with correct deadlines. No email if nothing due.

---

## STAGE 7 — Coverage Gap Tracking *(Phase 3)*

**Goal:** Jurisdictional blind spots made visible. *Can run in parallel with Stages 4-6.*

### Schema Changes
```prisma
model Jurisdiction          { id, code (unique), name, isActive }
model IntendedJurisdiction  { id, ipAssetId→IpAsset, jurisdictionId→Jurisdiction, notes? @@unique([ipAssetId, jurisdictionId]) }
```
- **Breaking migration:** Convert `IpAsset.jurisdiction` (free text) → `jurisdictionId` (FK to Jurisdiction)
- Seed: US, EU, GB, IN, CN, JP, KR, AU, CA, BR, DE, FR

### API
- `src/app/api/jurisdictions/` — GET, POST
- `src/app/api/ip-assets/[id]/intended-jurisdictions/` — GET, POST, DELETE
- `src/app/api/dashboard/coverage-gaps/` — GET: per asset, filed-in vs intended-but-not-filed

### UI
- `(dashboard)/coverage/page.tsx` — Coverage View: table with green (filed) / red (intended-not-filed) badges
- Asset detail page: "Coverage" section with jurisdiction multi-select
- `(dashboard)/settings/jurisdictions/` — manage jurisdiction list
- Dashboard: add "Coverage Gaps" card

### Verify
1. Mark patent as "intend to file in EU, JP" → coverage view shows red for EU, JP
2. Update status → turns green
3. Existing assets retain migrated jurisdiction data

---

## STAGE 8 — Audit Trail *(Phase 4, Part 1)*

**Goal:** Who changed what, when — across all core tables.

### Schema
```prisma
model AuditLog { id, tableName, recordId, action (CREATE/UPDATE/DELETE), userId→User, changes (Json?), createdAt }
```

### Implementation
- `src/lib/audit.ts` — `logAudit(tableName, recordId, action, userId, changes?)`
- For UPDATEs: diff old vs new, store `{ field: { old, new } }`
- Integrate into all POST/PUT/DELETE handlers for: IpAsset, Person, AssignmentAgreement, Deadline, DeadlineRule

### UI
- `(dashboard)/audit-log/page.tsx` — global log viewer with filters (table, record, user, date)
- Each detail page: "Activity" section showing audit entries for that record
- `src/components/audit/change-diff.tsx` — readable diff display

### Verify
Edit a patent title → audit log shows old/new values, who, when.

---

## STAGE 9 — Document Upload + Storage *(Phase 4, Part 2)*

**Goal:** Attach signed agreements and certificates via S3.

### Schema
```prisma
model Document { id, filename, s3Key, mimeType, sizeBytes, uploadedById→User, ipAssetId?→IpAsset, assignmentAgreementId?→AssignmentAgreement, createdAt }
```

### Implementation
- `src/lib/s3.ts` — S3 client, presigned upload/download URL generation
- `src/app/api/documents/upload-url/route.ts` — POST: generate presigned PUT, create Document row
- `src/app/api/documents/[id]/route.ts` — GET (presigned download), DELETE
- **Env vars:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`

### UI
- `src/components/documents/upload-button.tsx` — file picker + S3 upload with progress
- `src/components/documents/document-list.tsx` — list with download/delete
- Integrated into asset detail and assignment detail pages

### Verify
Upload PDF to patent → appears in list → download works → delete removes from S3 and DB.

---

## STAGE 10 — Draft Form Generation *(Phase 4, Part 3)*

**Goal:** Pre-filled PDF drafts from existing DB data for standard filing types.

### Implementation
- `src/lib/forms/templates/us-patent-provisional.tsx` — React PDF template (US provisional patent cover sheet)
- `src/lib/forms/generate.ts` — `generateDraftForm(templateId, assetId)`: load data, render PDF
- `src/app/api/ip-assets/[id]/generate-form/route.ts` — POST with `{ templateId }`, returns PDF

### UI
- Asset detail page: "Generate Draft" button with template dropdown
- `docs/adding-form-templates.md` — how to add new templates

### Verify
Navigate to patent with complete data → Generate Draft → PDF downloads with pre-filled fields.

---

## Stage Dependency Graph
```
Stage 1  (Skeleton)
  │
Stage 2  (Assets + People)
  │
Stage 3  (Assignments + Gap Dashboard)
  ├──→ Stage 4 → Stage 5 → Stage 6  (Deadlines branch)
  └──→ Stage 7  (Coverage — parallel with 4-6)
         │
Stage 8  (Audit Trail — after all domain tables exist)
  │
Stage 9  (Documents)
  │
Stage 10 (Draft Forms)
```

## Navigation (Final State)
```
Dashboard              /dashboard
IP Assets              /ip-assets
People                 /people
Assignments            /assignments
Deadlines              /deadlines
Coverage               /coverage
Audit Log              /audit-log
Settings
  Deadline Rules       /settings/deadline-rules
  Jurisdictions        /settings/jurisdictions
```

## Critical Files
- `prisma/schema.prisma` — single source of truth for all data models
- `src/lib/auth.ts` — NextAuth config, foundational for route protection
- `src/lib/queries/ownership-gaps.ts` — core gap-detection logic (the product differentiator)
- `src/lib/deadlines/generate.ts` — deadline auto-generation engine
- `src/app/(dashboard)/dashboard/page.tsx` — main dashboard, evolves every few stages

## Verification Approach
Each stage has manual verification steps listed above. For critical flows (gap dashboard, deadline generation), consider Playwright smoke tests from Stage 3 onward.
