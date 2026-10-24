# Munim — an AI munim for India's small businesses

> Tell it what happened. It tells you what to do. Get paid before you have to pay.

AI Builders Day 2026 (Airtribe × Pine Labs) · Track 02, AI for Commerce · Team: Lilekha, Vatsal, Nitin

**Live:** https://munim-swhc.onrender.com

## How it works

1. **Tell** — the merchant speaks, snaps the khata page, or types what happened. AI turns it into ledger entries and reads them back to confirm.
2. **Today** — code (never the LLM) computes the week's cash gap: what the merchant owes suppliers vs. what customers will likely pay in time.
3. **Collections agent** (AgenticOrg by Pine Labs) — picks who to remind and drafts polite messages. It can only create drafts.
4. **Human approval** — the merchant approves each reminder. Only then is a Pine Labs payment link created and shared (WhatsApp / QR).
5. **Paid** — the customer pays through the link; the due clears itself and every step lands in the activity log.

## Stack

pnpm monorepo · React + Vite frontend (`artifacts/munim`) · Express API (`artifacts/api-server`) · Postgres · AgenticOrg LLM + agent · Pine Labs payment links · ElevenLabs speech-to-text · Render.

## Run locally

```bash
pnpm install
DATABASE_URL=postgres://... pnpm --filter @workspace/api-server run seed   # schema + 5 demo personas
npm run build && PORT=4000 DATABASE_URL=postgres://... npm start          # http://localhost:4000
npm test
```

Key env: `DATABASE_URL`, `AGENTICORG_API_KEY`, `AGENTICORG_AGENT_ID`, `PINELABS_MODE` (`stub` | `test` | `live`) with `PINELABS_CLIENT_ID` / `PINELABS_CLIENT_SECRET`, `ELEVENLABS_API_KEY`, `ADMIN_KEY` (`/admin?key=`). Public links use `APP_URL`, falling back to Render's `RENDER_EXTERNAL_URL`.
