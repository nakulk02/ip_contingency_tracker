# IP Contingency Tracker

An internal tool for in-house counsel to **surface IP ownership gaps and deadline risk** before they become costly problems.

## The Problem

Startups and growing companies often have incomplete IP assignment chains — contractors without signed agreements, employees missing IP assignments, and patents with no clear ownership trail. These gaps are invisible until a due diligence event (fundraise, acquisition, IPO) turns them into deal-blockers.

## What This Tool Does

**Ownership Gap Dashboard** — See at a glance which IP assets lack signed assignment agreements and which team members are missing coverage. High-priority gaps (current employees/contractors) are flagged automatically.

**IP Asset Registry** — Track patents, trademarks, and other IP assets across jurisdictions with filing dates, status, and registration numbers.

**People & Role Management** — Maintain a roster of founders, employees, contractors, and advisors with their start/end dates and roles.

**Assignment Tracking** — Record company-wide and asset-specific IP assignment agreements, track their status (Signed, Pending, Missing), and link them to people and assets.

**Notes** — Quick notes and reminders for IP-related tasks, checklists, and meeting notes.

## Tech Stack

- **Next.js** (App Router) — React framework
- **PostgreSQL** — Database
- **Prisma** — ORM and migrations
- **NextAuth.js** — Authentication (JWT)
- **Tailwind CSS + shadcn/ui** — UI components
- **Zod** — Validation

## Local Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Set your `DATABASE_URL` to point to your local PostgreSQL instance and generate a `NEXTAUTH_SECRET`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/ip_contingency?schema=public"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

`ANTHROPIC_API_KEY` is also required if you want the Intelligence routes (`/api/v1/intelligence/*`) to work, since they call out to Claude via the `ip-contingency-mcp` package. `LOG_LEVEL` and `REDIS_URL` are optional — see `.env.example` for details.

Required environment variables are validated on startup; if something's missing or malformed, you'll get a clear error listing exactly what to fix instead of a confusing runtime failure.

### 3. Run database migrations and seed

```bash
npx prisma migrate deploy
npm run seed
```

The seed script wipes and repopulates IP assets, people, and assignment agreements — safe to re-run any time you want a clean demo dataset. To also reset migrations from scratch, use `npm run db:reset` instead (this drops and recreates the database).

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Credentials

After seeding, you can log in with:

- **Email:** `demo@example.com`
- **Password:** `password123`

The seed data includes sample IP assets, people with various roles, and assignment agreements — including deliberate gaps that appear on the dashboard.

## License

Private — All rights reserved.
