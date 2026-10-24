# Munim

An AI "munim" (bookkeeper) for small Indian businesses: the merchant tells it what happened (text, khata photo, voice), it forecasts the weekly cash gap, drafts polite payment reminders for approval, and customers pay through a link. Ported from a Next.js/Vercel app.

## Run & Operate

- `artifacts/munim` — Vite + React frontend (preview path `/`)
- `artifacts/api-server` — Express API, serves everything under `/api`
- `pnpm --filter @workspace/api-server run seed` — apply `schema.sql` and (re)seed the 5 demo personas (ramesh, sunita, meena, anwar, suresh). Re-running recreates demo data.
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `DATABASE_URL`, `SESSION_SECRET`
- Optional env (features degrade gracefully / stub without them): `ANTHROPIC_API_KEY` (Tell Munim parsing, reminder wording), `AGENTICORG_*`, `ELEVENLABS_API_KEY` (voice transcription), `PINELABS_*` + `PINELABS_MODE` (`stub` default = test payment links), `ADMIN_KEY` (`/admin?key=`), `AGENT_API_KEY` (`/api/agent/*` bearer auth), `AI_STUB=1`, `APP_URL` (defaults to the Replit domain)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, TanStack Query, Tailwind, framer-motion
- API: Express 5 with raw `pg` queries (no Drizzle for Munim tables)
- Build: esbuild

## Where things live

- DB schema: `artifacts/api-server/src/munim/schema.sql` (source of truth)
- Business logic (ledger, forecast, collections, parser, payments): `artifacts/api-server/src/munim/`
- Original route handlers (Web Request -> Response): `artifacts/api-server/src/munim-routes/`, mounted on Express by `src/routes/munim.ts`
- Page read endpoints: `src/munim-routes/views.ts` (`/api/views/*`)
- Frontend API helpers/types: `artifacts/munim/src/lib/api.ts`; pages in `src/pages/`
- Product/brand brief: `.migration-backup/PRODUCT.md`

## Architecture decisions

- Original Next.js route handlers are kept as-is and run through a small Express adapter; `next/headers` `cookies()` is replaced by an AsyncLocalStorage shim (`src/munim/requestContext.ts`), so `getMerchant()` is unchanged.
- Data that Next server components loaded directly is now exposed as GET `/api/views/*` endpoints with the same queries.
- No DDL at request time: `ensureSchema()` is a no-op; schema is applied by the seed script in dev and carried to production by the publish flow.
- Munim routes parse raw bodies themselves, so their router is mounted before `express.json()`.
- Session: httpOnly `munim_session` cookie (Secure, SameSite=Lax).

## Product

- Landing, signup, demo persona picker
- Home briefing (cash gap forecast), Tell Munim (text/photo/voice -> entries), ledger, customer history, activity log
- Reminders queue: Ask Munim drafts, approve -> pay link + WhatsApp share/QR, reject, mark paid
- Public customer pay page `/p/:token`; internal `/admin?key=`

## User preferences

- The user asked for an improved UI (redesign done in "bahi-khata" ledger style: paper, indigo ink, turmeric accent; green = owed to you, red = you owe/short).

## Gotchas

- `@opentelemetry/api` must stay installed in api-server: the Anthropic SDK imports it and esbuild externalizes `@opentelemetry/*`.
- Seed/schema/fixture files are read relative to `process.cwd()` (`artifacts/api-server`).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
