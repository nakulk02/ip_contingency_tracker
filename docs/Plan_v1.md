# IP Contingency Tool — Phased Build Plan

Single-tenant internal tool for in-house counsel. Core job: surface IP ownership gaps and deadline risk. Filing assistance deferred to a later phase. Each phase below is independently runnable and deployable — you should have a working app after every single one, not just at the end.

---

## Phase 0 — Skeleton App

**Goal:** A deployed, login-protected app with one real record in a real database. Nothing domain-specific yet.

**What Claude Code should do:**
- Scaffold a new app (recommend Next.js + Postgres, or your preferred boring stack — state your choice explicitly in the prompt so Claude Code doesn't pick for you)
- Set up Postgres connection + a migration tool (Prisma, Drizzle, or plain SQL migrations — pick one)
- Implement basic email/password auth (single-tenant, so no org/workspace model needed — just a `users` table)
- Build one trivial CRUD resource end-to-end (e.g. a `Notes` table with title/body) to prove the full stack works: DB → API route → form → list view
- Set up a deploy pipeline to Render/Railway/Fly (whichever you have an account on)
- Write a `README.md` with local dev setup steps

**Definition of done:** You can deploy, log in, create a Note, see it persist after refresh. Nothing about IP yet — this phase is plumbing only.

---

## Phase 1 — Ownership Tracking (the real MVP)

**Goal:** Counsel can see, at a glance, which IP assets have a clean ownership chain and which don't.

**What Claude Code should do:**
- Add three tables: `ip_assets` (type: patent/trademark, title, jurisdiction, filing_date, status, registration_number), `people` (name, role: founder/employee/contractor/advisor, start_date, end_date), `assignment_agreements` (links a person to either the company generally or a specific asset; fields: signed_date, scope, file_reference, status: signed/missing/pending)
- Build CRUD UI for all three (simple forms + list views, no need for anything fancy)
- Build the one screen that matters: an **Ownership Gap Dashboard** — a query-driven view listing every IP asset with no linked signed assignment, and every person (current or past) with no assignment agreement on file. This is a SQL join + a filter, not exotic logic.
- Seed the DB with a handful of realistic fake records (2-3 patents, 2-3 trademarks, 5+ people, mixed signed/missing agreements) so the gap dashboard has something real to show

**Definition of done:** You can add an asset, add a person, add (or skip) an assignment, and the dashboard correctly flags the gaps. This is usable by real counsel as-is, even with nothing else built.

---

## Phase 2 — Deadline Contingency Engine

**Goal:** Nothing falls through the cracks on statutory deadlines.

**What Claude Code should do:**
- Add a `deadlines` table linked to `ip_assets` (deadline_type, due_date, status: upcoming/done/missed, notes)
- Add a rules reference table or config (not hardcoded in app logic) capturing standard deadline types per asset type/jurisdiction — e.g. provisional→non-provisional (12 months from filing), trademark statement of use windows, renewal cycles — so adding/adjusting a rule doesn't require a code change
- Build a function that, given an asset's filing date and type, can auto-generate the relevant deadline rows (manual override always allowed — counsel can edit/delete/add)
- Build an **Upcoming Deadlines** view sorted by urgency (overdue / due in 30 / 60 / 90 days)
- Set up a daily scheduled job (cron, or platform equivalent) that checks for deadlines due soon and sends an email digest

**Definition of done:** Adding a patent with a filing date auto-populates its key deadlines; the urgency view is accurate; you get a real email when something's due soon.

---

## Phase 3 — Coverage Gap Tracking

**Goal:** Make jurisdictional blind spots visible instead of tribal knowledge.

**What Claude Code should do:**
- Ensure `jurisdiction` is a proper structured field on `ip_assets` (not free text — use a fixed list: US, EU, UK, India, etc., extensible)
- Add an `intended_jurisdictions` field/table per asset — lets counsel flag "we plan to expand IP coverage here, not filed yet"
- Build a **Coverage View** per asset showing filed-in vs. intended-but-not-filed jurisdictions side by side
- No search/clash-detection logic yet — this phase is purely about making manually-flagged gaps visible, not automated discovery

**Definition of done:** Counsel can mark an asset as "intend to file in EU" and see it surfaced as an open gap until someone updates the status.

---

## Phase 4 — Audit Trail, Documents, and Filing-Assistance Groundwork

**Goal:** Accountability and document grounding, plus the first real step toward filing assistance.

**What Claude Code should do:**
- Add an audit log (who changed what, when) across the core tables — a simple `audit_log` table populated via app-level hooks, not DB triggers, to keep it portable
- Add document upload/storage (signed agreements, registration certificates) attached to `ip_assets` and `assignment_agreements`, stored in S3 or equivalent, with just metadata (filename, uploaded_by, date) in Postgres
- Only now: build a "generate draft form" feature — pull data already in the DB (asset details, applicant info) into a pre-filled PDF/document draft for a standard filing type. No e-filing integration, just draft generation from existing data.

**Definition of done:** Every change to a record is traceable, signed documents are attached and viewable, and one filing type can produce a pre-filled draft from existing data.

---

## Notes on sequencing
- Phases 1 and 2 are the actual product differentiators — protect these from scope creep before moving on.
- Phase 0 should be boring on purpose; don't let Claude Code add anything domain-specific there.
- Each phase's "Definition of done" is your acceptance test before starting the next phase — don't start Phase N+1 with Phase N half-working.