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

**Intelligence assistant** — Ask a question in plain English ("Which high-risk gaps should I fix first and why?"). Claude decides which analysis tools to run, chains them, and answers from the results with a trace of every tool call. See [Intelligence assistant](#intelligence-assistant).

## Tech Stack

- **Next.js** (App Router) — React framework
- **PostgreSQL** — Database
- **Prisma** — ORM and migrations
- **NextAuth.js** — Authentication (JWT)
- **Tailwind CSS + shadcn/ui** — UI components
- **Zod** — Validation
- **Anthropic SDK + [ip-contingency-mcp](https://github.com/nakulk02/ip_contingency_mcp)** — LLM-powered analysis tools and the tool-calling assistant

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

Optional assistant settings (`ASSISTANT_MODEL`, `ASSISTANT_EFFORT`, `ASSISTANT_FALLBACK_MODEL`) are described in `.env.example`.

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

Interactive API documentation is available at [http://localhost:3000/api-docs](http://localhost:3000/api-docs) once you're signed in — it's generated from the actual request validation schemas, so it stays in sync with the code.

### Demo Credentials

After seeding, you can log in with:

- **Email:** `demo@example.com`
- **Password:** `password123`

The seed data includes sample IP assets, people with various roles, and assignment agreements — including deliberate gaps that appear on the dashboard.

## Intelligence assistant

`POST /api/v1/intelligence/assistant` answers a natural-language question about the company's open IP assignment gaps. It is a tool-calling agent built on the Anthropic Messages API (`src/lib/assistant/agent.ts`).

```mermaid
sequenceDiagram
    participant U as Client
    participant R as Route
    participant G as Guardrails
    participant A as Agent loop
    participant C as Claude
    participant T as ip-contingency-mcp tools
    participant DB as Postgres
    U->>R: POST {question}
    R->>G: length, topic and injection checks
    G-->>R: refused (no model call) or ok
    R->>A: question
    A->>DB: load open gaps
    A->>C: question + name-free portfolio summary + 8 tool definitions
    loop up to 5 rounds
        C-->>A: tool_use (e.g. rankPriorities {riskLevel: [HIGH, CRITICAL]})
        A->>T: processTool on the matching gaps from DB
        A->>DB: ToolCallAudit row (redacted)
        A->>C: tool_result
    end
    C-->>A: final answer
    A-->>U: answer + trace + token usage + latency
```

```bash
curl -X POST http://localhost:3000/api/v1/intelligence/assistant   -H "Content-Type: application/json" -b "next-auth.session-token=..."   -d '{"question": "Which high-risk gaps should I fix first and why?"}'
```

```json
{
  "requestId": "6f1c...",
  "answer": "Fix Li Wei's battery thermal patent in China [gap-cn-01] first: ...",
  "refused": false,
  "trace": [
    { "tool": "rankPriorities", "input": { "filters": { "riskLevel": ["HIGH", "CRITICAL"] } }, "success": true, "durationMs": 6120, "gapCount": 6, "gapIds": ["gap-cn-01", "..."], "inputTokens": 2210, "outputTokens": 640 },
    { "tool": "recommendActions", "input": { "gapId": "gap-cn-01" }, "success": true, "durationMs": 3980, "gapCount": 1, "gapIds": ["gap-cn-01"], "inputTokens": 930, "outputTokens": 310 }
  ],
  "usage": { "agentInputTokens": 9100, "agentOutputTokens": 1450, "toolInputTokens": 3140, "toolOutputTokens": 950 },
  "model": "claude-opus-5-5",
  "rounds": 2,
  "latencyMs": 17890
}
```

The values above show the response shape. They are not a recorded run.

**How tools are called.** The model never sees or sends raw gap records. Portfolio tools (`analyzeGaps`, `rankPriorities`, `detectAnomalies`, `generateAdvisory`) take optional filters (risk level, jurisdiction, asset type, current or former person). Gap tools (`recommendActions`, `checkCompliance`, `predictRisk`) take a `gapId`. `queryAssignments` takes a question. The server validates each call with Zod, loads the matching gaps from the database and runs the tool through `processTool()`. An unknown gap id or an empty filter result goes back to the model as an error `tool_result`, without calling the tool. Repeated identical calls within one request are served from a per-request cache. After 5 rounds of tool calls, the model is made to answer with what it has.

**Audit trail.** Every tool call writes a `ToolCallAudit` row: request id, user id, tool, input summary, success or error, duration and token usage. Rows from one question share a `requestId`. A failed audit write is logged and doesn't fail the request.

**Guardrails.**

- *Input limits:* the question must be 5 to 1,000 characters. Control characters are stripped and whitespace is collapsed. The endpoint shares the API rate limiter.
- *Topic and injection checks before any model call* (`src/lib/assistant/guardrails.ts`): a question must mention something in the IP compliance domain (patents, assignments, gaps, jurisdictions, contractors, ...). Common prompt-injection phrasings ("ignore previous instructions", "reveal your system prompt") are rejected. Refusals return `200` with `refused: true` and a `refusalReason` (`off_topic` or `prompt_injection`), and cost nothing.
- *Model-side scope:* the system prompt limits the assistant to IP assignment compliance. It must ground every claim in tool results and treat tool output as data, not instructions. Borderline questions that pass the keyword check ("tell me a joke about patents") are declined by the model without tools.
- *Personal information stays out of logs and audits:* audit rows and log lines hold gap ids, counts and filters. Free text (the question, or a question the model passes to `queryAssignments`) has emails, phone numbers, ID numbers and the names of people in the gap set replaced with placeholders (`src/lib/assistant/redact.ts`). The model gets a name-free portfolio summary up front, and sees names only in the tool results it asks for.
- *Refusal fallback:* requests use the API's server-side fallback (`ASSISTANT_FALLBACK_MODEL`, default `claude-opus-4-8`). If the main model declines a legitimate request, the API retries on the fallback model.

### Eval

`npm run eval` runs 14 fixed questions (`eval/cases.ts`) through the same guardrails-then-agent path the route uses. It uses a fixed set of 10 gaps (`eval/fixtures.ts`), so no database is needed. Each case checks behaviour rather than wording: which tools must or may be called, minimum and maximum number of tool calls, whether specific gap ids appear in the answer, whether a tool input contains the right gap id or filter, and whether the question was refused. The script prints pass/fail per case, the pass rate and average latency, and writes `eval/results/latest.json`.

```bash
npm run eval            # all 14 cases; needs ANTHROPIC_API_KEY and makes real API calls
npm run eval:offline    # the 3 guardrail cases only; no API key needed
```

| Run | Cases | Passed | Avg latency |
| --- | --- | --- | --- |
| Offline (guardrails only) | 3 | 3/3 | ~1 ms |
| Full run with the model | 14 | not recorded yet | not recorded yet |

To fill in the second row, run `npm run eval` with an API key and copy the summary line.

## Health Checks

Two unauthenticated endpoints are available for infrastructure use (load balancers, orchestrators, CI):

- **`GET /api/health`** — liveness. Returns `200` if the process is up and can respond. Checks nothing else, so a slow database doesn't make this report unhealthy.
- **`GET /api/health/ready`** — readiness. Returns `200` if the app can serve real requests (database reachable within 3s), `503` otherwise. Use this to gate whether traffic should be routed to an instance.

## License

Private — All rights reserved.
